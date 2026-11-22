# SPDX-License-Identifier: AGPL-3.0-only
"""Explicit, user-requested downloads from the recommendation catalog. No model loading."""
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import queue
import threading
import time
import urllib.error
import urllib.request
import uuid


def catalog():
    groups = json.loads(Path(__file__).with_name('model_catalog.json').read_text(encoding='utf-8'))['groups']
    return {f"{g['id']}:{i}": m for g in groups for i, m in enumerate(g['models'])}


def destination(base, models, relative):
    parts = PurePosixPath(relative).parts
    if not parts or any(p in ('.', '..') or '\\' in p or ':' in p for p in parts):
        raise ValueError('Invalid catalog path')
    if parts[0] == 'models':
        root, target = Path(models).resolve(), Path(models).joinpath(*parts[1:]).resolve()
    elif parts[:3] == ('custom_nodes', 'comfyui_controlnet_aux', 'ckpts'):
        root = (Path(base) / 'custom_nodes/comfyui_controlnet_aux/ckpts').resolve()
        target = Path(base).joinpath(*parts).resolve()
    else:
        raise ValueError('Unsupported catalog path')
    if target == root or not target.is_relative_to(root):
        raise ValueError('Model destination is outside its model directory')
    return target


def download_file(file, target, progress, cancelled, opener=urllib.request.urlopen):
    """Keep an existing file; publish a new file only after a complete download."""
    from urllib.parse import urlsplit
    url = urlsplit(file['url'])
    if url.scheme != 'https' or url.hostname not in ('huggingface.co', 'civitai.com'):
        raise ValueError('Unsupported download source')
    if target.is_file() and target.stat().st_size > 0:
        progress(0, 0, True)
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    part = target.with_name(target.name + '.universal-download.part')
    if part.is_symlink():
        raise ValueError('Invalid partial file')
    metadata = part.with_name(part.name + '.json')
    if metadata.is_symlink():
        raise ValueError('Invalid partial metadata file')
    try:
        previous = json.loads(metadata.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        previous = {}
    offset = part.stat().st_size if part.exists() and previous.get('etag') and previous.get('url') == file['url'] else 0
    headers = {'User-Agent': 'Universal-Workflow-Model-Downloader/1.2'}
    if offset:
        headers['Range'] = f'bytes={offset}-'
        headers['If-Range'] = previous['etag']
    # Browser cookies/tokens are never read or included in requests or logs.
    request = urllib.request.Request(file['url'], headers=headers)
    try:
        response = opener(request, timeout=30)
    except urllib.error.HTTPError as error:
        if error.code == 416 and offset:
            # A completed/interrupted partial may already reach EOF. Reset only
            # our own staging files; never remove or overwrite an existing model.
            part.write_bytes(b'')
            metadata.write_text('{}', encoding='utf-8')
            return download_file(file, target, progress, cancelled, opener)
        raise
    with response:
        status = response.status
        if status not in (200, 206):
            raise ValueError('The download server did not return a file')
        if 'text/html' in response.headers.get('Content-Type', '').lower():
            raise ValueError('The server returned a login page instead of model files')
        if status == 206 and not response.headers.get('Content-Range', '').startswith(f'bytes {offset}-'):
            raise ValueError('The server returned an invalid download range')
        etag = response.headers.get('ETag', '')
        if status == 206 and etag and previous.get('etag') != etag:
            raise ValueError('Model file changed on the server; restart the download')
        if status == 200:
            offset = 0
        length = int(response.headers.get('Content-Length') or 0)
        total = offset + length if length else 0
        if length and shutil.disk_usage(target.parent).free < length + 1024 * 1024:
            raise OSError('Not enough free disk space for this file')
        received = 0
        metadata.write_text(json.dumps({'url': file['url'], 'etag': etag}), encoding='utf-8')
        with part.open('ab' if offset else 'wb') as out:
            while True:
                if cancelled.is_set():
                    raise InterruptedError('Download cancelled; partial file retained for resume')
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
                received += len(chunk)
                progress(offset + received, total, False)
        if not received or length and received != length:
            raise OSError('Incomplete download; retry to resume')
    # Never replace a model another process/user supplied during the download.
    if target.exists() and target.stat().st_size > 0:
        return
    os.replace(part, target)


class Downloads:
    def __init__(self):
        self.queue = queue.Queue()
        self.worker = None
        self.lock = threading.Lock()
        self.jobs = {}

    def start(self, base, models, model_id, file_index=None):
        model = catalog().get(model_id)
        if model is None:
            raise ValueError('Unknown recommended model')
        files = model['files']
        if file_index is not None:
            if type(file_index) is not int or not 0 <= file_index < len(files):
                raise ValueError('Invalid catalog file')
            files = [files[file_index]]
        targets = [(f, destination(base, models, f['path'])) for f in files]
        with self.lock:
            for job in self.jobs.values():
                if job['model_id'] == model_id and job['file_index'] == file_index and job['state'] in ('queued', 'downloading'):
                    return self.public(job)
            if sum(j['state'] in ('queued', 'downloading') for j in self.jobs.values()) >= 24:
                raise ValueError('Too many pending downloads')
            # Bound retained history, preserving all active jobs.
            if len(self.jobs) >= 100:
                finished = [key for key, j in self.jobs.items() if j['state'] not in ('queued', 'downloading')]
                for key in finished[:50]:
                    del self.jobs[key]
            job = dict(id=uuid.uuid4().hex, model_id=model_id, file_index=file_index, state='queued',
                       file='', completed=0, files=len(targets), bytes=0, total_bytes=0, error='', cancel=threading.Event())
            self.jobs[job['id']] = job
            self.queue.put((job, targets))
            if self.worker is None:
                self.worker = threading.Thread(target=self.consume, name='model-download', daemon=True)
                self.worker.start()
            return self.public(job)

    def consume(self):
        while True:
            job, targets = self.queue.get()
            try:
                self.run(job, targets)
            finally:
                self.queue.task_done()

    @staticmethod
    def public(job):
        return {k: v for k, v in job.items() if k != 'cancel'}

    def run(self, job, targets):
        try:
            with self.lock:
                job['state'] = 'downloading'
            for file, target in targets:
                if job['cancel'].is_set():
                    raise InterruptedError('Download cancelled')
                with self.lock:
                    job.update(file=file['name'], bytes=0, total_bytes=0)

                def progress(done, total, skipped):
                    with self.lock:
                        job.update(bytes=done, total_bytes=total)

                download_file(file, target, progress, job['cancel'])
                with self.lock:
                    job['completed'] += 1
            with self.lock:
                job['state'] = 'done'
        except urllib.error.HTTPError as error:
            with self.lock:
                job.update(state='error', error='Authentication or model license acceptance is required. Use the source link and install manually.' if error.code in (401, 403) else f'Download server returned HTTP {error.code}. Retry or use the direct link.')
        except Exception as error:
            with self.lock:
                job.update(state='cancelled' if isinstance(error, InterruptedError) else 'error', error=str(error))

    def status(self):
        with self.lock:
            return [self.public(job) for job in self.jobs.values()]

    def cancel(self, job_id):
        with self.lock:
            if job_id not in self.jobs:
                raise ValueError('Unknown download')
            self.jobs[job_id]['cancel'].set()


downloads = Downloads()
