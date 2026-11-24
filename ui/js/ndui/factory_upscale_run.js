import {cloneJsonData} from './json_data.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {api} from '../../../scripts/api.js';
import {queueWithMemory} from './factory_memory.js';
import {app} from '../../../scripts/app.js';
import {FactoryProgress,bindFactoryProgress} from './factory_progress.js';
import {rewriteUpscale,upscaleStage} from './factory_upscale_tasks.js';
export const upscaleProgress=new FactoryProgress();
export function upscalePrompt(data,targets,modes,spec){
 const output=rewriteUpscale(cloneJsonData(data.output||{}),spec),keep=new Set();
 function scalar(value,seen=new Set()){
  if(!Array.isArray(value))return typeof value==='boolean'?Number(value):value;
  const id=String(value[0]);if(seen.has(id))throw Error('Зацикленное управление режимом обработки фото.');seen.add(id);
  const n=output[id];if(!n||value[1]!==0)return undefined;
  if(['PrimitiveInt','PrimitiveFloat','PrimitiveBoolean'].includes(n.class_type))return scalar(n.inputs.value,seen);
  if(n.class_type==='easy anythingIndexSwitch'){const i=scalar(n.inputs.index,new Set(seen));return Number.isInteger(i)?scalar(n.inputs['value'+i],seen):undefined;}
  return undefined;
 }
 function visit(id){id=String(id);if(keep.has(id))return;const n=output[id];if(!n)throw Error('Не найден узел апскейла '+id);keep.add(id);
  for(const [key,input]of Object.entries(n.inputs||{})){let v=input;const seen=new Set();
   while(Array.isArray(v)&&output[v[0]]?.class_type==='easy anythingIndexSwitch'){
    const q=output[v[0]],i=scalar(q.inputs.index);
    if(!Number.isInteger(i)||i<0||!Array.isArray(q.inputs['value'+i]))throw Error('Не найден выбранный режим обработки фото · '+v[0]);
    if(seen.has(String(v[0])))throw Error('Зацикленный режим обработки фото.');seen.add(String(v[0]));v=q.inputs['value'+i];
   }
   n.inputs[key]=v;if(Array.isArray(v)&&v.length===2&&typeof v[1]==='number'&&Object.hasOwn(output,String(v[0])))visit(v[0]);
  }
 }
 for(const id of targets)visit(id);const workflow=cloneJsonData(data.workflow);for(const n of workflow?.nodes||[])if(modes.has(n.id))n.mode=modes.get(n.id);
 return{...data,workflow,output:Object.fromEntries([...keep].map(id=>[id,output[id]]))};
}
let building=false;const queued=new Set(),owner=()=> (app.graph?._nodes||app.graph?.nodes||[]).find(n=>n.properties?.acf_upscale_task);
export function upscalePlan(node){
 const s=node.properties.acf_upscale_task,g=node.graph,read=id=>Number(g.getNodeById(id)?.widgets?.find(w=>w.name==='index')?.value)||0,plan=[];
 const r=s.refiner,mode=r&&read(r.controller);if(mode)plan.push({name:'Рефайнер · '+['','Krea','Krea RES4LYF','Z-Image','Z-Image RES4LYF'][mode],sample:String(r.samplers[mode-1]),ids:new Set(r.nodes.map(String)),finish:[String(r.after),String(r.decodes[mode-1])],runningLabel:'доработка фото'});
 const local=g.getNodeById(s.local)?.properties?.acf_local;if(local)for(const key of local.order){const d=local[key];if(read(d.gate))plan.push({name:'Область · '+({face:'Лицо',hands:'Руки',sam:'SAM',manual:'Ручная маска'}[key]),sample:String(d.detail),ids:new Set(Object.values(d).filter(Number.isInteger).map(String)),finish:[String(d.after)],local:true,detect:String(d.detect),sam:key==='sam'});}
 if(read(node.properties.acf_upscale.enabled))plan.push(upscaleStage(g,node));
 if(!plan.length)plan.push({name:'Исходное фото',sample:String(s.photo),ids:new Set([String(s.photo)]),finish:[String(node.properties.acf_upscale.after)]});
 plan[0].ids.add(String(s.photo));plan.operations=new Map([[String(s.photo),'загрузка фото'],[String(node.properties.acf_upscale.dit),'загрузка SeedVR · DiT'],[String(node.properties.acf_upscale.vae),'загрузка SeedVR · VAE'],[String(s.saver),'сохранение']]);return plan;
}
export async function queueUpscale(node,batch=1){
 if(building)throw Error('Подожди завершения отправки предыдущего задания.');const s=node.properties.acf_upscale_task,u=node.properties.acf_upscale,g=node.graph,file=g.getNodeById(s.photo)?.widgets?.find(w=>w.name==='image')?.value;if(!file||file==='universal-local-empty-mask.png')throw Error('Сначала загрузи фото для увеличения.');
 const local=g.getNodeById(s.local)?.properties?.acf_local,previews=s.refiner?[s.refiner.before,s.refiner.after]:[];if(local){previews.push(local.manual.before);for(const key of local.order){const d=local[key];if(Number(g.getNodeById(d.gate)?.widgets?.find(w=>w.name==='index')?.value))previews.push(d.before,d.after,d.maskPreview);}}const targets=[...new Set([u.before,u.after,...previews,...(s.save?[s.saver]:[])])],modes=new Map(targets.map(id=>[id,g.getNodeById(id)?.mode]));if([...modes.values()].some(v=>v==null))throw Error('Не найдены выходы апскейла.');
 building=true;try{let data;for(const id of targets)g.getNodeById(id).mode=0;try{data=await app.graphToPrompt();}finally{for(const[id,mode]of modes)g.getNodeById(id).mode=mode;}data=upscalePrompt(data,targets,modes,u);for(let i=0;i<Math.max(1,Math.min(64,Math.round(batch)));i++){const r=await queueWithMemory(api,0,data,{partialExecutionTargets:targets.map(String)});if(r?.prompt_id)queued.add(r.prompt_id);if(r?.node_errors&&Object.keys(r.node_errors).length)throw Error('Ошибка апскейла: '+JSON.stringify(r.node_errors));}return true;}finally{building=false;}
}
bindFactoryProgress(upscaleProgress,{plan:()=>{const n=owner();return n?upscalePlan(n):null;},queued:queued,contains:id=>{const n=owner();return !!n?.properties?.acf_upscale_task?.nodes.map(String).includes(String(id));},recognize:id=>{const n=owner(),s=n?.properties?.acf_upscale_task;return !!s&&Number(id)>=s.photo&&s.nodes.map(String).includes(String(id));}});
