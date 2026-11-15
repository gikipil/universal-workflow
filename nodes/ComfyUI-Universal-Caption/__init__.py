"""Local dataset captions for Universal Workflow. Copyright gikipil 2026, AGPL-3.0-only."""
import gc
import hashlib
import json
import os
from pathlib import Path
import tempfile
import uuid

EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'}
SESSIONS = {}
DEFAULTS = dict(engine='qwen', source='single', folder='', image_name='', trigger='',
                instruction='Write a concise, factual English caption for this training image. Describe only visible clothing, pose, expression, framing, lighting and environment. Do not invent details or identify the person. Return only the caption.',
                max_tokens=256, save_txt=False, skip_existing=True,
                florence_task='detailed_caption', quantization='8-bit (Balanced)',
                models=dict(florence='MiaoshouAI/Florence-2-large-PromptGen-v2.0',
                            qwen='Qwen3-VL-4B-Instruct', joy='fancyfeast/llama-joycaption-beta-one-hf-llava'))


def settings(value):
    v = json.loads(value) if isinstance(value, str) else dict(value)
    c = {**DEFAULTS, **v, 'models': {**DEFAULTS['models'], **v.get('models', {})}}
    if c['engine'] not in ('florence', 'qwen', 'joy') or c['source'] not in ('single', 'folder'):
        raise ValueError('Неверный режим captioning.')
    if type(c['max_tokens']) is not int or not 32 <= c['max_tokens'] <= 2048:
        raise ValueError('Длина подписи: от 32 до 2048 токенов.')
    for k in ('save_txt', 'skip_existing'):
        if type(c[k]) is not bool:
            raise ValueError('Неверные настройки сохранения.')
    if c['florence_task'] not in ('caption', 'detailed_caption', 'more_detailed_caption'):
        raise ValueError('Неверная задача Florence.')
    if c['quantization'] not in ('8-bit (Balanced)', '4-bit (VRAM-friendly)', 'None (FP16)'):
        raise ValueError('Неверный формат модели.')
    for k in ('folder', 'image_name', 'trigger', 'instruction'):
        if not isinstance(c[k], str) or len(c[k]) > 20000:
            raise ValueError('Неверное текстовое поле.')
    if any(not isinstance(x, str) or not x.strip() for x in c['models'].values()):
        raise ValueError('Выбери модели в общих настройках.')
    return c


def caption_path(image):
    target = image.with_suffix('.txt')
    if target.is_symlink():
        raise ValueError('Сохранение поверх ссылки .txt запрещено: ' + target.name)
    return target


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def read_caption(image):
    p = caption_path(image)
    return p.read_text(encoding='utf-8-sig') if p.exists() else None


def write_caption(image, text, expected):
    """Compare before writing; never silently overwrite an externally edited caption."""
    path = caption_path(image)
    old = read_caption(image)
    if (digest(old) if old is not None else None) != expected:
        raise ValueError('Подпись изменена другим приложением: ' + path.name + '. Обнови список.')
    if not isinstance(text, str) or len(text) > 100000:
        raise ValueError('Неверная подпись.')
    name = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', newline='\n',
                                         dir=path.parent, suffix='.caption-tmp', delete=False) as f:
            name = f.name
            f.write(text.strip() + '\n')
        os.replace(name, path)
    finally:
        if name and os.path.exists(name):
            os.unlink(name)
    return digest(read_caption(image))


def collect(c):
    if c['source'] == 'folder':
        folder = Path(c['folder'].strip()).expanduser()
        if not folder.is_absolute() or not folder.is_dir():
            raise ValueError('Укажи существующую абсолютную папку на ПК с ComfyUI.')
        files = sorted((p.resolve() for p in folder.iterdir() if p.is_file() and not p.is_symlink()
                        and p.suffix.lower() in EXTENSIONS), key=lambda p: p.name.casefold())
    else:
        import folder_paths
        name = c['image_name']
        if not name or name == 'universal-local-empty-mask.png':
            raise ValueError('Загрузи одно фото или выбери папку.')
        file = Path(folder_paths.get_annotated_filepath(name)).resolve()
        if not file.is_file() or file.suffix.lower() not in EXTENSIONS:
            raise ValueError('Изображение не найдено.')
        files = [file]
    if not files:
        raise ValueError('В папке нет поддерживаемых изображений.')
    targets = [str(caption_path(p)).casefold() for p in files]
    if len(set(targets)) != len(targets):
        raise ValueError('Есть фото с одинаковым именем и разными расширениями: их .txt совпадут. Переименуй фото.')
    return files


