// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-17: isolated LanPaint outpainting.
import {api} from '../../../scripts/api.js';
import {queueWithMemory} from './factory_memory.js';
import {app} from '../../../scripts/app.js';
import {fileUrl,refFromName} from './media/io.js';
import {hasEditImage} from './factory_edit_run.js';
import {readOutpaint,outpaintGeometry,outpaintWorkingSize,outpaintBranch} from './factory_outpaint_params.js';
import {FactoryProgress,bindFactoryProgress} from './factory_progress.js';
export const outpaintProgress=new FactoryProgress();
export function outpaintImageSize(file){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>reject(Error('Не удалось прочитать размер исходного фото.'));img.src=fileUrl(refFromName(file));});}
export function outpaintPrompt(data,targets,modes,s,geometry=null){
 const output=structuredClone(data.output||{}),branch=s.branches[s.backend];if(!branch||output[branch.sampler]?.class_type!=='LanPaint_KSampler')throw Error('Не найден LanPaint. Перезапусти ComfyUI и открой актуальный workflow.');if(output[branch.decode]?.class_type!=='LanPaint_ImageDecode')throw Error('Не найдена цепочка декодирования LanPaint.');
 if(geometry){if(!output[s.pad])throw Error('Не найдено расширение холста.');for(const k of['left','right','top','bottom'])output[s.pad].inputs[k]=geometry[k];}
 if(!output[s.gate])throw Error('Не найден выбор результата дорисовки.');const selected=[String(branch.decode),0];for(const n of Object.values(output))for(const[k,v]of Object.entries(n.inputs||{}))if(Array.isArray(v)&&String(v[0])===String(s.gate))n.inputs[k]=selected;
 const keep=new Set();function visit(id){id=String(id);if(keep.has(id))return;const n=output[id];if(!n)throw Error('Не найден узел дорисовки '+id);keep.add(id);for(const v of Object.values(n.inputs||{}))if(Array.isArray(v)&&v.length===2&&typeof v[1]==='number')visit(v[0]);}for(const id of targets)visit(id);
 const final=Object.fromEntries([...keep].map(id=>[id,output[id]]));if(Object.values(final).filter(n=>n.class_type==='LanPaint_KSampler').length!==1)throw Error('В дорисовке должна выполняться только одна выбранная модель.');
 const workflow=structuredClone(data.workflow);for(const n of workflow?.nodes||[])if(modes.has(n.id))n.mode=modes.get(n.id);return{...data,workflow,output:final};
}
let building=false;const queued=new Set(),owner=()=> (app.graph?._nodes||app.graph?.nodes||[]).find(n=>n.properties?.acf_outpaint?.branches);
export function outpaintPlan(node){const s=node.properties.acf_outpaint,b=outpaintBranch(node),plan=[{name:'Дорисовка · '+({krea:'Krea2',qwen21:'Qwen 2.1',qwen:'Qwen 2511'}[s.backend])+' · LanPaint',sample:String(b.sampler),ids:new Set(s.nodes.map(String)),finish:[String(s.result)],runningLabel:'продолжение сцены'}];plan.operations=new Map([[String(s.photo),'загрузка исходника'],[String(s.scale),'размер обработки'],[String(s.pad),'расширение холста'],[String(b.decode),'сборка результата'],[String(s.saver),'сохранение']]);return plan;}
export async function queueOutpaint(node,batch=1){if(building)throw Error('Подожди отправки предыдущего задания.');building=true;try{
 const s=node.properties.acf_outpaint,g=node.graph,b=readOutpaint(node),backend=s.backend,branch=outpaintBranch(node),file=g.getNodeById(s.photo)?.widgets?.find(w=>w.name==='image')?.value;if(!hasEditImage(file))throw Error('Сначала загрузи исходное фото.');const size=await outpaintImageSize(file);if(g.getNodeById(s.photo)?.widgets?.find(w=>w.name==='image')?.value!==file||backend!==s.backend||JSON.stringify(readOutpaint(node))!==JSON.stringify(b))throw Error('Фото или настройки изменились. Повтори запуск дорисовки.');
 const working=outpaintWorkingSize(size.width,size.height,b.megapixels),borders=outpaintGeometry(working.width,working.height,b),pad=g.getNodeById(s.pad);for(const k of['left','right','top','bottom']){const w=pad?.widgets?.find(w=>w.name===k);if(!w)throw Error('Не найдена настройка холста.');w.value=borders[k];}
 for(const[id,key,label]of[[branch.model,'unet_name','модель'],[branch.clip,'clip_name','энкодер'],[branch.vae,'vae_name','VAE']]){const w=g.getNodeById(id)?.widgets?.find(w=>w.name===key),values=typeof w?.options?.values==='function'?w.options.values():w?.options?.values;if(!w?.value||Array.isArray(values)&&!values.includes(w.value))throw Error('Не найден '+label+'. Выбери файл в общих настройках.');}
 const targets=[s.before,s.result,s.maskPreview,...(s.save?[s.saver]:[])],modes=new Map(targets.map(id=>[id,g.getNodeById(id)?.mode]));if([...modes.values()].some(v=>v==null))throw Error('Не найдены выходы дорисовки.');let data;for(const id of targets)g.getNodeById(id).mode=0;try{data=await app.graphToPrompt();}finally{for(const[id,mode]of modes)g.getNodeById(id).mode=mode;}
 data=outpaintPrompt(data,targets,modes,s,borders);for(let i=0;i<Math.max(1,Math.min(64,Math.round(batch)));i++){const r=await queueWithMemory(api,0,data,{partialExecutionTargets:targets.map(String)});if(r?.prompt_id)queued.add(r.prompt_id);if(r?.node_errors&&Object.keys(r.node_errors).length)throw Error('Ошибка дорисовки: '+JSON.stringify(r.node_errors));}return true;
 }finally{building=false;}}
bindFactoryProgress(outpaintProgress,{plan:()=>{const n=owner();return n?outpaintPlan(n):null;},queued,contains:id=>{const n=owner();return !!n?.properties?.acf_outpaint?.nodes.map(String).includes(String(id));}});
