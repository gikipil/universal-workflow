import {rewriteUpscale,upscaleStage} from './factory_upscale_tasks.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {api} from '../../../scripts/api.js';
import {app} from '../../../scripts/app.js';
import {FactoryProgress} from './factory_progress.js';
export const editProgress=new FactoryProgress();
export const EMPTY_EDIT_IMAGE='universal-local-empty-mask.png';
export const hasEditImage=file=>typeof file==='string'&&file.trim()!==''&&file!==EMPTY_EDIT_IMAGE;
// This compiler removes absent references before collecting dependencies. No empty LoadImage
// and no duplicate of Picture 1 is substituted as Picture 2.
export function editPrompt(data,targets,originalModes,s,withReference,withMask=false,upscaleSpec=null){
 const output=structuredClone(data.output||{}),bypass=new Map();
 const krea=s.backend==='krea';
 if(s.gate){const gate=output[s.gate];if(!gate)throw Error('Не найден переключатель редактора.');bypass.set(String(s.gate),gate.inputs[krea?'value1':'value0']);}
 if(krea){
  if(!withReference){for(const key of ['source_latent_b','source_image_b'])delete output[s.kreaPatch]?.inputs?.[key];delete output[s.kreaPositive]?.inputs?.image_b;}
  if(withMask){if(!output[s.kreaMaskNoise])throw Error('Не найдена маска Krea.');output[s.kreaSampler].inputs.latent_image=[String(s.kreaMaskNoise),0];}
 }

 if(s.maskNoise&&!withMask){bypass.set(String(s.maskNoise),output[s.maskNoise]?.inputs?.samples);bypass.set(String(s.maskComposite),output[s.maskComposite]?.inputs?.source);delete output[s.scale]?.inputs?.mask;}
 if(!krea&&!withReference)for(const id of s.optionalRefs){const input=output[id]?.inputs?.conditioning;if(!input)throw Error('Не найдена цепочка референсов Qwen.');bypass.set(String(id),input);}
 function redirect(v){const seen=new Set();while(Array.isArray(v)&&v.length===2&&bypass.has(String(v[0]))){if(seen.has(String(v[0])))throw Error('Зацикленная цепочка референсов.');seen.add(String(v[0]));v=bypass.get(String(v[0]));}return v;}
 for(const n of Object.values(output))for(const[k,v]of Object.entries(n.inputs||{}))n.inputs[k]=redirect(v);
 rewriteUpscale(output,upscaleSpec);
 const keep=new Set();function visit(id){id=String(id);if(keep.has(id))return;const n=output[id];if(!n)throw Error('Не найден узел редактора '+id);keep.add(id);for(const v of Object.values(n.inputs||{}))if(Array.isArray(v)&&v.length===2&&typeof v[1]==='number'&&Object.hasOwn(output,String(v[0])))visit(v[0]);}for(const id of targets)visit(id);
 if(!withMask&&s.maskFile&&keep.has(String(s.maskFile)))throw Error('Выключенная маска осталась подключена.');
 if(!withReference&&keep.has(String(s.reference)))throw Error('Пустой референс остался подключён.');
 const workflow=structuredClone(data.workflow);for(const n of workflow?.nodes||[])if(originalModes.has(n.id))n.mode=originalModes.get(n.id);
 return{...data,workflow,output:Object.fromEntries([...keep].map(id=>[id,output[id]]))};
}
const activeIds=new Set();let building=false,runningPid='',editPid='';
const owner=()=> (app.graph?._nodes||app.graph?.nodes||[]).find(n=>n.properties?.acf_edit);
export function editPlan(n){const s=n.properties.acf_edit,g=n.graph,up=g.getNodeById(s.upscale),u=up?.properties.acf_upscale,enabled=!!g.getNodeById(u?.enabled)?.widgets?.find(w=>w.name==='index')?.value,upIds=new Set(u?.nodes||[]),plan=[{name:s.backend==='krea'?'Редактирование · Krea Edit V2':'Редактирование · Qwen 2511',sample:String(s.backend==='krea'?s.kreaSampler:n.id),ids:new Set(s.nodes.filter(id=>!upIds.has(id)).map(String)),finish:[String(enabled?u.before:s.result)],runningLabel:'изменение кадра'}];if(enabled)plan.push(upscaleStage(g,up,'Апскейл результата'));plan.operations=new Map([[String(s.photo),'загрузка исходника'],[String(s.reference),'загрузка референса'],[String(s.scale),'подготовка размера'],[String(n.id),'изменение кадра'],[String(s.result),'подготовка результата'],[String(s.saver),'сохранение']]);return plan;}
export async function queueEdit(node,batch=1){
 if(building)throw Error('Подожди завершения отправки предыдущего задания.');const s=node.properties.acf_edit,g=node.graph,file=id=>g.getNodeById(id)?.widgets?.find(w=>w.name==='image')?.value;
 if(!hasEditImage(file(s.photo)))throw Error('Сначала загрузи основной кадр.');
 if(s.maskEnabled&&(!hasEditImage(file(s.maskFile))||s.maskFor!==file(s.photo)))throw Error('Нарисуй и сохрани маску для текущего основного кадра или выключи режим «По маске».');
 const up=g.getNodeById(s.upscale),u=up?.properties.acf_upscale,upEnabled=!!g.getNodeById(u?.enabled)?.widgets?.find(w=>w.name==='index')?.value;
 const targets=[s.before,s.result,...(upEnabled?[u.before,u.after]:[]),...(s.save?[s.saver]:[])],modes=new Map(targets.map(id=>[id,g.getNodeById(id)?.mode]));if([...modes.values()].some(v=>v==null))throw Error('Не найдены выходы редактора.');
 building=true;try{let data;for(const id of targets)g.getNodeById(id).mode=0;try{data=await app.graphToPrompt();}finally{for(const[id,mode]of modes)g.getNodeById(id).mode=mode;}
  data=editPrompt(data,targets,modes,s,hasEditImage(file(s.reference)),s.maskEnabled===true,u);
  for(let i=0;i<Math.max(1,Math.min(64,Math.round(batch)));i++){const result=await api.queuePrompt(0,data,{partialExecutionTargets:targets.map(String)});if(result?.prompt_id)activeIds.add(result.prompt_id);if(result?.node_errors&&Object.keys(result.node_errors).length)throw Error('Ошибка редактора: '+JSON.stringify(result.node_errors));}return true;
 }finally{building=false;}
}
const idOf=d=>String(d?.display_node_id??d?.display_node??d?.real_node_id??d?.node_id??d?.node??d??'');
const start=()=>{const n=owner();if(!n)return;editProgress.start(editPlan(n));editPid=runningPid;};
api.addEventListener('execution_start',e=>{runningPid=e.detail?.prompt_id||'';if(activeIds.has(runningPid)){activeIds.delete(runningPid);start();}});
api.addEventListener('executing',e=>{const id=idOf(e.detail),n=owner();if(!n?.properties.acf_edit.nodes.map(String).includes(id))return;if(!editProgress.active||editPid!==runningPid)start();const previous=editProgress.current;if(previous&&previous!==id)editProgress.finish(previous);editProgress.enter(id);});
api.addEventListener('executed',e=>{if(editProgress.active)editProgress.finish(idOf(e.detail));});
api.addEventListener('progress',e=>{if(editProgress.active){const d=e.detail||{};editProgress.progress(idOf(d),d.value,d.max);}});
api.addEventListener('execution_cached',e=>{const n=owner();if(!n)return;const ids=e.detail?.nodes||[];if(ids.some(id=>n.properties.acf_edit.nodes.includes(Number(id)))){if(!editProgress.active)start();for(const id of ids)editProgress.finish(id);}});
for(const event of['execution_success','execution_interrupted','execution_error'])api.addEventListener(event,e=>{if(!editProgress.active)return;if(e.detail?.prompt_id&&editPid&&e.detail.prompt_id!==editPid)return;editProgress.active=false;editProgress.stopped=Date.now();if(event==='execution_success')editProgress.complete=true;else if(event==='execution_interrupted')editProgress.interrupted=true;else editProgress.error=e.detail?.exception_message||'Не удалось отредактировать кадр';});
