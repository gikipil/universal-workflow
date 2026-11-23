# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (c) 2026 gikipil. Installer engine; model weights are never downloaded.
import argparse
import concurrent.futures
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import sys
import time
import urllib.request
import zipfile

from pip._vendor.packaging.version import Version, InvalidVersion

PROTECTED = {'models', 'input', 'output', 'user', 'custom_nodes', '.git', '.venv', 'venv'}
WEIGHTS = {'.safetensors', '.ckpt', '.pt', '.pth', '.gguf', '.onnx'}


def bundled_requirements(package):
    # Local modules ship code, not weights; include only their declared runtime deps.
    return sorted(p for p in (Path(package) / 'nodes').glob('*/requirements.txt') if p.is_file())


def log(text):
    print(text, flush=True)


def command(args, cwd=None, check=True, stream=False):
    args = [str(x) for x in args]
    if stream:
        process = subprocess.Popen(args, cwd=cwd, text=True, encoding='utf-8', errors='replace',
                                   stdout=subprocess.PIPE, stderr=subprocess.STDOUT, bufsize=1)
        lines = []
        for line in process.stdout:
            lines.append(line)
            print(line, end='', flush=True)
        result = subprocess.CompletedProcess(args, process.wait(), ''.join(lines))
    else:
        result = subprocess.run(args, cwd=cwd, text=True, encoding='utf-8', errors='replace',
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if check and result.returncode:
        raise RuntimeError(result.stdout[-12000:])
    return result


def root_path(value):
    root = Path(value).expanduser().resolve()
    if not (root / 'main.py').is_file() and (root / 'ComfyUI/main.py').is_file():
        root = root / 'ComfyUI'
    if not (root / 'main.py').is_file() or not (root / 'folder_paths.py').is_file():
        raise ValueError('Select the ComfyUI folder, or its portable parent folder.')
    return root


def contained(root, relative):
    root = Path(root).resolve()
    parts = PurePosixPath(str(relative).replace('\\', '/')).parts
    if not parts or any(p in ('.', '..') or ':' in p for p in parts):
        raise ValueError('Invalid installation path')
    path = root.joinpath(*parts).resolve()
    if not path.is_relative_to(root) or path == root:
        raise ValueError('Installation path is outside its destination')
    return path


def filesystem_path(value):
    """Use Windows extended paths for filesystem I/O, without registry changes."""
    path = Path(value).resolve()
    text = str(path)
    if os.name == 'nt' and not text.startswith('\\\\?\\'):
        text = '\\\\?\\UNC\\' + text[2:] if text.startswith('\\\\') else '\\\\?\\' + text
        return Path(text)
    return path


def extract(archive, directory):
    filesystem_path(directory).mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        total = 0
        for item in z.infolist():
            parts = PurePosixPath(item.filename).parts
            if len(parts) < 2:
                continue
            if stat.S_ISLNK(item.external_attr >> 16):
                raise ValueError('Symbolic links are not supported in installation archives')
            path = contained(directory, '/'.join(parts[1:]))
            if item.is_dir() or path.suffix.lower() in WEIGHTS or '.git' in parts:
                continue
            # Our workflow does not use authors' example graphs. Some have
            # very long filenames; retain runtime code, tools and licenses.
            if parts[1].lower() in ('examples', 'example_workflows', 'workflows') and path.suffix.lower() == '.json':
                continue
            total += item.file_size
            if total > 2 * 1024**3:
                raise ValueError('Source archive is unexpectedly large')
            output = filesystem_path(path)
            output.parent.mkdir(parents=True, exist_ok=True)
            with z.open(item) as src, output.open('wb') as out:
                shutil.copyfileobj(src, out)


def download_source(repository, revision, cache):
    if not re.fullmatch(r'https://github.com/[\w.-]+/[\w.-]+', repository) or not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError('Unpinned source repository')
    name = repository.rsplit('/', 1)[-1]
    key = 'n-' + hashlib.sha256((repository + '@' + revision).encode()).hexdigest()[:16]
    directory = cache / key
    marker = directory / '.universal-source.json'
    expected = {'repository': repository, 'revision': revision}
    if marker.is_file():
        try:
            if json.loads(marker.read_text(encoding='utf-8')) == expected:
                return directory
        except (ValueError, OSError):
            pass
    cache.mkdir(parents=True, exist_ok=True)
    archive = cache / (key + '.zip')
    url = repository.replace('https://github.com/', 'https://codeload.github.com/') + '/zip/' + revision
    log('Downloading node source: ' + name)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=45) as source, archive.open('wb') as out:
                shutil.copyfileobj(source, out)
            break
        except OSError:
            if attempt == 2:
                if os.name != 'nt':
                    raise
                # Use Windows' native HTTPS stack if embedded Python TLS fails.
                # Values are passed as child environment variables, never shell code.
                env = dict(os.environ, UW_SOURCE_URL=url, UW_SOURCE_FILE=str(archive.resolve()))
                fallback = subprocess.run(['powershell.exe', '-NoProfile', '-Command',
                    '[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing -Uri $env:UW_SOURCE_URL -OutFile $env:UW_SOURCE_FILE -TimeoutSec 90'],
                    env=env, capture_output=True, text=True)
                if fallback.returncode:
                    raise RuntimeError('Could not download node source: ' + name)
                break
            time.sleep(1)
    extract(archive, directory)
    marker.write_text(json.dumps(expected), encoding='utf-8')
    return directory


