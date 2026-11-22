// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-23.
// The two Turbo methods remember their lightweight setting independently.
export function generationParams(node, touch = () => {}) {
    if (!node?.properties?.acf_generation) return [];
    const mode = () => Number(node.widgets?.find(w => w.name === 'index')?.value);
    const proxy = {
        name: 'factory_generation_lightweight', node, type: 'toggle', options: {},
        get value() {
            const index = mode();
            return (index === 0 || index === 1) && node.properties.acf_generation.lightweight?.[index] === true;
        },
        setValue(value) {
            const index = mode();
            if (typeof value !== 'boolean' || (index !== 0 && index !== 1)) return false;
            const settings = node.properties.acf_generation;
            const next = [settings.lightweight?.[0] === true, settings.lightweight?.[1] === true];
            if (next[index] === value) return false;
            next[index] = value; settings.lightweight = next; touch(node); return true;
        },
    };
    return [{name: proxy.name, label: 'Облегчённая версия', ptype: 'BOOLEAN', widget: proxy, node, virtual: true, modeControl: true}];
}
