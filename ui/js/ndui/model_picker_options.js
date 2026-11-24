// SPDX-License-Identifier: AGPL-3.0-only
// Saved COMBO values are not evidence that files exist on the current PC.
const normalize=value=>String(value).replace(/\\/g,'/').replace(/^\.\//,'');
const empty=value=>['','none','null'].includes(String(value).trim().toLowerCase());
export function modelPickerOptions(state, files) {
    const options=Array.isArray(state.options)?state.options.filter(v=>typeof v==='string'):[];
    const actual=new Map((files||[]).map(name=>[normalize(name),name]));
    const unrestricted=state.p?.virtual||!options.length;
    const choices=unrestricted?[...actual.values()]:options.filter(name=>!empty(name)&&actual.has(normalize(name))).map(name=>actual.get(normalize(name)));
    const blank=options.find(empty);
    if(blank!==undefined)choices.unshift(blank);
    return [...new Set(choices)];
}
