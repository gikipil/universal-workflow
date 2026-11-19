# Qwen3-TTS compatibility / Совместимость Qwen3-TTS

This optional source patch preserves the fixes used by VoiceDesign in the development installation. It is distributed under GPL-3.0-only, like its upstream node pack, not under the workflow's non-commercial terms.

- Upstream: [1038lab/ComfyUI-QwenTTS](https://github.com/1038lab/ComfyUI-QwenTTS)
- Base revision: `d8122a8ba835b65fd65c113d2b273b1ad1579293`
- Development Transformers version: `5.5.0`
- Original compatibility discussion: [upstream pull request 21](https://github.com/1038lab/ComfyUI-QwenTTS/pull/21)
- License: [GPL-3.0-only](../LICENSES/GPL-3.0-only.txt)

The patch handles missing `pad_token_id`, default rotary-frequency initialization, causal-mask argument compatibility and the tokenizer's Mistral-only regex fix. It modifies exactly three bundled Qwen source files. It does not change model weights or install Python packages.

## Apply / Применение

Stop ComfyUI. Back up an existing QwenTTS folder outside `custom_nodes` first. For a fresh Git installation, from the `ComfyUI/` folder:

```sh
git clone https://github.com/1038lab/ComfyUI-QwenTTS custom_nodes/ComfyUI-QwenTTS
git -C custom_nodes/ComfyUI-QwenTTS checkout d8122a8ba835b65fd65c113d2b273b1ad1579293
```

Install that pack's requirements into ComfyUI's Python environment following its README. If using the Transformers 5.5.0 combination, apply the included patch. Replace `<release-folder>` with the absolute path to this unpacked release:

```sh
git -C custom_nodes/ComfyUI-QwenTTS apply --check "<release-folder>/compat/qwentts-transformers5.patch"
git -C custom_nodes/ComfyUI-QwenTTS apply "<release-folder>/compat/qwentts-transformers5.patch"
```

Both commands must succeed. If the check fails, do not force it or overwrite unrelated changes: check the revision and whether the patch is already applied. Restart ComfyUI after installation. Keep your existing working environment unchanged if you do not use VoiceDesign; this patch is not a requirement for image generation. Other Transformers versions need their own compatibility check.

**Русский:** останови ComfyUI и сохрани прежнюю папку QwenTTS вне `custom_nodes`. Для новой установки используй указанную ревизию. Ставь зависимости через Python ComfyUI. Для комбинации с Transformers 5.5.0 сначала выполни `git apply --check`, затем `git apply`, подставив абсолютный путь к релизу вместо `<release-folder>`. При ошибке проверки не применяй принудительно: проверь ревизию и прежние изменения. После установки перезапусти ComfyUI. Если голос по описанию не нужен, ради патча не меняй рабочее окружение. Другие версии Transformers требуют отдельной проверки.
