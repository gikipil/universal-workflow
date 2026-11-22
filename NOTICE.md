# Notices

ComfyUI ND UI Builder is Copyright (c) 2026 Ivan Ovchinnikov (Neural Dreamer).
Original project: https://github.com/neural-dreamer/ComfyUI-ND-UI-Builder

The source files in ui/ contain additions and modifications by gikipil dated 2026-11-12–2026-11-20. They are distributed under AGPL-3.0-only, without warranty. Original copyright and licence notices are preserved. The full licence is provided in LICENSES/AGPL-3.0-only.txt.

The local caption module in nodes/ComfyUI-Universal-Caption is Copyright (c) 2026 gikipil, released under AGPL-3.0-only. It uses separately installed Florence2/QwenVL nodes and the JoyCaption model; their authors retain their respective rights and licences.

The MiniMax H3 video chain is adapted from ND_MiniMax_H3_Ultimate_Def_v2.0 by Neural Dreamer. The prompt enhancer and sampling live preview are not included. The local ComfyUI-Universal-Video output module is Copyright (c) 2026 gikipil, released under AGPL-3.0-only.

The Higgs audio chain is adapted from higgs_audio_v3-tts_example_workflow.json supplied with Higgs_v3-TTS-ComfyUI by Saganaki22 (https://github.com/Saganaki22/Higgs_v3-TTS-ComfyUI). The original nodes and models are installed separately and retain their respective licences.

The Voice Design audio branch uses the separately installed ComfyUI-QwenTTS nodes by 1038lab (https://github.com/1038lab/ComfyUI-QwenTTS) and Qwen3-TTS-12Hz-1.7B-VoiceDesign by the Qwen team (https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign). Their respective licences apply to those separately installed components.

The song branch is adapted from the user-supplied audio_ace_step1_5_xl_sft.json workflow. It uses ACE-Step 1.5 support from ComfyUI and separately installed ACE-Step/Qwen model assets; their respective authors retain their rights and licences.

The local ComfyUI-Universal-Memory module is Copyright (c) 2026 gikipil, released under AGPL-3.0-only. It uses ComfyUI memory management to clean up before marked Universal Workflow jobs.

The native widget localization bridge in ui/js/ndui/locales/native_widgets.js includes English, Russian and Chinese labels from ComfyUI-ND-UI-Builder by neural-dreamer, with Spanish, French and Japanese additions by gikipil (2026), under AGPL-3.0-only.

The independent workflow arrangement and original documentation are covered by LICENSE.md. This does not add restrictions to the AGPL-covered code above.

The compatibility patch in compat/qwentts-transformers5.patch is derived from ComfyUI-QwenTTS by 1038lab and its bundled Qwen3-TTS sources by the Qwen team. It targets revision d8122a8ba835b65fd65c113d2b273b1ad1579293 and includes changes by gikipil dated 2026-11-18 for Transformers 5.5.0. The patch is provided as source under GPL-3.0-only, without warranty. Original notices are retained in upstream sources; the license is included in LICENSES/GPL-3.0-only.txt. Obtain the exact upstream source from the linked revision and apply the patch to reconstruct the modified source.


Windows installer releases include the complete unmodified ND UI Builder source at revision ad176bd9731c70e2b3246ea9ff1129606591448c in resources/ND-UI-Builder, with original LICENSE, THIRD_PARTY_NOTICES.md, GPL notices and Inter font license intact. Our AGPL additions are separately provided in resources/package/ui. The installer source in installer/ and Install.cmd, and model-download helpers, are Copyright (c) 2026 gikipil under AGPL-3.0-only. The independent workflow terms do not restrict those third-party works or AGPL-covered code. Node source is fetched from its respective pinned repositories during installation and retains its original licenses. No model weights are bundled or automatically downloaded by setup.
