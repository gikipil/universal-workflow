import {factoryvidrefs_v0180,factoryvidsettings_v0180,factoryvidprog_v0180,factoryvidrun_v0180} from './factory_video.js';
import {outpaintLegacyWidgets,factoryoutpaintsettings_v0140,factoryoutpaintprogress_v0140,factoryoutpaintrun_v0140,factoryoutpaint_v0140} from './factory_outpaint.js';
import {factorycapsource_v0163,factorycaption_v0160,factorycapresult_v0160,factorycaprun_v0160,factorycapprog_v0160} from './factory_caption.js';
// Universal Workflow update by gikipil, 2026-11-14: standalone and post-edit upscale.
import {factoryupprogress_v080,factoryuprun_v080} from './factory_upscale_task.js';
import {factoryeditmain_v071,factoryeditphoto_v070,factoryeditprog_v070,factoryeditrun_v070,factoryeditpreset_v070,factoryedit_v070} from './factory_edit.js';
import {factoryphoto_v060,factoryalphaviewer_v060,factorybackgroundprogress_v060,factorybackgroundrun_v060,factorybackground_v060} from './factory_background.js';
import {factorypose_v050} from './factory_pose.js';
import {factoryupscale_v040} from './factory_upscale.js';
import {factoryprogress_v037} from './factory_progress.js';
import {factorylocal_v030,factorylocalcompare_v030} from "./factory_local_detail.js";
import {factoryloralist_v0217} from "./factory_lora_list.js";
import {factorysliders_v0216} from "./factory_sliders.js";
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions/modifications by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
import { factoryrefmode_v0214 } from "./factory_refmode_v0214.js";
import { factorysize_v0213 } from "./factory_size_v0213.js";
import { factorygenmode_v029 } from "./factory_genmode_v029.js";
import { factorysavetoggle_v023, factoryqueuestatus_v023 } from "./factory_status_row_v023.js";
import { factorytaskbar_v0215 } from "./factory_taskbar_v0215.js";
import { factoryrefinementmode } from "./factory_refinement_mode.js";
import { factorygenerationmode } from "./factory_generation_mode.js";
import { factoryresolution } from "./factory_resolution.js";
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2026 Ivan Ovchinnikov (Neural Dreamer)
// ND UI widgets — the library. A widget is {type, label, icon, group, slots, size, props, mount(ctx)}.
//   slots: [{id, label, accepts: ["INT", ...], required}]  the parameters it controls (each is bound to a parameter of a source node)
//   size:  {w, h, minW, minH, maxH}                        the first size and the limits
//   props: [{id, kind, label, def, ...}]                   what the inspector shows (kinds: text, textarea, number, int, bool, select, image)
//   mount(ctx) -> {update(), resize()?, destroy()?}        builds the DOM into ctx.body, see render.js for ctx
import { number, slider, knob, seed, toggle } from "./inputs.js";
import { dropdown, segmented, tabs } from "./choice.js";
import { text, prompt } from "./text.js";
import { panel, spoiler, heading, textblock, divider, image } from "./deco.js";
import { generate, runto, progress, queue } from "./run.js";
import { viewer } from "./viewer.js";
import { audioplayer, videoplayer } from "./players.js";
import { resolution, modelpicker, textout } from "./special.js";
import { lora, lorapicker } from "./lora.js";
import { videoinput, audioinput } from "./loaders.js";
import { simpleimage } from "./imgin.js";
import { imageinput } from "./imageinput.js";
import { uiscale } from "./uiscale.js";
import { activity } from "./activity.js";
import { nodeembed } from "./nodeembed.js";
import { tabbox } from "./tabbox.js";
import { showany } from "./showany.js";
import { variantsel } from "./variantsel.js";

export const WIDGET_LIST = [factoryvidrefs_v0180,factoryvidsettings_v0180,factoryvidprog_v0180,factoryvidrun_v0180,factorycapsource_v0163,factorycaption_v0160,factorycapresult_v0160,factorycaprun_v0160,factorycapprog_v0160,...outpaintLegacyWidgets,factoryoutpaintsettings_v0140,factoryoutpaintprogress_v0140,factoryoutpaintrun_v0140,factoryoutpaint_v0140,factoryupprogress_v080,factoryuprun_v080,factoryeditmain_v071,factoryeditphoto_v070,factoryeditprog_v070,factoryeditrun_v070,factoryeditpreset_v070,factoryedit_v070,factoryphoto_v060,factoryalphaviewer_v060,factorybackgroundprogress_v060,factorybackgroundrun_v060,factorybackground_v060,factorypose_v050, factoryupscale_v040, factoryprogress_v037, factorylocal_v030, factorylocalcompare_v030, factoryloralist_v0217, factorysliders_v0216, factoryrefmode_v0214, factorysize_v0213, factorygenmode_v029, factorysavetoggle_v023, factoryqueuestatus_v023, factorytaskbar_v0215, factoryrefinementmode, factorygenerationmode, factoryresolution, number, slider, knob, seed, text, prompt, dropdown, segmented, toggle, generate, runto, progress, queue, resolution, modelpicker, lora, lorapicker, viewer, audioplayer, videoplayer, simpleimage, imageinput, videoinput, audioinput, textout, uiscale, activity, nodeembed, showany, variantsel, panel, tabbox, spoiler, heading, textblock, divider, image, tabs];
export const WIDGETS = new Map(WIDGET_LIST.map((d) => [d.type, d]));
export const GROUPS = ["Inputs", "Run", "Results", "Layout"];
export const defOf = (type) => WIDGETS.get(type) || null;

// the first values of the props (the defaults named in the definition)
export function defaultProps(def) {
    const out = {};
    for (const p of def.props || []) if (p.def !== undefined) out[p.id] = p.def;
    return out;
}
