import {cloneJsonData} from './json_data.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {api} from '../../../scripts/api.js';
import {queueWithMemory} from './factory_memory.js';
// Keep the regular ComfyUI queue path (including rgthree Seed hooks), but submit
// only this task's selected branches. Custom editor/SAM/background/upscale jobs
// already carry explicit targets and are left untouched.
export function generationPrompt(data){
 const workflow=data?.workflow,nodes=workflow?.nodes||[],tag=t=>nodes.find(n=>n.properties?.nd_ui_src?.tag===t);
 if(!tag('k2module-mode')||!data.output?.['69']||!data.output?.['162']||data.output.ndui_run_target)return null;
 const output=cloneJsonData(data.output);
 function scalar(value,seen=new Set()){if(!Array.isArray(value))return value;const id=String(value[0]);if(seen.has(id))throw Error('Зацикленный переключатель генерации.');seen.add(id);const n=output[id];if(!n)return undefined;if(['PrimitiveInt','PrimitiveFloat','PrimitiveBoolean'].includes(n.class_type))return scalar(n.inputs.value,seen);return undefined;}
 function index(id){const value=scalar(output[id]?.inputs?.index);return typeof value==='boolean'?Number(value):typeof value==='number'&&Number.isInteger(value)?value:undefined;}
 const generation=tag('k2module-mode'),settings=generation.properties?.acf_generation,mode=index(generation.id);
 const lightweight=(mode===0||mode===1)&&settings?.lightweight?.[mode]===true;
 if(lightweight){
  const loader=output[settings.turboModel],user=output[settings.userLora],adapter=output[settings.turboAdapter];
  if(loader?.class_type!=='UNETLoader'||user?.class_type!=='Power Lora Loader (rgthree)'||adapter?.class_type!=='Power Lora Loader (rgthree)'||typeof loader.inputs?.unet_name!=='string'||!loader.inputs.unet_name.trim()||loader.inputs.unet_name==='None')throw Error('Выбери готовую Turbo-модель Krea2 в общих настройках.');
  // Only the first generation bundle changes. Refiner/local/editing bundles
  // keep their existing Raw model and adapter. User LoRAs and pose stay wired.
  user.inputs.model=[String(settings.turboModel),0];
 }
 function redirect(value){const seen=new Set();while(Array.isArray(value)&&value.length===2){const id=String(value[0]),n=output[id];if(lightweight&&id===String(settings.turboAdapter)&&value[1]===0){if(seen.has(id))throw Error('Зацикленная ветка генерации.');seen.add(id);value=n.inputs.model;continue;}if(n?.class_type!=='easy anythingIndexSwitch')break;const i=index(id);if(i===undefined)break;if(seen.has(id))throw Error('Зацикленная ветка генерации.');seen.add(id);value=n.inputs['value'+i];if(!Array.isArray(value))throw Error('Не подключён выбранный режим генерации · '+id);}return value;}
 const targets=['69','162','164'].filter(id=>output[id]);const local=nodes.find(n=>n.properties?.acf_local)?.properties.acf_local;
 // Keep the pre-local image available for painting even while all local modes are off.
 if(local?.sam?.before&&output[local.sam.before])targets.push(String(local.sam.before));
 if(local)for(const key of local.order||[]){const s=local[key];if(s&&index(s.gate))for(const id of[s.before,s.after,s.maskPreview])if(output[id])targets.push(String(id));}
 const up=tag('upscale-controller')?.properties?.acf_upscale;if(up&&index(up.enabled))for(const id of[up.before,up.after])if(output[id])targets.push(String(id));
 for(const id of['71','167'])if(output[id]&&nodes.find(n=>String(n.id)===id)?.mode===0)targets.push(id);
 const keep=new Set(),path=new Set();function visit(id){id=String(id);if(path.has(id))throw Error('Зацикленная обработка генерации · '+id);if(keep.has(id))return;const n=output[id];if(!n)throw Error('Не найден узел генерации '+id);path.add(id);for(const[key,input]of Object.entries(n.inputs||{})){const v=redirect(input);n.inputs[key]=v;if(Array.isArray(v)&&v.length===2&&typeof v[1]==='number'&&Object.hasOwn(output,String(v[0])))visit(v[0]);}path.delete(id);keep.add(id);}for(const id of targets)visit(id);
 return{data:{...data,output:Object.fromEntries([...keep].map(id=>[id,output[id]]))},targets:[...new Set(targets)]};
}
export function installGenerationQueue(queueApi=api){
 if(queueApi.queuePrompt?.universalGenerationScope)return;const original=queueApi.queuePrompt;
 async function scoped(number,data,options){const explicit=Array.isArray(options?.partialExecutionTargets)&&options.partialExecutionTargets.length>0;const selected=explicit?null:generationPrompt(data);if(selected)return queueWithMemory(this,number,selected.data,{...options,partialExecutionTargets:selected.targets},original);return original.call(this,number,data,options);}
 scoped.universalGenerationScope=true;queueApi.queuePrompt=scoped;
}
installGenerationQueue();
