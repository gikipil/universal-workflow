// Universal Workflow update by gikipil, 2026-11-14: shared Turbo adapter selection.
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions/modifications by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
// SPDX-License-Identifier: AGPL-3.0-only
// ND UI virtual parameters for the existing rgthree Power LoRA Loader.
// This adapter exposes its real rows without adding widgets to the graph node.
import { catalog } from "./models.js";

const POWER_CLASS = "Power Lora Loader (rgthree)";
const FIELDS = [
    ["lora", "COMBO", "combo"],
    ["on", "BOOLEAN", "toggle"],
    ["strength", "FLOAT", "number"],
];
let names = [];
let namesRequest = null;

const validName = (value) => typeof value === "string" && value.trim().length > 0;

// Only reading the COMBO options starts catalog loading. Merely enumerating
// virtual parameters or reading their values has no network side effects.
function loraOptions(current) {
    if (!namesRequest) {
        try {
            namesRequest = Promise.resolve(catalog("loras"))
                .then((items) => {
                    names = items instanceof Map ? [...items.keys()].filter(validName) : [];
                })
                .catch(() => {});
        } catch {
            namesRequest = Promise.resolve();
        }
    }
    return [...new Set(["None", current, ...names].filter(validName))];
}

function isRow(widget) {
    const value = widget?.value;
    return /^lora_\d+$/.test(widget?.name || "") && value &&
        typeof value === "object" && !Array.isArray(value) &&
        "lora" in value && (value.lora == null || typeof value.lora === "string");
}

/**
 * Supported bindings: power_lora_1.lora / .on / .strength, etc.
 * Indices follow the current row order, not rgthree's internal widget counter.
 * touch(node) is supplied by the caller; no graph/UI globals are needed here.
 */
export function powerLoraParams(node, touch) {
    if ((node?.comfyClass || node?.type) !== POWER_CLASS) return [];
    const rows = (node.widgets || []).filter(isRow);
    return rows.flatMap((row, index) => FIELDS.map(([field, ptype, type]) => {
        const name = `power_lora_${index + 1}.${field}`;
        const options = {};
        if (ptype === "COMBO") {
            Object.defineProperty(options, "values", {
                enumerable: true,
                get: () => loraOptions(row.value?.lora),
            });
        }
        const proxy = {
            name, type, options, node,
            get value() {
                const value = row.value?.[field];
                return field === "lora" && value == null ? "None" : value;
            },
            setValue(value) {
                if (!row.value || typeof row.value !== "object") return false;
                if (field === "lora" && !validName(value)) return false;
                if (field === "on" && typeof value !== "boolean") return false;
                if (field === "strength" && (typeof value !== "number" || !Number.isFinite(value))) return false;
                // One file selection, applied to each independent stage's model bundle.
                let sharedChanged = false;
                if (field === "lora" && index === 0 && Array.isArray(node.properties?.acf_shared_turbo_targets)) {
                    // Older saved graphs may still list a removed stage. A stale
                    // target must not lock the primary file selector. Write only
                    // existing Power Loader rows, without recursive fan-out.
                    const visited = new Set([node]);
                    for (const id of node.properties.acf_shared_turbo_targets) {
                        const target = node.graph?.getNodeById(id);
                        if (!target || visited.has(target) || (target.comfyClass || target.type) !== POWER_CLASS) continue;
                        visited.add(target);
                        const targetRow = (target.widgets || []).find(isRow);
                        if (!targetRow || targetRow.value.lora === value) continue;
                        targetRow.loraInfo = null;
                        targetRow.loraInfoPromise = null;
                        if (typeof targetRow.setLora === "function") targetRow.setLora(value);
                        else { targetRow.value.lora = value; targetRow.getLoraInfo?.(); }
                        if (typeof touch === "function") touch(target);
                        sharedChanged = true;
                    }
                }
                if (row.value[field] === value) return sharedChanged;

                if (field === "lora") {
                    // rgthree's setLora calls getLoraInfo, whose cached promise
                    // otherwise still refers to the previously selected file.
                    row.loraInfo = null;
                    row.loraInfoPromise = null;
                    if (typeof row.setLora === "function") row.setLora(value);
                    else {
                        row.value.lora = value;
                        row.getLoraInfo?.();
                    }
                } else {
                    // Preserve the object and every other field, notably
                    // strengthTwo, which controls rgthree's linked CLIP mode.
                    row.value[field] = value;
                }
                if (typeof touch === "function") touch(node);
                return true;
            },
        };
        return {
            name, label: `LoRA ${index + 1} · ${field}`,
            ptype, widget: proxy, node, multiline: false, virtual: true,
            min: ptype === "FLOAT" ? -100 : undefined,
            max: ptype === "FLOAT" ? 100 : undefined,
            step: 0.05, precision: 2,
            def: undefined, control: false, seed: false,
        };
    }));
}
