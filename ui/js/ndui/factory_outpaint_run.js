// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {api} from '../../../scripts/api.js';
import {app} from '../../../scripts/app.js';
import {editPrompt,hasEditImage} from './factory_edit_run.js';
import {readOutpaint,syncOutpaintAdapters} from './factory_outpaint_params.js';
import {FactoryProgress,bindFactoryProgress} from './factory_progress.js';
export const outpaintProgress=new FactoryProgress();
export function outpaintPrompt(data,targets,modes,s){const copy={...data,output:structuredClone(data.output)};if(s.edit.backend==='qwen21')copy.output[s.edit.qwen21.rgb].inputs.image=[String(s.rawQwen21),0];return editPrompt(copy,targets,modes,s.edit,false,true,null);}
let building=false;const queued=new Set(),owner=()=> (app.graph?._nodes||app.graph?.nodes||[]).find(n=>n.properties?.acf_outpaint);
export function outpaintPlan(node){const s=node.properties.acf_outpaint,e=s.edit,plan=[{name:'Дорисовка · '+({qwen:'Qwen 2511',krea:'Krea',qwen21:'Qwen 2.1'}[e.backend]||'Qwen 2511'),sample:String(e.backend==='qwen21'?e.qwen21.sampler:e.backend==='krea'?e.kreaSampler:node.id),ids:new Set(s.nodes.map(String)),finish:[String(e.result)],runningLabel:'продолжение сцены'}];plan.operations=new Map([[String(e.photo),'загрузка исходника'],[String(s.pad),'расширение холста'],[String(s.resize),'восстановление полного размера'],[String(s.final),'сохранение исходной области'],[String(e.saver),'сохранение']]);return plan;}
export async function queueOutpaint(node,batch=1){
 if(building)throw Error('Подожди отправки предыдущего задания.');const s=node.properties.acf_outpaint,e=s.edit,g=node.graph,b=readOutpaint(node),file=g.getNodeById(e.photo)?.widgets?.find(w=>w.name==='image')?.value;if(!hasEditImage(file))throw Error('Сначала загрузи исходное фото.');if(!(b.left+b.right+b.top+b.bottom))throw Error('Расширь хотя бы одну сторону кадра.');
 if(e.backend==='qwen21'){const q=e.qwen21;if(!g.getNodeById(q.encode)?.widgets?.some(w=>w.name==='resolution'))throw Error('Для Qwen 2.1 нужен актуальный ComfyUI.');for(const[id,key,label]of[[q.model,'unet_name','модель'],[q.clip,'clip_name','энкодер'],[q.vae,'vae_name','VAE']]){const w=g.getNodeById(id)?.widgets?.find(w=>w.name===key),values=typeof w?.options?.values==='function'?w.options.values():w?.options?.values;if(!w?.value||Array.isArray(values)&&!values.includes(w.value))throw Error('Не найден '+label+' Qwen 2.1. Выбери файл в общих настройках.');}}
 syncOutpaintAdapters(node);const targets=[e.before,e.result,s.maskPreview,...(e.save?[e.saver]:[])],modes=new Map(targets.map(id=>[id,g.getNodeById(id)?.mode]));if([...modes.values()].some(v=>v==null))throw Error('Не найдены выходы дорисовки.');
 building=true;try{let data;for(const id of targets)g.getNodeById(id).mode=0;try{data=await app.graphToPrompt();}finally{for(const[id,mode]of modes)g.getNodeById(id).mode=mode;}data=outpaintPrompt(data,targets,modes,s);for(let i=0;i<Math.max(1,Math.min(64,Math.round(batch)));i++){const r=await api.queuePrompt(0,data,{partialExecutionTargets:targets.map(String)});if(r?.prompt_id)queued.add(r.prompt_id);if(r?.node_errors&&Object.keys(r.node_errors).length)throw Error('Ошибка дорисовки: '+JSON.stringify(r.node_errors));}return true;}finally{building=false;}
}
bindFactoryProgress(outpaintProgress,{plan:()=>{const n=owner();return n?outpaintPlan(n):null;},queued,contains:id=>{const n=owner();return !!n?.properties?.acf_outpaint?.nodes.map(String).includes(String(id));}});