def packages():
    return {d.metadata['Name'].lower().replace('_', '-'): d.version for d in importlib.metadata.distributions() if d.metadata.get('Name')}


def running(root):
    if os.name != 'nt':
        return False
    # Read process command lines without terminating any process.
    script = "Get-CimInstance Win32_Process | Where-Object {$_.Name -match '^python(w)?\\.exe$'} | Select-Object -ExpandProperty CommandLine | ConvertTo-Json -Compress"
    r = command(['powershell.exe', '-NoProfile', '-Command', script], check=False)
    if r.returncode:
        raise RuntimeError('Could not check whether ComfyUI is running. Close ComfyUI before installing.')
    try:
        lines = json.loads(r.stdout or '[]')
        lines = [lines] if isinstance(lines, str) else lines
    except ValueError:
        raise RuntimeError('Could not check running processes.')
    # A manual install may launch "python main.py" with no absolute ComfyUI
    # path in its command line. Do not miss that case and patch live libraries.
    return any(re.search(r'(?:^|[\s"\\/])main\.py(?:[\s"]|$)', str(line), re.I) for line in lines or [])



def video_runtime_needs_update(runtime):
    try:
        return runtime.get('cuda') != '13.0' or Version(runtime.get('torch', '0')) < Version('2.10.0')
    except InvalidVersion:
        return True


def preservation_constraints(installed, mode):
    lines = []
    for name, value in sorted(installed.items()):
        try:
            Version(value)
        except InvalidVersion:
            raise ValueError('Cannot safely preserve the installed version of ' + name + ': ' + value)
        # Images-only must not replace the user's PyTorch family at all.
        operator = '==' if mode == 'images' and name in ('torch', 'torchvision', 'torchaudio') else '>='
        # PEP 440 permits local CUDA suffixes in ==, but not in >=.
        lines.append(name + operator + (value if operator == '==' else Version(value).public))
    return '\n'.join(lines)


def reject_downgrades(updates):
    for item in updates:
        if item.get('old') and Version(item['new']) < Version(item['old']):
            raise ValueError('Setup will not downgrade ' + item['name'] + ' (' + item['old'] + ' -> ' + item['new'] + '). Resolve the conflicting dependency separately; no installation was started.')


