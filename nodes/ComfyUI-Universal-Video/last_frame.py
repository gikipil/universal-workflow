# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (c) 2026 gikipil
"""Extract the final decoded frame of a local result, without loading models."""
from pathlib import Path
import uuid


def extract_last_frame(ref, directories, input_directory):
    if not isinstance(ref, dict) or ref.get('type') not in directories:
        raise ValueError('Invalid video result')
    name, subfolder = ref.get('filename'), ref.get('subfolder', '')
    if not isinstance(name, str) or not name or Path(name).name != name or not isinstance(subfolder, str):
        raise ValueError('Invalid video result')
    root = Path(directories[ref['type']]).resolve()
    source = (root / subfolder / name).resolve()
    if not source.is_relative_to(root) or not source.is_file():
        raise ValueError('Video result is unavailable')
    if source.suffix.lower() not in ('.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v', '.ogv'):
        raise ValueError('Invalid video result')
    import av
    # Decode sequentially: seeking near duration can return an earlier keyframe.
    # Keep only one frame in memory, including when the clip has no frame count.
    last = None
    with av.open(str(source)) as container:
        if not container.streams.video:
            raise ValueError('Video has no frames')
        for frame in container.decode(video=0):
            last = frame
        if last is None:
            raise ValueError('Video has no frames')
        image = last.to_image().convert('RGB')
    directory = Path(input_directory) / 'universal-video-frames'
    directory.mkdir(parents=True, exist_ok=True)
    filename = 'last-frame-' + uuid.uuid4().hex + '.png'
    image.save(directory / filename, format='PNG')
    return {'filename': filename, 'subfolder': directory.name, 'type': 'input'}
