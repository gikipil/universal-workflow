"""Universal Workflow memory cleanup. Copyright gikipil 2026, AGPL-3.0-only."""
import functools
import gc
import inspect
import logging
import traceback

from aiohttp import web
import execution
import comfy.model_management as mm
from server import PromptServer

MARKER = "universal_memory_cleanup"


def requested(extra_data):
    if not isinstance(extra_data, dict):
        return False
    pnginfo = extra_data.get("extra_pnginfo")
    workflow = pnginfo.get("workflow") if isinstance(pnginfo, dict) else None
    extra = workflow.get("extra") if isinstance(workflow, dict) else None
    return isinstance(extra, dict) and extra.get(MARKER) is True



def release_memory(executor):
    # Keep executor.caches and cached node outputs/instances intact. Native managed
    # model offload preserves ModelPatchers so cached loaders remain usable.
    # Do not invoke plugin hard-unload hooks which can destroy cached bundles.
    for device in mm.get_all_torch_devices():
        mm.free_memory(1e30, device)
    gc.collect()
    mm.soft_empty_cache(force=True)


def install(executor_class=execution.PromptExecutor):
    original = executor_class.execute
    if getattr(original, "universal_memory_cleanup", False):
        return
    signature = inspect.signature(original)

    @functools.wraps(original)
    def execute(self, *args, **kwargs):
        bound = signature.bind(self, *args, **kwargs)
        extra = bound.arguments.get("extra_data") or {}
        if not requested(extra):
            return original(self, *args, **kwargs)
        prompt_id = bound.arguments.get("prompt_id")
        try:
            logging.info("[Universal Workflow] Offloading managed models and releasing unused memory; retaining node results before %s", prompt_id)
            release_memory(self)
        except Exception as error:
            # Do not let a cleanup failure terminate ComfyUI's queue worker.
            self.server.client_id = extra.get("client_id")
            self.status_messages = []
            self.success = False
            self.history_result = {"outputs": {}, "meta": {}}
            self.add_message("execution_start", {"prompt_id": prompt_id}, broadcast=False)
            self.add_message("execution_error", {
                "prompt_id": prompt_id, "node_id": "universal_memory_cleanup",
                "node_type": "UniversalMemoryCleanup", "executed": [],
                "exception_message": "Не удалось очистить память: " + str(error),
                "exception_type": type(error).__name__,
                "traceback": traceback.format_exc().splitlines(True),
                "current_inputs": {}, "current_outputs": [],
            }, broadcast=False)
            logging.exception("[Universal Workflow] Memory cleanup failed")
            return
        return original(self, *args, **kwargs)

    execute.universal_memory_cleanup = True
    executor_class.execute = execute


install()


@PromptServer.instance.routes.get("/universal-memory/status")
async def status(request):
    return web.json_response({"ready": True, "version": 2, "preserves_results": True})


NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}


def create_model_directories(base_path, models_path):
    """Create only catalog directories; preserve every existing file."""
    from pathlib import Path, PurePosixPath
    base, models = Path(base_path).resolve(), Path(models_path).resolve()
    targets = []
    for relative in MODEL_DIRECTORIES:
        parts = PurePosixPath(relative).parts
        if not parts or any(p in ('.', '..') for p in parts):
            raise ValueError('Invalid catalog destination')
        if parts[0] == 'models':
            root, target = models, models.joinpath(*parts[1:]).resolve()
        elif parts[:3] == ('custom_nodes', 'comfyui_controlnet_aux', 'ckpts'):
            root, target = base, base.joinpath(*parts).resolve()
        else:
            raise ValueError('Unsupported catalog destination')
        if target == root or not target.is_relative_to(root):
            raise ValueError('Catalog destination is outside the model directories')
        if target.exists() and not target.is_dir():
            raise ValueError('A file occupies a model directory')
        targets.append(target)
    created = 0
    for target in targets:
        exists = target.exists()
        target.mkdir(parents=True, exist_ok=True)
        created += not exists
    return {'ok': True, 'total': len(targets), 'created': created}


@PromptServer.instance.routes.post('/universal/models/folders')
async def model_folders(request):
    import folder_paths
    try:
        return web.json_response(create_model_directories(folder_paths.base_path,
                                                         folder_paths.models_dir))
    except (OSError, ValueError):
        logging.exception('[Universal Workflow] Could not create model directories')
        return web.json_response({'ok': False, 'error': 'Не удалось создать каталоги.'}, status=400)


# Fixed destinations from the shipped model catalog; no client-provided paths.
MODEL_DIRECTORIES = ['custom_nodes/comfyui_controlnet_aux/ckpts/yzd-v/DWPose', 'models/LLM/Florence-2-large-PromptGen-v2.0', 'models/LLM/JoyCaption/llama-joycaption-beta-one-hf-llava', 'models/LLM/Qwen/Qwen3-VL-4B-Instruct', 'models/RMBG/BEN2', 'models/RMBG/RMBG-2.0', 'models/SEEDVR2', 'models/TTS/Qwen3-TTS/Qwen3-TTS-12Hz-1.7B-VoiceDesign', 'models/TTS/Qwen3-TTS/Qwen3-TTS-12Hz-1.7B-VoiceDesign/speech_tokenizer', 'models/audio_encoders/openai_whisper-large-v3', 'models/checkpoints', 'models/diffusion_models/ACE', 'models/diffusion_models/Krea2', 'models/diffusion_models/MiniMax', 'models/diffusion_models/Qwen', 'models/diffusion_models/Qwen2.1', 'models/diffusion_models/Zimage', 'models/higgsv3tts/higgs-audio-v3-tts-4b', 'models/latent_upscale_models', 'models/loras/Krea2', 'models/loras/MiniMax', 'models/text_encoders/Ace', 'models/text_encoders/Krea2', 'models/text_encoders/MiniMax', 'models/text_encoders/Qwen', 'models/text_encoders/Qwen2.1', 'models/text_encoders/ZImage', 'models/ultralytics/bbox', 'models/upscale_models', 'models/vae/ACE', 'models/vae/Krea2', 'models/vae/MiniMax', 'models/vae/Qwen2.1', 'models/vae/ZImage']
