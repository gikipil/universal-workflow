# SPDX-License-Identifier: AGPL-3.0-only
"""Read-only checks for locally selected directory-based model bundles."""
import json
import re
from pathlib import Path


def _inside(root, value):
    root = Path(root).resolve()
    target = (root / value).resolve()
    if not target.is_relative_to(root):
        raise ValueError('Model path is outside its model directory')
    return target


def _complete(path, files):
    if not path.is_dir():
        return False
    if files:
        return all(_inside(path, name).is_file() for name in files)
    if not (path / 'config.json').is_file():
        return False
    indexes = list(path.glob('*.index.json'))
    if indexes:
        for index in indexes:
            data = json.loads(index.read_text(encoding='utf-8'))
            weights = set(data.get('weight_map', {}).values())
            if not weights or not all(_inside(path, name).is_file() for name in weights):
                return False
        return True
    weights = [p for ext in ('*.safetensors', '*.bin', '*.pt', '*.pth') for p in path.glob(ext) if p.is_file()]
    # A half-downloaded sharded bundle is not usable without its weight index.
    return bool(weights) and not any(re.search(r'-\d+-of-\d+\.', p.name) for p in weights)


def selected_status(models_root, kind, value, files=None):
    """Mirror loader locations without importing models or downloading anything."""
    root = Path(models_root).resolve()
    value = str(value).replace('\\', '/').strip()
    if len(value) > 2048 or not value:
        raise ValueError('Invalid model selection')
    if files is not None and (not isinstance(files, list) or len(files) > 128 or any(not isinstance(f, str) or len(f) > 512 for f in files)):
        raise ValueError('Invalid bundle file list')
    if kind == 'higgs':
        base = root / 'higgsv3tts'
        if value == 'Higgs Audio v3 TTS 4B - bosonai (auto-download)':
            official = base / 'higgs-audio-v3-tts-4b'
            path = official if (official / 'model.safetensors').is_file() else base
        elif value == 'local root: ComfyUI/models/higgsv3tts':
            path = base
        else:
            path = _inside(base, value)
    elif kind == 'whisper':
        name = value.split(' (auto-download)')[0]
        path = _inside(root / 'audio_encoders', 'openai_' + name if ' (auto-download)' in value else value)
    elif kind == 'florence':
        path = _inside(root / 'LLM', value.rsplit('/', 1)[-1])
    elif kind == 'qwen':
        path = _inside(root / 'LLM' / 'Qwen', value)
    elif kind == 'joy':
        # Local selections can use any location under the configured models root.
        if Path(value).is_absolute():
            path = _inside(root, value)
        else:
            local = _inside(root, value)
            cache = root / 'LLM' / 'JoyCaption'
            path = local if local.is_dir() else _inside(cache, value.rsplit('/', 1)[-1])
            if not path.is_dir():
                snapshots = _inside(cache, 'models--' + value.replace('/', '--')) / 'snapshots'
                found = snapshots.is_dir() and any(_complete(p, files) for p in snapshots.iterdir() if p.is_dir())
                return {'missing': not bool(found)}
    elif kind == 'tts':
        path = root / 'TTS' / 'Qwen3-TTS' / 'Qwen3-TTS-12Hz-1.7B-VoiceDesign'
    else:
        raise ValueError('Unsupported model kind')
    return {'missing': not _complete(path, files)}