def audit(root, mode):
    if sys.version_info < (3, 10):
        raise ValueError('Python 3.10 or newer is required; Python 3.12 is recommended.')
    if running(root):
        raise ValueError('Close ComfyUI before installation. No running process will be stopped automatically.')
    installed = packages()
    if 'pip' not in installed:
        raise ValueError('This ComfyUI Python has no pip. Choose the Python used by your ComfyUI installation.')
    gpu = command(['nvidia-smi', '--query-gpu=name,driver_version,memory.total', '--format=csv,noheader'], check=False) if shutil.which('nvidia-smi') else None
    runtime = {'torch': installed.get('torch', ''), 'cuda': None}
    probe = command([sys.executable, '-c', 'import torch,json; print(json.dumps({"torch":torch.__version__,"cuda":torch.version.cuda}))'], check=False)
    if not probe.returncode:
        try:
            runtime = json.loads(probe.stdout.strip().splitlines()[-1])
        except ValueError:
            pass
    version_text = (root / 'comfyui_version.py').read_text(encoding='utf-8') if (root / 'comfyui_version.py').exists() else ''
    found = re.search(r'__version__\s*=\s*[\'"]([0-9.]+)', version_text)
    version = found.group(1) if found else 'unknown'
    update_core = version == 'unknown' or tuple(int(n) for n in version.split('.')[:3]) < (0, 37, 0)
    if mode == 'all' and (gpu is None or gpu.returncode):
        raise ValueError('The video runtime requires an NVIDIA GPU and its driver. Choose Images only, or install a compatible driver first.')
    if mode == 'all':
        driver = command(['nvidia-smi'], check=False)
        supported = re.search(r'CUDA Version:\s*(\d+)\.(\d+)', driver.stdout)
        if supported and int(supported.group(1)) < 13:
            raise ValueError('The NVIDIA driver does not support CUDA13. Update the driver first, or select Images only. Setup will not change GPU drivers.')
        capabilities = command(['nvidia-smi', '--query-gpu=compute_cap', '--format=csv,noheader'], check=False)
        if not capabilities.returncode:
            caps = re.findall(r'(\d+)\.\d+', capabilities.stdout)
            if caps and all(int(cap) < 8 for cap in caps):
                raise ValueError('The accelerated video mode needs an Ampere or newer NVIDIA GPU. Select Images only on this GPU.')
    return dict(root=str(root), python=sys.executable, python_version=sys.version.split()[0], mode=mode,
                comfy_version=version, update_comfy=update_core, runtime=runtime,
                update_video_runtime=mode == 'all' and video_runtime_needs_update(runtime),
                gpu=gpu.stdout.strip() if gpu and not gpu.returncode else 'not detected',
                free_gb=round(shutil.disk_usage(root).free / 1024**3, 1), installed_packages=installed)


def has_classes(directory, names):
    remaining = set(names)
    for p in filesystem_path(directory).rglob('*'):
        if p.suffix not in ('.py', '.js') or '__pycache__' in p.parts or '.git' in p.parts or not p.is_file():
            continue
        text = p.read_text(encoding='utf-8', errors='ignore')
        remaining = {name for name in remaining if name not in text and name.removesuffix(' (rgthree)') not in text}
        if not remaining:
            return True
    return not remaining


def locate_pack(root, pack):
    names = {pack['folder'].lower(), pack['repository'].rsplit('/', 1)[-1].lower()}
    if 'ui-builder' in pack['folder'].lower():
        names |= {'comfyui-neuraldreamer-ui-builder', 'comfyui-nd-ui-builder'}
    matches = [p for p in (root / 'custom_nodes').iterdir() if p.is_dir() and p.name.lower() in names] if (root / 'custom_nodes').exists() else []
    if len(matches) > 1:
        raise ValueError('Duplicate node installations: ' + ', '.join(str(p) for p in matches))
    return matches[0] if matches else root / 'custom_nodes' / pack['folder']


