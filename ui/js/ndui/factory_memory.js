// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-19: worker-side pre-execution cleanup.
import {validatePromptModels} from './factory_model_preflight.js';
let ready;
export async function memoryReady(api){
 if(!ready)ready=(async()=>{try{const r=await api.fetchApi('/universal-memory/status');const data=await r.json();if(!r.ok||data.ready!==true||![1,2].includes(data.version)||data.version===2&&data.preserves_results!==true)throw Error();return data;}catch{ready=null;throw Error('Модуль очистки памяти недоступен. Установи ComfyUI-Universal-Memory и перезапусти ComfyUI.');}})();
 return ready;
}
export function memoryPrompt(data,cleanup=true){
 const workflow=data.workflow||{nodes:[],links:[],groups:[],extra:{},config:{},last_node_id:0,last_link_id:0,version:0.4};
 return{...data,workflow:{...workflow,extra:{...workflow.extra,universal_memory_cleanup:cleanup}}};
}
export async function queueWithMemory(api,number,data,options,send=api.queuePrompt){
 await validatePromptModels(data,options?.partialExecutionTargets);
 const capabilities=await memoryReady(api);
 // A still-running v1 server resets all results. Skip its cleanup until the
 // next normal restart, so refreshing the UI can preserve an existing render.
 return send.call(api,number,memoryPrompt(data,capabilities.version===2),options);
}
