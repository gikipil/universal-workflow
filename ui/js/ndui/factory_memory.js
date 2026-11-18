// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-19: worker-side pre-execution cleanup.
let ready;
export async function memoryReady(api){
 if(!ready)ready=(async()=>{try{const r=await api.fetchApi('/universal-memory/status');const data=await r.json();if(!r.ok||data.ready!==true||data.version!==1)throw Error();}catch{ready=null;throw Error('Модуль очистки памяти недоступен. Установи ComfyUI-Universal-Memory и перезапусти ComfyUI.');}})();
 return ready;
}
export function memoryPrompt(data){
 const workflow=data.workflow||{nodes:[],links:[],groups:[],extra:{},config:{},last_node_id:0,last_link_id:0,version:0.4};
 return{...data,workflow:{...workflow,extra:{...workflow.extra,universal_memory_cleanup:true}}};
}
export async function queueWithMemory(api,number,data,options,send=api.queuePrompt){
 await memoryReady(api);
 return send.call(api,number,memoryPrompt(data),options);
}