def plan(bundle, workspace, root, mode):
    manifest = json.loads((bundle / 'bundle-manifest.json').read_text(encoding='utf-8'))
    for relative, digest in manifest.items():
        if hashlib.sha256(contained(bundle, relative).read_bytes()).hexdigest() != digest:
            raise ValueError('The installation archive is incomplete or changed: ' + relative)
    info = audit(root, mode)
    lock = json.loads((bundle / 'installer/install-lock.json').read_text(encoding='utf-8'))
    package = bundle / 'package'
    sources = []
    requirements = []
    core = download_source(lock['comfy']['repository'], lock['comfy']['revision'], workspace / 'sources') if info['update_comfy'] else root
    requirements.append(core / 'requirements.txt')
    requirements.extend(bundled_requirements(package))
    sources.append({'source': str(core), 'destination': str(root), 'core': True, 'copy': info['update_comfy']})
    for pack in lock['nodes']:
        target = locate_pack(root, pack)
        is_nd = pack.get('bundled') is True
        replace = is_nd or (mode == 'all' and pack['folder'] == 'ComfyUI-QwenTTS') or not target.exists() or not has_classes(target, pack.get('node_types', []))
        if is_nd:
            source = bundle / 'ND-UI-Builder'
        else:
            source = download_source(pack['repository'], pack['revision'], workspace / 'sources') if replace else target
        sources.append({'source': str(source), 'destination': str(target), 'core': False, 'copy': replace})
        if (source / 'requirements.txt').is_file():
            requirements.append(source / 'requirements.txt')
    # Missing audio/video code is installed in both profiles so the graph opens.
    # Images-only preserves the existing PyTorch family; full mode explicitly
    # plans the separately approved CUDA13/voice runtime update.
    req = workspace / 'requirements.txt'
    text = '\n'.join('-r "' + str(p).replace('\\', '/') + '"' for p in requirements)
    text += '\naccelerate\nsentencepiece\n'
    if mode == 'all':
        # Keep the accelerated-video minimum without overriding ComfyUI's own pin.
        text += 'transformers>=5.5.0\ncomfy-kitchen>=0.2.35\n'
    if info['update_video_runtime']:
        # The known CUDA13 fallback is allowed only when it is not a downgrade.
        reject_downgrades([{'name': name, 'old': info['installed_packages'].get(name, ''), 'new': value} for name, value in [('torch', '2.10.0+cu130'), ('torchvision', '0.25.0+cu130'), ('torchaudio', '2.10.0+cu130')]])
        text += 'torch==2.10.0+cu130\ntorchvision==0.25.0+cu130\ntorchaudio==2.10.0+cu130\n'
    req.write_text(text, encoding='utf-8')
    constraint = workspace / 'constraints.txt'
    constraint.write_text(preservation_constraints(info['installed_packages'], mode), encoding='utf-8')
    pip_args = ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-user', '--prefer-binary', '-r', str(req), '-c', str(constraint)]
    if info['update_video_runtime']:
        pip_args += ['--extra-index-url', 'https://download.pytorch.org/whl/cu130']
    report_file = workspace / 'pip-report.json'
    log('Checking Python dependencies. This downloads package metadata/wheels, not model weights.')
    pip = command([sys.executable, *pip_args, '--dry-run', '--report', str(report_file)], check=False, stream=True)
    (workspace / 'pip-check.log').write_text(pip.stdout, encoding='utf-8')
    if pip.returncode:
        raise RuntimeError('Python dependencies could not be resolved while preserving installed versions. Setup does not downgrade packages. No installed environment was changed. See pip-check.log.\n' + pip.stdout[-5000:])
    report = json.loads(report_file.read_text(encoding='utf-8'))
    updates = [{'name': e['metadata']['name'], 'old': info['installed_packages'].get(e['metadata']['name'].lower().replace('_', '-'), ''), 'new': e['metadata']['version']} for e in report.get('install', [])]
    reject_downgrades(updates)
    approved = workspace / 'approved-constraints.txt'
    approved.write_text('\n'.join(p['name'] + '==' + p['new'] for p in updates), encoding='utf-8')
    pip_args += ['-c', str(approved)]
    info.update(sources=sources, pip_args=pip_args, updates=updates, package=str(package), workflow=lock['workflow'],
                artifacts={str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in [req, constraint, approved, bundle / 'installer/install-lock.json']})
    (workspace / 'plan.json').write_text(json.dumps(info, indent=2), encoding='utf-8')
    return info


