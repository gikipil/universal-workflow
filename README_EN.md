# 🧩 Universal Workflow

[Русский](README.md) · **English**

**Version 1.2.5 · ComfyUI · English interface by default**

One interface for image generation, refinement, editing, outpainting, background removal, upscaling, image captions, video and audio. Common settings are on the left, results and comparisons on the right. Less frequent settings open from gear buttons.

**Download:** [1.2.5 release](https://github.com/gikipil/universal-workflow/releases/tag/v1.2.5) · [complete ZIP](https://github.com/gikipil/universal-workflow/releases/download/v1.2.5/Universal-Workflow-v1.2.5.zip) · [workflow JSON](Universal-Workflow-v1.2.5.json).

**All versions:** [version history and tagged downloads](https://github.com/gikipil/universal-workflow/tags). The main branch contains the current version; previous versions remain available in the same repository.

The JSON alone is not enough: install the UI files and bundled nodes below. Model weights, external node packs and personal photographs are not included.

## 🎯 Features

| Tab / module | Purpose |
| --- | --- |
| 🖼️ Generation | Krea with a standard sampler, RES4LYF or Raw → Turbo. LoRAs, sliders, size controls and optional reference-pose guidance. |
| ✨ Refinement | Optional second pass using Krea or Z-Image, with separate prompt, Seed, denoise and LoRAs. |
| 🎯 Face, hands and masks | Four independent treatments: face, hands, SAM 3.1 text selection and a hand-painted mask. Adjustable processing order. |
| ✏️ Editing | Qwen Edit 2511, Krea Edit V2 and Qwen 2.1. Main image plus optional second reference; whole-image or masked editing, optional close-up processing. |
| ↔️ Outpainting | Qwen 2511, Krea or Qwen 2.1. Set final size or added pixels and describe the continuation. |
| 🧽 Background removal | Transparent PNG, comparison and mask preview. |
| 📈 Upscaling | Simple, Ultimate or SeedVR, as a final module or a standalone tab. Ready-made photos can also use refinement and local treatments. |
| 📝 Prompts | Local Florence, Qwen and JoyCaption descriptions for one image or a folder; editable captions and matching `.txt` files. |
| 🎬 Video | MiniMax H3 Hybrid with two-resolution generation and native Sol-Attention; first/last frames, 9 image, 3 video and 3 audio references; optional refinement and SeedVR. |
| 🔊 Audio | Higgs v3 speech/voice references, Qwen3-TTS voice design from text, ACE-Step songs and instrumental music. |
| 🎨 Interface | Eight color profiles, typography and layout controls. Russian, English, Simplified Chinese, Spanish, French and Japanese. |

“Photo processing” is reserved for future non-generative retouching and color tools. It does not process photos in 1.0.0.

## 📦 How to Install

### Windows setup wizard

1. Download the **complete release ZIP**, extract the entire archive and read `START-HERE.txt`.
2. Close ComfyUI and run **Install.cmd**. Select your existing ComfyUI folder or its portable parent.
3. Wait for the checks. Review the proposed ComfyUI, node and Python package changes, then approve the installation. Replaced files are backed up.
4. Start ComfyUI normally, refresh with **Ctrl+F5**, open the Universal Workflow JSON and press **ND UI**.
5. Choose models in Settings. **Help** downloads recommended files directly to their model folders; there is no separate folder-creation step.

The archive includes ND UI Builder with its licenses, our interface and local modules. Setup downloads missing node source and Python libraries, **never model weights**. Help is the author's recommendation catalog, not a mandatory list: other compatible models can also be selected. Direct links remain available for downloads requiring authentication or manual license acceptance.

Requires Windows, internet and an existing ComfyUI installation with Python/pip. Full video/audio preparation targets NVIDIA; Python 3.12 is recommended and package compatibility is checked; Images only keeps the current PyTorch family. Environment changes require approval. Python libraries may take several GB. Running processes are never stopped automatically: close ComfyUI yourself. Dependency conflicts are logged and are not reported as a successful installation.

### Manual installation — alternative to the wizard

1. Download and fully extract the release ZIP. Close ComfyUI. You do not need to run `Install.cmd` for this method.
2. Copy `resources/ND-UI-Builder` into `ComfyUI/custom_nodes/ComfyUI-ND-UI-Builder`. Its `__init__.py` must be directly inside that folder. Keep only one Builder installation.
3. Copy the **contents** of `resources/package/ui/js/` into that Builder’s `js/` folder and replace matching files.
4. Copy the three folders from `resources/package/nodes/` into `ComfyUI/custom_nodes/`. Copy `resources/package/assets/universal-local-empty-mask.png` into `ComfyUI/input/`.
5. Install the external node packs listed below using ComfyUI-Manager or their author instructions. Install Python requirements into the environment that actually starts ComfyUI; optional video/audio compatibility steps are below.
6. Restart ComfyUI, refresh the browser with **Ctrl+F5**, and open `resources/package/Universal-Workflow-v1.2.5.json`. Press **ND UI**.
7. Download only the models you need, then select their actual files in Settings. Files may be at the root of their model category or in any subfolder. If an old saved path is marked missing, choose your local file instead; do not recreate the author's folder layout.

<details>
<summary>Detailed manual steps, node links and runtime requirements</summary>

For manual installation, release files are in `resources/package/` and original ND UI source is in `resources/ND-UI-Builder/`. Paths below are relative to `package` or the Git repository root.

### 1. Prepare ComfyUI

Install [ComfyUI](https://github.com/Comfy-Org/ComfyUI) and compatible PyTorch/CUDA. Use a current version containing Krea 2, Qwen Image 2.1, SAM3, MiniMax H3 and ACE-Step 1.5 nodes. Version 0.37.0 is the lower bound for Qwen 2.1 alone, not a guarantee that all other features are available.

This is a local desktop workflow. The development GPU has 24 GB NVIDIA VRAM; this is not a universal minimum or a speed guarantee. Requirements depend on models, image area, video duration and enabled stages. Start small with optional stages off.

### 2. Install node packs

Use [ComfyUI-Manager](https://github.com/Comfy-Org/ComfyUI-Manager) or each author's instructions. Install dependencies into **the Python environment running ComfyUI**. Restart after installation.

Install these packs to load the complete graph. Download model weights only for the features you use. [dependencies.json](dependencies.json) lists node classes and the versions/revisions identified in the working setup, for manual or assistant-guided installation.

| Node pack | Source |
| --- | --- |
| `rgthree-comfy` | [GitHub](https://github.com/rgthree/rgthree-comfy) |
| `RES4LYF` | [GitHub](https://github.com/ClownsharkBatwing/RES4LYF) |
| `Krea-2-Two-Stage-Sampler` | [GitHub](https://github.com/Auryg/Krea-2-Two-Stage-Sampler) |
| `comfyui-easy-use` | [GitHub](https://github.com/yolain/ComfyUI-Easy-Use) |
| `comfyui-image-saver` | [GitHub](https://github.com/alexopus/ComfyUI-Image-Saver) |
| `comfyui-kjnodes` | [GitHub](https://github.com/kijai/ComfyUI-KJNodes) |
| `comfyui_layerstyle` | [GitHub](https://github.com/chflame163/ComfyUI_LayerStyle) |
| `LanPaint` | [GitHub](https://github.com/scraed/LanPaint) |
| `comfyui-inpaint-cropandstitch` | [GitHub](https://github.com/lquesada/ComfyUI-Inpaint-CropAndStitch) |
| `comfyui-krea2edit` | [GitHub](https://github.com/lbouaraba/comfyui-krea2edit) |
| `comfyui-custom-scripts` | [GitHub](https://github.com/pythongosssss/ComfyUI-Custom-Scripts) |
| `comfyui_ultimatesdupscale` | [GitHub](https://github.com/ssitu/ComfyUI_UltimateSDUpscale) |
| `seedvr2_videoupscaler` | [GitHub](https://github.com/numz/ComfyUI-SeedVR2_VideoUpscaler) |
| `comfyui-impact-pack` | [GitHub](https://github.com/ltdrdata/ComfyUI-Impact-Pack) |
| `comfyui-impact-subpack` | [GitHub](https://github.com/ltdrdata/ComfyUI-Impact-Subpack) |
| `ComfyUI-YCRMBG` | [GitHub](https://github.com/yichengup/ComfyUI-YCRMBG) |
| `comfyui-krea2-ostris-edit` | [GitHub](https://github.com/ostris/ComfyUI-Krea2-Ostris-Edit) |
| `comfyui_controlnet_aux` | [GitHub](https://github.com/Fannovel16/comfyui_controlnet_aux) |
| `ComfyUI-YCNodes-MiniMax-H3` | [GitHub](https://github.com/yichengup/ComfyUI-YCNodes-MiniMax-H3) |
| `selflift-Avatar` | [GitHub](https://github.com/slmonker/selflift-Avatar) |
| `comfyui-minimax-h3-audio-T8` | [GitHub](https://github.com/T8mars/comfyui-minimax-h3-audio-T8) |
| `fantastic-minimax-h3-prompt-builder` | [GitHub](https://github.com/Adudeguyman/ComfyUI-Fantastic-MiniMaxH3-PromptBuilder) |
| `Higgs_v3-TTS-ComfyUI` | [GitHub](https://github.com/Saganaki22/Higgs_v3-TTS-ComfyUI) |
| `ComfyUI-QwenTTS` | [GitHub](https://github.com/1038lab/ComfyUI-QwenTTS) |
| `comfyui-florence2` | [GitHub](https://github.com/kijai/ComfyUI-Florence2) |
| `ComfyUI-QwenVL` | [GitHub](https://github.com/1038lab/ComfyUI-QwenVL) |

The three `ComfyUI-Universal-*` modules are bundled and copied in step 4. A MiniMax prompt enhancer is not needed: that pack supplies only media loading and reference splitting.

For Prompts, Florence and Qwen use their node-pack loaders. JoyCaption uses `transformers`, `accelerate` and, for 4/8-bit CUDA, `bitsandbytes`. Requirements can conflict; check startup/install logs rather than blindly replacing PyTorch or upgrading the entire environment.

### 3. Install the matching ND UI Builder and overlay

The complete release ZIP already includes ND UI Builder in `resources/ND-UI-Builder/`. If installing from Git sources instead, get [ND UI Builder from its author](https://github.com/neural-dreamer/ComfyUI-ND-UI-Builder). This release is based on revision `ad176bd9731c70e2b3246ea9ff1129606591448c`: [matching upstream ZIP](https://github.com/neural-dreamer/ComfyUI-ND-UI-Builder/archive/ad176bd9731c70e2b3246ea9ff1129606591448c.zip).

Extract Builder into `ComfyUI/custom_nodes/ComfyUI-ND-UI-Builder/`; its `__init__.py` must be directly inside. Keep one Builder copy. Back up an existing installation outside `custom_nodes` before replacement.

Stop ComfyUI. Merge the **contents** of this repository's `ui/js/` into Builder's `js/`, replacing matching files:

```text
ui/js/* → ComfyUI/custom_nodes/ComfyUI-ND-UI-Builder/js/*
```

Do not create another `ui` or `js` directory inside `js`. The Git repository includes only additions/modifications; the complete release ZIP also includes the matching original Builder source. Updating Builder may overwrite the overlay; reapply the compatible release files if needed.

### 4. Copy bundled nodes and placeholder

```text
nodes/ComfyUI-Universal-Caption → ComfyUI/custom_nodes/ComfyUI-Universal-Caption
nodes/ComfyUI-Universal-Memory  → ComfyUI/custom_nodes/ComfyUI-Universal-Memory
nodes/ComfyUI-Universal-Video   → ComfyUI/custom_nodes/ComfyUI-Universal-Video
assets/universal-local-empty-mask.png → ComfyUI/input/universal-local-empty-mask.png
```

The PNG is a blank mask, not a reference photograph. Memory is used by task launchers, Caption processes local descriptions, and Video handles preview/export. **Restart ComfyUI** to register them.

### 5. Check optional runtime compatibility

**Qwen3-TTS:** the working setup uses Transformers 5.5.0 and three compatibility fixes. [compat/README.md](compat/README.md) gives the exact upstream revision and patch commands. Apply only to that revision with ComfyUI stopped; do not upgrade all existing dependencies just to apply it.

**MiniMax H3:** requires PyTorch **CUDA 13** with a compatible NVIDIA driver/GPU. Verified setup: Python 3.12, PyTorch 2.10.0+cu130, ComfyUI 0.37.0. Install [selflift-Avatar](https://github.com/slmonker/selflift-Avatar) and [MiniMax H3 audio T8](https://github.com/T8mars/comfyui-minimax-h3-audio-T8), including its `tools` folder, then restart ComfyUI. Native Model Sparse Attention (sol-attn) and compiled comfy-kitchen CUDA kernels must be available. Get PyTorch from its [official installation page](https://pytorch.org/get-started/locally/). Do not add TST or another attention override to the video chain: it disables streaming.

### 6. Download models and assign their files

[MODELS.md](MODELS.md) contains direct links and exact destination paths. The same catalog is in **Settings → Models & LoRAs → Help** and [models.json](models.json). Paths are relative to `ComfyUI/`. Download all files of a multi-file bundle and preserve its subfolders.

For initial generation, start with:

| File | Folder inside `ComfyUI/` |
| --- | --- |
| `krea2_raw_fp8_scaled.safetensors` | `models/diffusion_models/Krea2/` |
| `qwen3vl_4b_fp8_scaled.safetensors` | `models/text_encoders/Krea2/` |
| `qwen_image_vae.safetensors` | `models/vae/Krea2/` |
| `krea2_turbo_lora_rank_64_bf16.safetensors` | `models/loras/Krea2/` |

Select **Raw** for the shared Krea model; the Turbo adapter is applied automatically where needed. Krea outpainting uses the separate Turbo model. Z-Image has its own model/encoder/VAE. Qwen 2.1 requires its own complete set; the 2511 set is not interchangeable.

SNOFS is a preconfigured optional persistent LoRA. Disable its slot in Settings if you do not install it. Other user LoRAs and sliders are optional. Generation, Krea refinement and Z-Image refinement keep independent LoRA selections.

Select your actual local files in Settings. Saved Z-Image encoder/VAE aliases may differ from download names; select the downloaded files rather than guessing a rename. The **missing** badge identifies required files for the selected mode, with a list on hover. It does not validate all third-party libraries or optional LoRAs.


In **Settings → Models → Help**, recommendation cards have download buttons and direct source links. Help creates folders when downloading; it runs independently of the installer. Restart ComfyUI after updating the bundled Universal Memory module.

### 7. Open the workflow

Restart ComfyUI, hard-refresh with **Ctrl+F5**, and drag **`Universal-Workflow-v1.2.5.json`** into ComfyUI. Press **ND UI**. English is the default; change it in **Settings → Appearance → Interface language**.

For the first run, select Generation, confirm Krea models and the Turbo adapter, disable uninstalled persistent LoRAs, and leave refinement/local processing/upscaling off until an image succeeds. Enter a prompt and press Generate, then enable other stages one at a time.

</details>

## 🎛️ Using the workflow

Click the headers of generation blocks 2, 3 and 4 to collapse or expand each one independently. Their processing stays enabled; each open/closed state is remembered in your browser.

- **Generation:** arrows select a method, its gear opens settings. Raw → Turbo is the default; the negative prompt is in that dialog. Standard Turbo modes use CFG 1 and zero negative conditioning.
- **Refinement:** an independent second pass. LoRA lists switch with Krea/Z-Image. Higher denoise changes the picture more; “Second pass is disabled” fully bypasses the stage. Z-Image RES4LYF is the default method; assign its models before use.
- **Lightweight generation:** enable “Lightweight version” in the Standard Turbo or RES4LYF Turbo mode settings. It uses the ready-made Turbo model selected in shared Krea2 settings, without the Turbo LoRA. Each method remembers its own switch; both default to off. Raw → Turbo is unchanged. User LoRAs and pose remain connected. Refinement and local treatments retain their existing models; disable them when you want only the lightweight first pass.
- **Sliders:** select a LoRA, hint and recommended range per slider. Values outside that range can be entered numerically. Added rows/slots can be removed; original slots remain.
- **Pose:** enable the switch and load a reference. The skeleton guides pose; prompt and LoRAs define appearance/scene. Turning it off bypasses guidance and the adapter. The displayed skeleton updates after a new generation.
- **Local treatments:** face, hands, SAM text selection and manual mask enable independently; arrows change order. Generate a base image before painting. Recheck masks after changing composition, size or Seed; compare each treatment before/after.
- **Editing:** main image plus optional second reference with Clear. Select Qwen 2511, Krea General/Identity or Qwen 2.1. Masking, region close-up, refinement and final upscale are optional. Double Ref is in Qwen 2511 settings. Edit before final upscaling when possible.
- **Outpainting:** select input, method, processing size and final size or extra pixels. The prompt describes continuation. The original area is preserved with a softened border transition; coherent geometry remains model-dependent.
- **Upscaling:** Simple enlarges with an upscale model; Ultimate also regenerates tiles using shared Krea; SeedVR restores/enlarges. Simple and Ultimate file choices are independent; SeedVR choices are shared across tabs. Standalone Upscaling can run refinement/local treatment first.
- **Prompts:** choose one image or a folder on the ComfyUI PC, engine and instruction. Folder processing is nonrecursive. Captions save beside images with matching names; for uploaded single images, beside their input copies. Existing captions can be skipped; trigger word is optional.
- **Video:** one Hybrid model handles text, first/last frames and references automatically. Reference fields are hidden until added with `+`; separate first/last slots and lists support up to 9 image, 3 video and 3 audio references. Empty slots are ignored. Video generation starts at lower resolution and completes denoising at the target size. Defaults: 6 low-resolution + 3 high-resolution evaluations (8 base steps + 1 final step); Euler is required. Optional refinement uses the same model, independent user LoRAs, and keeps main-pass audio. Refinement and SeedVR default off. Select the Hybrid model, shared Turbo V4 LoRA and latent upscaler in Settings → Video. Start short and small.
- **Audio:** choose speech, voice reference/dialogue, voice design or songs. VoiceDesign reads the bottom text with the described voice. ACE-Step uses style and bottom lyrics; leave lyrics empty and include `instrumental` in style for instrumental music. Dialogue uses `[Speaker_1]:` / `[Speaker_2]:`.

Saving is separate and defaults off. Image exports omit the full workflow graph. Transfer `input/universal-masks/` and `input/universal-edit-masks/` when moving your own saved masks.

The status row shows stage/operation. Steps refer to current sampling; percentage covers the enabled pipeline, not remaining time. Cleanup before a job retains cached results; reuse still depends on unchanged inputs, Seed and available ComfyUI cache.

Fit shows the whole result. `− / +` zoom the preview; drag to pan. The wheel scrolls the page. Preview zoom does not change output resolution.

## 🛠️ Troubleshooting

| Symptom | Check |
| --- | --- |
| Unknown widget | Matching Builder revision, overlay in its actual `js`, no duplicate Builder, then Ctrl+F5. |
| Missing node | Pack in `dependencies.json`, and startup/import logs. The UI cannot replace missing Python classes. |
| Missing model | Complete bundle from Help/MODELS, actual file selection in Settings. |
| Missing empty mask | Included PNG copied into `ComfyUI/input/`. |
| Qwen voice config/tokenizer error | QwenTTS revision, Transformers version and compatibility patch. |
| MiniMax CUDA / missing nodes | Use PyTorch CUDA 13, install the video sampler and T8, select video models and restart ComfyUI. |
| Out of memory / very slow video | Reduce size, duration and stages; check free VRAM. |

Installation depends on OS, GPU and external packages. Successful imports do not prove every model fits your hardware. Included processing paths need no API keys or paid cloud accounts; some model downloads may require host sign-in.

## 📄 Usage terms

The workflow and original documentation are for non-commercial distribution/use, with an explicit exception allowing generated outputs to be sold. Do not sell the package, bundle it into a paid product, or offer paid access without separate permission. See [LICENSE.md](LICENSE.md).

UI code and bundled modules retain **AGPL-3.0-only**; the QwenTTS patch retains **GPL-3.0-only**. These licenses permit commercial code use and are not overridden by workflow terms. Nodes, models and LoRAs keep their own licenses; the output exception does not override their restrictions or other people's rights. See [NOTICE.md](NOTICE.md).

## 📝 Release history

### 1.2.5

- Generation blocks 2, 3 and 4 collapse independently into a single header row, including their LoRA/sliders. Each state is remembered in the browser. Collapsing does not disable processing.

### 1.2.4

- Added independent lightweight options for Standard and RES4LYF generation: a ready-made Krea Turbo model replaces Raw plus Turbo LoRA. Model selection is shared with outpainting; Raw → Turbo and later stages are unchanged.

### 1.2.3

- Final results are recovered from the exact completed run when a cached output or missed event leaves the preview empty. Delayed responses cannot replace results in another workflow or a newer run.

### 1.2.2

- Fixed General/Identity Edit file selection in settings opened from Outpainting.
- Refreshed virtual LoRA selectors now include newly installed files, even when their previous list was cached.

### 1.2.1

- Fixed the shared Krea Turbo LoRA file selector when an older workflow contains a removed stage.
- Added a visible manual-installation alternative and updated the bundled ND UI and Help instructions.

### 1.2.0

- Added a Windows setup wizard with environment checks, an approval plan and backups. The complete ZIP includes ND UI Builder and resources without model weights. Help downloads recommended models to the correct folders with progress and cancellation; direct links remain available.

### 1.1.9

- Save overwrites the active ComfyUI workflow, including settings and UI; Save As still exports a separate project. Video defaults to portrait 2:3 at 1.5 MP (992 × 1504).

### 1.1.8

- Help shows Loaded as a bold green check badge aligned beside the download button.

### 1.1.7

- Video Turbo LoRA strength defaults to 1. Help marks selected, locally available models as Loaded and provides a recheck button. Model settings verify files and local model bundles. File loaders accept models in the root or any subfolder of the appropriate model directory.

### 1.1.6

- Video settings now expose the total step count, including additional final steps, and show the current low-resolution / full-resolution split.

### 1.1.5

- Video generation has a shared Turbo LoRA strength slider: 0–1.5, default 0.7, with numeric input. It applies to generation and the optional refiner.

### 1.1.4

- Video generation and refinement now apply the shared Turbo V4 adapter in Bypass mode, matching the tested loading method, at strength 0.7.
- Ordinary LoRA loaders, their settings, and the video interface are unchanged.

### 1.1.3

- Fixed the video generation card after loading a saved workflow.
- Video preview, status and prompt now align below the full settings column, including Upscale.

### 1.1.2

- Video LoRA lists sit below their own stages; generation has six configurable LoRA sliders. Reference slots start empty and can be added or removed.
- Video size presets: 0.5, 1, 1.5, 2, 2.5 and 3 MP. Help provides a download action for every model and can create all catalog folders without downloading weights.
- Video fields and dialogs follow the selected language, color profile and visual preferences.

### 1.1.1

- Video controls are split into Generation, Refiner and Upscale cards. FPS replaces the base-step field and controls both frame count and playback.
- The refiner has independent sampler, scheduler and step settings. The main pass retains its default 6 low-resolution + 3 high-resolution steps.

### 1.1.0

- Video now uses two-resolution generation + native Sol-Attention / Global Stream, keeping the existing interface.
- One Hybrid model and shared Turbo V4 replace REF/FL; first/last-frame slots work alongside the reference lists.
- Optional refinement uses the same Hybrid model and streaming path. Independent LoRAs and SeedVR are retained.
- Settings include the latent upscaler and video generation controls. Video requires PyTorch CUDA 13.

### 1.0.0

- First stable public release of the complete workflow and interface.
- English default and English workflow filename.
- Russian/English guides, full model catalog, node dependencies and QwenTTS compatibility patch.
- Existing generation, editing, local, upscale, caption, video and audio chains retained.

### 1.0.1

- Fixed manual-mask editing in Generation when local treatments are disabled. The editor selects the image before the manual stage, respecting the treatment order.

### 1.0.2

- All four Show Mask buttons work before refinement: face/hands run only their detector, SAM runs only segmentation, and manual mode shows the saved mask without processing.

### 1.0.3

- The settings columns in Video and Audio now expand with the interface, matching the other tabs.