def new_session(files):
    key = uuid.uuid4().hex
    rows = []
    for p in files:
        text = read_caption(p)
        rows.append(dict(path=p, name=p.name, caption=text or '',
                         expected=digest(text) if text is not None else None,
                         status='existing' if text is not None else 'pending'))
    # Keep recent scans without unlimited retention.
    while len(SESSIONS) >= 32:
        del SESSIONS[next(iter(SESSIONS))]
    SESSIONS[key] = rows
    return key


def public_rows(key):
    return [dict(index=i, name=r['name'], caption=r['caption'], status=r['status'],
                 image='/universal-caption/image?session=' + key + '&index=' + str(i))
            for i, r in enumerate(SESSIONS[key])]


def call_node(name, instance_cache=None, **overrides):
    import nodes
    cls = nodes.NODE_CLASS_MAPPINGS.get(name)
    if cls is None:
        raise RuntimeError('Не установлена нода ' + name)
    if instance_cache is not None:
        if name not in instance_cache:
            instance_cache[name] = cls()
        instance = instance_cache[name]
    else:
        instance = cls()
    kwargs = {}
    for group in ('required', 'optional'):
        for key, spec in cls.INPUT_TYPES().get(group, {}).items():
            if key in overrides:
                kwargs[key] = overrides[key]
            elif group == 'required':
                options = spec[1] if len(spec) > 1 else {}
                if 'default' in options:
                    kwargs[key] = options['default']
                elif isinstance(spec[0], list):
                    kwargs[key] = spec[0][0]
    value = getattr(instance, cls.FUNCTION)(**kwargs)
    return value.get('result') if isinstance(value, dict) else value