def copy_files(source, target, backup, changes, core=False, preserve_workflow=False):
    source = filesystem_path(source)
    for src in source.rglob('*'):
        relative = src.relative_to(source)
        if not src.is_file() or '.git' in relative.parts or '__pycache__' in relative.parts or src.suffix.lower() in WEIGHTS:
            continue
        if core and relative.parts[0] in PROTECTED:
            continue
        dest = filesystem_path(contained(target, relative.as_posix()))
        if preserve_workflow and dest.exists():
            continue
        if dest.exists() and dest.read_bytes() == src.read_bytes():
            continue
        saved = backup / str(len(changes))
        if dest.exists():
            saved.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(dest, saved)
        changes.append({'target': str(dest), 'backup': str(saved) if dest.exists() else None})
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)


def patch_sources(directory, patch, backup, changes):
    """Apply the exact shipped unified diff, without requiring Git on the PC."""
    sections = re.split(r'(?m)^diff --git ', patch.read_text(encoding='utf-8'))[1:]
    prepared = []
    for section in sections:
        name = re.search(r'(?m)^\+\+\+ b/(.+)$', section).group(1)
        path = contained(directory, name)
        original = path.read_text(encoding='utf-8')
        headers = list(re.finditer(r'(?m)^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@[^\n]*\n', section))
        def transform(reverse=False):
            output = original.splitlines(keepends=True)
            offset = 0
            for i, header in enumerate(headers):
                hunk = section[header.end():headers[i+1].start() if i+1 < len(headers) else len(section)]
                lines = [line for line in hunk.splitlines(keepends=True) if line[:1] in (' ', '+', '-')]
                before = [line[1:] for line in lines if line[0] != '+']
                after = [line[1:] for line in lines if line[0] != '-']
                if reverse:
                    before, after = after, before
                position = max(0, int(header.group(2 if reverse else 1)) - 1) + offset
                if output[position:position+len(before)] != before:
                    raise ValueError('The existing QwenTTS source does not match its compatibility patch: ' + name)
                output[position:position+len(before)] = after
                offset += len(after) - len(before)
            return ''.join(output)
        try:
            output = transform()
        except ValueError:
            transform(reverse=True)  # Require a completely applied patch, not a partial match.
            output = original
        prepared.append((path, original, output))
    for path, original, output in prepared:
        if original != output:
            saved = backup / str(len(changes));saved.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, saved);changes.append({'target': str(path), 'backup': str(saved)})
            path.write_text(output, encoding='utf-8')


