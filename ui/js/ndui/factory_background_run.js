// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-13.
import {api} from '../../../scripts/api.js';
import {app} from '../../../scripts/app.js';
import {FactoryProgress} from './factory_progress.js';
export const backgroundProgress=new FactoryProgress();
let building=false,runningPid='',backgroundPid='';const queued=new Set();
const nodes=()=>app.graph?._nodes||app.graph?.nodes||[];
const owner=()=>nodes().find(n=>n.properties?.acf_background);
export function backgroundPlan(n){const s=n.properties.acf_background,plan=[{name:'Удаление фона',sample:String(n.id),ids:new Set(s.nodes.map(String)),finish:[String(s.result),String(s.mask)],runningLabel:'отделение объекта'}];plan.operations=new Map([[String(s.photo),'загрузка фото'],[String(n.id),'отделение объекта'],[String(s.before),'подготовка исходника'],[String(s.result),'подготовка PNG'],[String(s.mask),'подготовка маски'],[String(s.saver),'сохранение PNG']]);return plan;}
export function backgroundPrompt(data,targets,originalModes){
 const output=data.output||{},keep=new Set();function visit(id){id=String(id);if(keep.has(id))return;if(!output[id])throw Error('Не найден узел удаления фона '+id);keep.add(id);for(const v of Object.values(output[id].inputs||{}))if(Array.isArray(v)&&v.length===2&&typeof v[1]==='number'&&Object.hasOwn(output,String(v[0])))visit(v[0]);}
 for(const id of targets)visit(id);const workflow=structuredClone(data.workflow);for(const n of workflow?.nodes||[])if(originalModes.has(n.id))n.mode=originalModes.get(n.id);
 return{...data,workflow,output:Object.fromEntries([...keep].map(id=>[id,output[id]]))};
}
export async function queueBackground(node,batch=1){
 if(building)throw Error('Подожди завершения отправки предыдущего задания.');const s=node.properties.acf_background,g=node.graph,file=g.getNodeById(s.photo)?.widgets?.find(w=>w.name==='image')?.value;if(!file||file==='universal-local-empty-mask.png')throw Error('Сначала загрузи исходное фото.');
 const targets=[s.before,s.result,s.mask,...(s.save?[s.saver]:[])],originalModes=new Map(targets.map(id=>[id,g.getNodeById(id)?.mode]));if([...originalModes.values()].some(v=>v==null))throw Error('Не найдены выходы удаления фона.');building=true;let data;
 try{for(const id of targets)g.getNodeById(id).mode=0;try{data=await app.graphToPrompt();}finally{for(const[id,mode]of originalModes)g.getNodeById(id).mode=mode;}
  data=backgroundPrompt(data,targets,originalModes);for(let i=0;i<Math.max(1,Math.min(64,Math.round(batch)));i++){const result=await api.queuePrompt(0,data,{partialExecutionTargets:targets.map(String)});if(result?.prompt_id)queued.add(result.prompt_id);if(result?.node_errors&&Object.keys(result.node_errors).length)throw Error('Ошибка удаления фона: '+JSON.stringify(result.node_errors));}return true;
 }finally{building=false;}
}
const idOf=d=>String(d?.display_node_id??d?.display_node??d?.real_node_id??d?.node_id??d?.node??d??'');
const start=()=>{const n=owner();if(!n)return;backgroundProgress.start(backgroundPlan(n));backgroundPid=runningPid;};
api.addEventListener('execution_start',e=>{runningPid=e.detail?.prompt_id||'';if(queued.has(runningPid)){queued.delete(runningPid);start();}});
api.addEventListener('executing',e=>{const id=idOf(e.detail),n=owner();if(!n?.properties.acf_background.nodes.map(String).includes(id))return;if(!backgroundProgress.active||backgroundPid!==runningPid)start();const previous=backgroundProgress.current;if(previous&&previous!==id)backgroundProgress.finish(previous);backgroundProgress.enter(id);});
api.addEventListener('executed',e=>{if(backgroundProgress.active)backgroundProgress.finish(idOf(e.detail));});
api.addEventListener('progress',e=>{if(backgroundProgress.active){const d=e.detail||{};backgroundProgress.progress(idOf(d),d.value,d.max);}});
api.addEventListener('execution_cached',e=>{const n=owner();if(!n)return;const ids=e.detail?.nodes||[];if(ids.some(id=>n.properties.acf_background.nodes.includes(Number(id)))){if(!backgroundProgress.active)start();for(const id of ids)backgroundProgress.finish(id);}});
for(const event of['execution_success','execution_interrupted','execution_error'])api.addEventListener(event,e=>{if(!backgroundProgress.active)return;if(e.detail?.prompt_id&&backgroundPid&&e.detail.prompt_id!==backgroundPid)return;backgroundProgress.active=false;backgroundProgress.stopped=Date.now();if(event==='execution_success')backgroundProgress.complete=true;else if(event==='execution_interrupted')backgroundProgress.interrupted=true;else backgroundProgress.error=e.detail?.exception_message||'Не удалось удалить фон';});