class UniversalCaptionTask:
    @classmethod
    def INPUT_TYPES(cls):
        return {'required': {'settings': ('STRING', {'default': json.dumps(DEFAULTS), 'multiline': True})},
                'hidden': {'unique_id': 'UNIQUE_ID'}}

    RETURN_TYPES = ('STRING',)
    FUNCTION = 'run'
    CATEGORY = 'Universal Workflow/Dataset'
    OUTPUT_NODE = True

    @classmethod
    def IS_CHANGED(cls, **kwargs):
        return float('nan')  # Explicit reruns must notice external image/txt changes.

    def run(self, settings, unique_id=None):
        c = globals()['settings'](settings)
        files = collect(c)
        session = new_session(files)
        rows = SESSIONS[session]
        def emit(index=None):
            if unique_id is not None:
                from server import PromptServer
                data = dict(node=str(unique_id), session=session, value=0 if index is None else index+1, max=len(files))
                if index is None:
                    data['rows'] = public_rows(session)
                else:
                    data['row'] = public_rows(session)[index]
                PromptServer.instance.send_sync('universal-caption-progress', data)
        emit()
        pending = [i for i, r in enumerate(rows) if not (c['skip_existing'] and r['expected'] is not None)]
        # No model downloads, imports or GPU allocation if everything is skipped.
        florence = joy_model = joy_processor = None
        instances = {}
        try:
            if pending:
                import torch
                import numpy as np
                from PIL import Image, ImageOps
                from comfy.utils import ProgressBar
                import comfy.model_management as mm
                # Caption models are not diffusion ModelPatchers. Release idle Comfy
                # weights before their load; this does not alter workflow settings.
                mm.unload_all_models()
                mm.soft_empty_cache()
                progress = ProgressBar(len(files))
                if c['engine'] == 'florence':
                    florence = call_node('DownloadAndLoadFlorence2Model', model=c['models']['florence'], precision='bf16')[0]
                elif c['engine'] == 'joy':
                    from transformers import AutoProcessor, LlavaForConditionalGeneration, BitsAndBytesConfig
                    import folder_paths
                    cache = str(Path(folder_paths.models_dir) / 'LLM' / 'JoyCaption')
                    opts = dict(cache_dir=cache, torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
                                device_map='auto', use_safetensors=True)
                    if torch.cuda.is_available() and c['quantization'] != 'None (FP16)':
                        opts['quantization_config'] = BitsAndBytesConfig(load_in_8bit=c['quantization'].startswith('8'), load_in_4bit=c['quantization'].startswith('4'))
                    joy_processor = AutoProcessor.from_pretrained(c['models']['joy'], cache_dir=cache)
                    joy_model = LlavaForConditionalGeneration.from_pretrained(c['models']['joy'], **opts).eval()
                for i, row in enumerate(rows):
                    mm.throw_exception_if_processing_interrupted()
                    if i not in pending:
                        row['status'] = 'skipped'
                        progress.update_absolute(i + 1)
                        emit(i)
                        continue
                    with Image.open(row['path']) as im:
                        picture = ImageOps.exif_transpose(im).convert('RGB')
                        tensor = torch.from_numpy(np.array(picture).astype(np.float32) / 255.0).unsqueeze(0)
                        if c['engine'] == 'florence':
                            value = call_node('Florence2Run', image=tensor, florence2_model=florence, text_input='',
                                              task=c['florence_task'], fill_mask=False, keep_model_loaded=True,
                                              max_new_tokens=c['max_tokens'], num_beams=3, do_sample=False, seed=1)[2]
                        elif c['engine'] == 'qwen':
                            value = call_node('AILab_QwenVL', instance_cache=instances, image=tensor, model_name=c['models']['qwen'],
                                              quantization=c['quantization'], attention_mode='auto',
                                              preset_prompt='🖼️ Detailed Description', custom_prompt=c['instruction'],
                                              max_tokens=c['max_tokens'], keep_model_loaded=True, seed=1)[0]
                        else:
                            conversation = [{'role': 'system', 'content': 'You are a helpful image captioner.'},
                                            {'role': 'user', 'content': c['instruction']}]
                            prompt = joy_processor.apply_chat_template(conversation, tokenize=False, add_generation_prompt=True)
                            inputs = joy_processor(text=[prompt], images=[picture], return_tensors='pt').to(joy_model.device)
                            inputs['pixel_values'] = inputs['pixel_values'].to(joy_model.dtype)
                            with torch.inference_mode():
                                generated = joy_model.generate(**inputs, max_new_tokens=c['max_tokens'], do_sample=False)
                            value = joy_processor.tokenizer.decode(generated[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
                    if isinstance(value, list):
                        value = ' '.join(str(x) for x in value)
                    text = str(value).strip()
                    if not text:
                        raise ValueError('Пустая подпись: ' + row['name'])
                    row['caption'] = (c['trigger'].strip() + ', ' if c['trigger'].strip() else '') + text
                    row['status'] = 'generated'
                    if c['save_txt']:
                        row['expected'] = write_caption(row['path'], row['caption'], row['expected'])
                        row['status'] = 'saved'
                    progress.update_absolute(i + 1)
                    emit(i)
            else:
                for row in rows:
                    row['status'] = 'skipped'
            result = dict(session=session, rows=public_rows(session))
            return {'ui': {'text': [json.dumps(result, ensure_ascii=False)]}, 'result': (json.dumps(result, ensure_ascii=False),)}
        finally:
            for instance in instances.values():
                if hasattr(instance, 'clear'):
                    instance.clear()
            if florence is not None and hasattr(florence.get('model'), 'to'):
                florence['model'].to('cpu')
            del joy_model, joy_processor, florence
            gc.collect()
            if 'torch' in locals() and torch.cuda.is_available():
                torch.cuda.empty_cache()


NODE_CLASS_MAPPINGS = {'UniversalCaptionTask': UniversalCaptionTask}
NODE_DISPLAY_NAME_MAPPINGS = {'UniversalCaptionTask': '📝 Dataset · Local Caption'}


def register_routes():
    from aiohttp import web
    from server import PromptServer

    @PromptServer.instance.routes.post('/universal-caption/scan')
    async def scan(request):
        try:
            c = settings(await request.json())
            key = new_session(collect(c))
            return web.json_response(dict(session=key, rows=public_rows(key)))
        except (ValueError, OSError, UnicodeError) as e:
            return web.json_response({'error': str(e)}, status=400)

    @PromptServer.instance.routes.get('/universal-caption/image')
    async def image(request):
        try:
            row = SESSIONS[request.query['session']][int(request.query['index'])]
            return web.FileResponse(row['path'])
        except (KeyError, IndexError, ValueError):
            raise web.HTTPNotFound()

    @PromptServer.instance.routes.post('/universal-caption/save')
    async def save(request):
        try:
            v = await request.json()
            row = SESSIONS[v['session']][int(v['index'])]
            row['expected'] = write_caption(row['path'], v['caption'], row['expected'])
            row['caption'] = v['caption'].strip()
            row['status'] = 'saved'
            return web.json_response({'ok': True})
        except (KeyError, IndexError, ValueError, OSError) as e:
            return web.json_response({'error': str(e)}, status=400)


register_routes()
