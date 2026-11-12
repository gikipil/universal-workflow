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

export const WIDGET_LIST = [factoryrefmode_v0214, factorysize_v0213, factorygenmode_v029, factorysavetoggle_v023, factoryqueuestatus_v023, factorytaskbar_v0215, factoryrefinementmode, factorygenerationmode, factoryresolution, number, slider, knob, seed, text, prompt, dropdown, segmented, toggle, generate, runto, progress, queue, resolution, modelpicker, lora, lorapicker, viewer, audioplayer, videoplayer, simpleimage, imageinput, videoinput, audioinput, textout, uiscale, activity, nodeembed, showany, variantsel, panel, tabbox, spoiler, heading, textblock, divider, image, tabs];
export const WIDGETS = new Map(WIDGET_LIST.map((d) => [d.type, d]));
export const GROUPS = ["Inputs", "Run", "Results", "Layout"];
export const defOf = (type) => WIDGETS.get(type) || null;

// the first values of the props (the defaults named in the definition)
export function defaultProps(def) {
    const out = {};
    for (const p of def.props || []) if (p.def !== undefined) out[p.id] = p.def;
    return out;
}
