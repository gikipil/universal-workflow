# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (c) 2026 gikipil. Reproducible Windows distribution with ND UI sources.
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import urllib.request
import zipfile


def build(repo, output, nd_archive=None):
    repo, output = Path(repo).resolve(), Path(output).resolve()
    lock = json.loads((repo / 'installer/install-lock.json').read_text(encoding='utf-8'))
    version = lock['version']
    root = output / ('Universal-Workflow-v' + version)
    if root.exists():
        raise ValueError('Choose a new empty output directory; existing build contents are not deleted.')
    resources = root / 'resources'
    package = resources / 'package'
    package.mkdir(parents=True)
    for name in ('assets', 'compat', 'nodes', 'ui'):
        shutil.copytree(repo / name, package / name, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
    for name in ('README.md', 'README_EN.md', 'LICENSE.md', 'NOTICE.md', 'MODELS.md', 'models.json', 'dependencies.json', lock['workflow']):
        shutil.copy2(repo / name, package / name)
    shutil.copytree(repo / 'LICENSES', package / 'LICENSES')
    shutil.copytree(repo / 'installer', resources / 'installer', ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
    shutil.copy2(repo / 'Install.cmd', root / 'Install.cmd')
    shutil.copy2(repo / 'installer/START-HERE.txt', root / 'START-HERE.txt')
    if nd_archive is None:
        nd_archive = output / 'nd-ui-upstream.zip'
        nd = next(n for n in lock['nodes'] if n['bundled'])
        url = nd['repository'].replace('https://github.com/', 'https://codeload.github.com/') + '/zip/' + nd['revision']
        with urllib.request.urlopen(url, timeout=60) as response, Path(nd_archive).open('wb') as out:
            shutil.copyfileobj(response, out)
    nd_archive = Path(nd_archive)
    if hashlib.sha256(nd_archive.read_bytes()).hexdigest() != lock['nd_archive_sha256']:
        raise ValueError('ND UI source archive checksum does not match the pinned release')
    nd_root = resources / 'ND-UI-Builder'
    with zipfile.ZipFile(nd_archive) as archive:
        for item in archive.infolist():
            parts = Path(item.filename).parts
            if len(parts) < 2 or item.is_dir():
                continue
            dest = nd_root.joinpath(*parts[1:]).resolve()
            if not dest.is_relative_to(nd_root.resolve()):
                raise ValueError('Unsafe upstream archive path')
            dest.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(item) as source, dest.open('wb') as out:
                shutil.copyfileobj(source, out)
    assert (nd_root / 'LICENSE').is_file() and (nd_root / 'THIRD_PARTY_NOTICES.md').is_file()
    assert (nd_root / 'js/fonts/Inter-LICENSE.txt').is_file()
    manifest = {str(p.relative_to(resources)).replace('\\', '/'): hashlib.sha256(p.read_bytes()).hexdigest()
                for p in resources.rglob('*') if p.is_file()}
    (resources / 'bundle-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    # Full source is present in resources, including original third-party notices.
    archive = output / ('Universal-Workflow-v' + version + '.zip')
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for file in root.rglob('*'):
            if file.is_file():
                z.write(file, file.relative_to(output))
    return archive


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', default=str(Path(__file__).resolve().parent.parent))
    parser.add_argument('--output', required=True)
    parser.add_argument('--nd-archive')
    args = parser.parse_args()
    print(build(args.repo, args.output, args.nd_archive))