def apply(bundle, workspace, approved):
    if not approved:
        raise ValueError('Installation requires explicit approval of the prepared plan.')
    info = json.loads((workspace / 'plan.json').read_text(encoding='utf-8'))
    root = root_path(info['root'])
    if Path(info['python']).resolve() != Path(sys.executable).resolve() or running(root) or packages() != info['installed_packages']:
        raise ValueError('The environment changed or ComfyUI is running. Run the checks again.')
    for name, digest in info['artifacts'].items():
        if hashlib.sha256(Path(name).read_bytes()).hexdigest() != digest:
            raise ValueError('Installation files changed. Run the checks again.')
    reject_downgrades(info['updates'])
    # Snapshot package versions before pip changes the selected environment.
    (workspace / 'packages-before.json').write_text(json.dumps(packages(), indent=2), encoding='utf-8')
    log('Installing the approved Python dependencies…')
    pip = command([sys.executable, *info['pip_args']], check=False, stream=True)
    (workspace / 'pip-install.log').write_text(pip.stdout, encoding='utf-8')
    if pip.returncode:
        raise RuntimeError('Python dependency installation failed. Workflow files were not replaced. See pip-install.log and packages-before.json.\n' + pip.stdout[-5000:])
    if running(root):
        raise RuntimeError('ComfyUI was started during setup. Close it and prepare a new plan; workflow files were not replaced.')
    changes = []
    backup = workspace / 'backup'
    package = bundle / 'package'
    try:
        log('Installing node sources and the interface…')
        for item in info['sources']:
            dest = Path(item['destination']).resolve()
            if dest != root and not dest.is_relative_to(root / 'custom_nodes'):
                raise ValueError('Node destination is outside custom_nodes')
            if item['copy']:
                log('Installing: ' + Path(item['destination']).name)
                copy_files(Path(item['source']), Path(item['destination']), backup, changes, item['core'])
        nd = next(Path(item['destination']) for item in info['sources'] if Path(item['source']).name == 'ND-UI-Builder')
        copy_files(package / 'ui', nd, backup, changes)
        copy_files(package / 'nodes', root / 'custom_nodes', backup, changes)
        copy_files(package / 'assets', root / 'input', backup, changes)
        stage = workspace / 'workflow'
        stage.mkdir(exist_ok=True)
        shutil.copy2(package / info['workflow'], stage / info['workflow'])
        copy_files(stage, root / 'user/default/workflows', backup, changes, preserve_workflow=True)
        # Do not run third-party install.py hooks: some download model weights.
        # Apply the shipped QwenTTS compatibility patch only to its pinned source.
        if info['mode'] == 'all':
            qwen = next(Path(x['destination']) for x in info['sources'] if Path(x['destination']).name.lower() == 'comfyui-qwentts')
            patch = package / 'compat/qwentts-transformers5.patch'
            patch_sources(qwen, patch, backup, changes)
        (workspace / 'file-changes.json').write_text(json.dumps(changes, indent=2), encoding='utf-8')
    except Exception:
        rollback(changes)
        raise
    check = command([sys.executable, '-m', 'pip', 'check'], check=False)
    (workspace / 'pip-after.log').write_text(check.stdout, encoding='utf-8')
    if check.returncode:
        raise RuntimeError('Files are installed, but Python reports dependency conflicts. Do not treat setup as complete; see pip-after.log.')
    if info['mode'] == 'all':
        probe = command([sys.executable, '-c', 'import torch; assert torch.version.cuda == "13.0" and torch.cuda.is_available(), "CUDA13 is not available; check the NVIDIA driver"; import comfy_kitchen; assert comfy_kitchen.sol_attn_is_available(), "Compiled Sol-Attention kernels are unavailable for this GPU/runtime"'], check=False)
        if probe.returncode:
            raise RuntimeError('Files are installed, but the video runtime check failed. ' + probe.stdout[-2000:])
    return {'ok': True, 'root': str(root), 'workflow': info['workflow'], 'backup': str(workspace), 'models_downloaded': 0,
            'message': 'Installation complete. Start ComfyUI with its usual launcher, open the workflow, then choose models in Settings / Help.'}


def rollback(changes):
    for item in reversed(changes):
        target = Path(item['target'])
        if item['backup']:
            shutil.copy2(item['backup'], target)
        elif target.is_file():
            target.unlink()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--action', choices=['audit', 'prepare', 'install'], required=True)
    parser.add_argument('--root', required=True)
    parser.add_argument('--bundle', required=True)
    parser.add_argument('--workspace', required=True)
    parser.add_argument('--mode', choices=['all', 'images'], default='all')
    parser.add_argument('--approved', action='store_true')
    args = parser.parse_args()
    workspace = Path(args.workspace).resolve();workspace.mkdir(parents=True, exist_ok=True)
    try:
        root = root_path(args.root);bundle = Path(args.bundle).resolve()
        result = audit(root, args.mode) if args.action == 'audit' else plan(bundle, workspace, root, args.mode) if args.action == 'prepare' else apply(bundle, workspace, args.approved)
        (workspace / 'result.json').write_text(json.dumps({'ok': True, 'result': result}, ensure_ascii=False, indent=2), encoding='utf-8')
        log('Done.')
    except Exception as error:
        (workspace / 'result.json').write_text(json.dumps({'ok': False, 'error': str(error)}, ensure_ascii=False, indent=2), encoding='utf-8')
        log(str(error));sys.exit(1)


if __name__ == '__main__':
    main()
