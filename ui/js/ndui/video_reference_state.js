// SPDX-License-Identifier: AGPL-3.0-only
export const VIDEO_REFS_UNAVAILABLE='Недоступна нода видеореференсов. Установи зависимости видео, перезапусти ComfyUI и открой актуальный workflow.';
export const VIDEO_REFS_INVALID='Повреждены настройки видеореференсов. Открой актуальный workflow заново.';
export const VIDEO_REFS_NOT_SAVED='Не удалось сохранить список видеореференсов. Проверь подключение ноды.';

export function normalizeVideoReferences(slots,limits){
    if(slots===undefined)slots={};
    if(!slots||typeof slots!=='object'||Array.isArray(slots))throw Error(VIDEO_REFS_INVALID);
    const result={};
    for(const[kind,max]of Object.entries(limits)){
        const items=slots[kind]===undefined?[]:slots[kind];
        if(!Array.isArray(items)||items.length>max||items.some(item=>!item||typeof item!=='object'||Array.isArray(item)||typeof item.id!=='string'||typeof item.file!=='string'))throw Error(VIDEO_REFS_INVALID);
        result[kind]=items;
    }
    return result;
}

export function readVideoReferenceState(raw,limits,binding){
    if(binding?.lost||binding?.bound===false||raw==null||raw===''||raw==='undefined')throw Error(VIDEO_REFS_UNAVAILABLE);
    let data;try{data=typeof raw==='string'?JSON.parse(raw):raw;}catch{throw Error(VIDEO_REFS_INVALID);}
    return normalizeVideoReferences(data,limits);
}

// Match the loader's canonical form before checking persistence. It adds
// enabled/audio_mode to new slots; JSON property order is not meaningful.
export function videoReferenceWriteState(slots,limits){
    const result=normalizeVideoReferences(slots,limits);
    for(const kind of Object.keys(limits))result[kind]=result[kind].map(item=>({...item,enabled:true,...(kind==='video'?{audio_mode:'paired'}:{})}));
    return result;
}
export function sameVideoReferences(a,b){
    const ordered=value=>Array.isArray(value)?value.map(ordered):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,ordered(value[key])])):value;
    return JSON.stringify(ordered(a))===JSON.stringify(ordered(b));
}
