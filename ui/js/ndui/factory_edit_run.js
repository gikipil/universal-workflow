import {rewriteUpscale,upscaleStage} from './factory_upscale_tasks.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {api} from '../../../scripts/api.js';
import {app} from '../../../scripts/app.js';
import {FactoryProgress,bindFactoryProgress} from './factory_progress.js';
export const editProgress=new FactoryProgress();
export const EMPTY_EDIT_IMAGE='universal-local-empty-mask.png';
export const hasEditImage=file=>typeof file==='string'&&file.trim()!==''&&file!==EMPTY_EDIT_IMAGE;
// This compiler removes absent references before collecting dependencies. No empty LoadImage
// and no duplicate of Picture 1 is substituted as Picture 2.
export function editPrompt(data,targets,originalModes,s,withReference,withMask=false,upscaleSpec=null){
 const output=structuredClone(data.output||{}),bypass=new Map();
 const ref=s.refiner;if(ref){const gate=output[ref.controller],mode=Number(gate?.inputs?.index),value=gate?.inputs?.['value'+mode];if(!Number.isInteger(mode)||mode<0||mode>4||!Array.isArray(value))throw Error('Не найден режим рефайнера редактора.');bypass.set(String(ref.controller),value);}
 const krea=s.backend==='krea',q21=s.backend==='qwen21'?s.qwen21:null;
 if(s.gate){const gate=output[s.gate];if(!gate)throw Error('Не найден переключатель редактора.');bypass.set(String(s.gate),gate.inputs[q21?'value2':krea?'value1':'value0']);}
 if(q21){
  if(!output[q21.encode])throw Error('Qwen 2.1 недоступен. Перезапусти ComfyUI после обновления до версии 0.37.0 или новее.');
  if(!upscaleSpec||!Number(output[upscaleSpec.enabled]?.inputs.index))bypass.set(String(q21.rgb),output[q21.rgb]?.inputs?.image);
  if(!withReference)delete output[q21.encode].inputs['images.image_2'];
  const encoded=output[q21.encode].inputs,link=encoded.prompt,text=Array.isArray(link)?output[link[0]]?.inputs?.value:link;
  if(typeof text==='string')encoded.prompt=text.replace(/<Picture\s*([12])>/gi,'<image$1>').replace(/\bPicture\s*([12])\b/gi,'<image$1>');
  bypass.set(String(s.maskComposite),output[s.maskComposite]?.inputs?.source);
  if(withMask){output[q21.sampler].inputs.latent_image=[String(q21.maskNoise),0];output[s.maskBlur].inputs.mask=[String(q21.scale),1];}
  else{bypass.set(String(q21.maskComposite),output[q21.maskComposite]?.inputs?.source);delete output[q21.scale]?.inputs?.mask;}
 }
 if(krea){
  if(!withReference){for(const key of ['source_latent_b','source_image_b'])delete output[s.kreaPatch]?.inputs?.[key];delete output[s.kreaPositive]?.inputs?.image_b;}
  if(withMask){if(!output[s.kreaMaskNoise])throw Error('Не найдена маска Krea.');output[s.kreaSampler].inputs.latent_image=[String(s.kreaMaskNoise),0];}
 }

 if(s.maskNoise&&!withMask){bypass.set(String(s.maskNoise),output[s.maskNoise]?.inputs?.samples);bypass.set(String(s.maskComposite),output[s.maskComposite]?.inputs?.source);delete output[s.scale]?.inputs?.mask;}
 if(!krea&&!q21&&!withReference)for(const id of s.optionalRefs){const input=output[id]?.inputs?.conditioning;if(!input)throw Error('Не найдена цепочка референсов Qwen.');bypass.set(String(id),input);}
 function redirect(v){const seen=new Set();while(Array.isArray(v)&&v.length===2&&bypass.has(String(v[0]))){if(seen.has(String(v[0])))throw Error('Зацикленная цепочка референсов.');seen.add(String(v[0]));v=bypass.get(String(v[0]));}return v;}
 for(const n of Object.values(output))for(const[k,v]of Object.entries(n.inputs||{}))n.inputs[k]=redirect(v);
 rewriteUpscale(output,upscaleSpec);
 const keep=new Set();function visit(id){id=String(id);if(keep.has(id))return;const n=output[id];if(!n)throw Error('Не найден узел редактора '+id);keep.add(id);for(const v of Object.values(n.inputs||{}))if(Array.isArray(v)&&v.length===2&&typeof v[1]==='number'&&Object.hasOwn(output,String(v[0])))visit(v[0]);}for(const id of targets)visit(id);
 if(!withMask&&s.maskFile&&keep.has(String(s.maskFile)))throw Error('Выключенная маска осталась подключена.');
 if(!withReference&&keep.has(String(s.reference)))throw Error('Пустой референс остался подключён.');
 const workflow=structuredClone(data.workflow);for(const n of workflow?.nodes||[])if(originalModes.has(n.id))n.mode=originalModes.get(n.id);
 return{...data,workflow,output:Object.fromEntries([...keep].map(id=>[id,output[id]]))};
}
const activeIds=new Set();let building=false;
const owner=()=> (app.graph?._nodes||app.graph?.nodes||[]).find(n=>n.properties?.acf_edit);
export function editPlan(n){
 const s=n.properties.acf_edit,g=n.graph,up=g.getNodeById(s.upscale),u=up?.properties.acf_upscale,enabled=!!g.getNodeById(u?.enabled)?.widgets?.find(w=>w.name==='index')?.value,r=s.refiner,mode=Number(g.getNodeById(r?.controller)?.widgets?.find(w=>w.name==='index')?.value)||0,upIds=new Set(u?.nodes||[]),refIds=new Set(r?.nodes||[]);
 const plan=[{name:s.backend==='qwen21'?'Редактирование · Qwen 2.1':s.backend==='krea'?'Редактирование · Krea Edit V2':'Редактирование · Qwen 2511',sample:String(s.backend==='qwen21'?s.qwen21.sampler:s.backend==='krea'?s.kreaSampler:n.id),ids:new Set(s.nodes.filter(id=>!upIds.has(id)&&!refIds.has(id)).map(String)),finish:[String(mode?r.before:enabled?u.before:s.result)],runningLabel:'изменение кадра'}];
 if(mode)plan.push({name:'Рефайнер · '+['','Krea','Krea RES4LYF','Z-Image','Z-Image RES4LYF'][mode],sample:String(r.samplers[mode-1]),ids:new Set(r.nodes.map(String)),finish:[String(r.after),String(r.decodes[mode-1])],runningLabel:'доработка изображения'});
 if(enabled)plan.push(upscaleStage(g,up,'Апскейл результата'));
 plan.operations=new Map([[String(s.photo),'загрузка исходника'],[String(s.reference),'загрузка референса'],[String(s.scale),'подготовка размера'],[String(n.id),'изменение кадра'],[String(s.result),'подготовка результата'],[String(s.saver),'сохранение']]);return plan;
}
export async function queueEdit(node,batch=1){
 if(building)throw Error('Подожди завершения отправки предыдущего задания.');const s=node.properties.acf_edit,g=node.graph,file=id=>g.getNodeById(id)?.widgets?.find(w=>w.name==='image')?.value;
 if(!hasEditImage(file(s.photo)))throw Error('Сначала загрузи основной кадр.');
 if(s.backend==='qwen21'){
  const q=s.qwen21,encoder=g.getNodeById(q?.encode);
  if(!encoder?.widgets?.some(w=>w.name==='resolution'))throw Error('Для Qwen 2.1 нужен перезапуск ComfyUI после обновления ядра.');
  for(const[id,key,label]of [[q.model,'unet_name','модель'],[q.clip,'clip_name','энкодер'],[q.vae,'vae_name','VAE']]){const w=g.getNodeById(id)?.widgets?.find(w=>w.name===key),values=typeof w?.options?.values==='function'?w.options.values():w?.options?.values;if(!w?.value||Array.isArray(values)&&!values.includes(w.value))throw Error('Не найден файл Qwen 2.1: '+label+'. Выбери его в общих настройках → Редактирование · Qwen 2.1.');}
 }

 if(s.maskEnabled&&(!hasEditImage(file(s.maskFile))||s.maskFor!==file(s.photo)))throw Error('Нарисуй и сохрани маску для текущего основного кадра или выключи режим «По маске».');
 const up=g.getNodeById(s.upscale),u=up?.properties.acf_upscale,upEnabled=!!g.getNodeById(u?.enabled)?.widgets?.find(w=>w.name==='index')?.value;
 const ref=s.refiner,refEnabled=!!g.getNodeById(ref?.controller)?.widgets?.find(w=>w.name==='index')?.value;
 const targets=[s.before,s.result,...(refEnabled?[ref.before,ref.after]:[]),...(upEnabled?[u.before,u.after]:[]),...(s.save?[s.saver]:[])],modes=new Map(targets.map(id=>[id,g.getNodeById(id)?.mode]));if([...modes.values()].some(v=>v==null))throw Error('Не найдены выходы редактора.');
 building=true;try{let data;for(const id of targets)g.getNodeById(id).mode=0;try{data=await app.graphToPrompt();}finally{for(const[id,mode]of modes)g.getNodeById(id).mode=mode;}
  data=editPrompt(data,targets,modes,s,hasEditImage(file(s.reference)),s.maskEnabled===true,u);
  for(let i=0;i<Math.max(1,Math.min(64,Math.round(batch)));i++){const result=await api.queuePrompt(0,data,{partialExecutionTargets:targets.map(String)});if(result?.prompt_id)activeIds.add(result.prompt_id);if(result?.node_errors&&Object.keys(result.node_errors).length)throw Error('Ошибка редактора: '+JSON.stringify(result.node_errors));}return true;
 }finally{building=false;}
}
bindFactoryProgress(editProgress,{plan:()=>{const n=owner();return n?editPlan(n):null;},queued:activeIds,contains:id=>{const n=owner();return !!n?.properties?.acf_edit?.nodes.map(String).includes(String(id));},recognize:id=>{const n=owner(),s=n?.properties?.acf_edit;return !!s&&Number(id)>=s.photo&&s.nodes.map(String).includes(String(id));}});
