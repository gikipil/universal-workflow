// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-18: isolated MiniMax H3 execution.
import {api} from '../../../scripts/api.js';
import {queueWithMemory} from './factory_memory.js';
import {app} from '../../../scripts/app.js';
import {readVideo} from './factory_video_params.js';
import {FactoryProgress,bindFactoryProgress} from './factory_progress.js';
// Video samplers share model-preparation nodes. Match an exact sampler first,
// rather than letting the first stage claim every node of the refiner.
export class VideoProgress extends FactoryProgress {
 start(plan,now=Date.now()){super.start(plan,now);for(const e of this.plan)if(Number.isInteger(e.stepCount)&&e.stepCount>0)this.rows.get(e.sample).max=e.stepCount;}
 index(id){const i=this.plan.findIndex(e=>e.sample===String(id));return i>=0?i:super.index(id);}
 progress(id,value,max){const e=this.plan.find(e=>e.sample===String(id??this.current));if(this.active&&e?.stepCount===1&&Number(max)===1){const r=this.rows.get(e.sample);if(!r.done&&Number.isFinite(Number(value))){r.value=Number(value);r.max=1;r.fraction=Math.max(r.fraction,Math.max(0,Math.min(1,r.value)));this.current=e.sample;}return;}super.progress(id,value,max);}
 snapshot(now=Date.now()){const state=super.snapshot(now),e=this.plan[state.stage-1],r=e&&this.rows.get(e.sample);if(this.active&&e?.sample===this.current&&r?.max>0){state.steps=`${r.value}/${r.max}`;if(e.selfLift&&r.value>0)state.label='Выполняется · Видео · '+(r.value<=e.transition?'первый этап':'высокое разрешение');if(r.value===0&&!r.done)state.label='Выполняется · '+e.name+' · подготовка / первый шаг';}return state;}
}
export const videoProgress=new VideoProgress();
export function videoPrompt(data,targets,modes,s,config){
 const output=structuredClone(data.output||{}),loader=output[s.media],enc=output[s.condition];
 // Head streaming slices packed Q4 rows as dense weights. The compatible
 // full-context path invokes each GGUF projection's own dequantization/LoRA.
 // Keep the normal INT8 path and the saved graph unchanged.
 if(config.gguf&&output[s.main]?.inputs.highres_tiling_mode==='global_stream'){
  output[s.main].inputs.highres_tiling_mode='global';
 }
 // Collapse only the model router before collecting this task's dependencies.
 // An inactive GGUF/INT8 loader is absent from the submitted execution graph.
 if(s.modelSwitch){
  const selected=String(config.gguf?s.gguf:s.model),router=String(s.modelSwitch);
  if(!output[selected])throw Error('Не найден загрузчик модели MiniMax.');
  for(const n of Object.values(output))for(const[k,v]of Object.entries(n.inputs||{}))if(Array.isArray(v)&&String(v[0])===router)n.inputs[k]=[selected,0];
  delete output[router];
 }

 if(!loader||!enc)throw Error('Не найден загрузчик референсов MiniMax.');
 let items;try{items=JSON.parse(loader.inputs.media_state||'[]');}catch{throw Error('Повреждён список референсов.');}
 if(!Array.isArray(items))throw Error('Повреждён список референсов.');
 const grouped={picture:[],video:[],audio:[]};
 for(const item of items){if(!grouped[item.kind]||typeof item.file!=='string'||!item.file.trim())throw Error('Проверь референсы видео.');if(item.enabled!==false)grouped[item.kind].push(item);}
 for(const[k,max]of[['picture',9],['video',3],['audio',3]])if(grouped[k].length>max)throw Error('Слишком много референсов.');
 for(const key of Object.keys(enc.inputs)){let m;if((m=/^ref_images\.ref_image_(\d+)$/.exec(key))&&Number(m[1])>=grouped.picture.length)delete enc.inputs[key];if((m=/^ref_videos\.ref_video_(\d+)$/.exec(key))&&Number(m[1])>=grouped.video.length)delete enc.inputs[key];if((m=/^ref_video_audios\.ref_video_audio_(\d+)$/.exec(key))&&!grouped.video[Number(m[1])]?.has_audio)delete enc.inputs[key];if((m=/^ref_audios\.ref_audio_(\d+)$/.exec(key))&&Number(m[1])>=grouped.audio.length)delete enc.inputs[key];}
 for(const[role,key,id]of[['first','first_frame',s.first],['last','last_frame',s.last]]){const item=s.mediaSlots?.[role]?.[0];delete enc.inputs[key];if(item?.file?.trim()){const load=output[id];if(!load)throw Error('Не найден загрузчик кадра MiniMax.');load.inputs.image=item.file;enc.inputs[key]=[String(id),0];}}
 const mainTurbo=output[s.mturbo],refTurbo=output[s.rturbo];if(!mainTurbo||!refTurbo)throw Error('Не найден Turbo-адаптер MiniMax.');
 if(mainTurbo.class_type==='LoraLoaderBypassModelOnly'){
  if(refTurbo.class_type!==mainTurbo.class_type)throw Error('Не найден Turbo-адаптер MiniMax.');
  refTurbo.inputs.lora_name=mainTurbo.inputs.lora_name;
  refTurbo.inputs.strength_model=mainTurbo.inputs.strength_model;
 }else for(const[k,v]of Object.entries(mainTurbo.inputs))if(/^lora_\d+$/.test(k))refTurbo.inputs[k]=structuredClone(v);
 const bypass=new Map([[String(s.gate),[String(config.refiner?s.ref:s.main),0]]]);
 if(s.upscale)bypass.set(String(s.upscale.gate),[String(config.upscale?s.upscale.sample:s.vdecode),0]);
 for(const n of Object.values(output))for(const[k,v]of Object.entries(n.inputs||{}))if(Array.isArray(v)&&bypass.has(String(v[0])))n.inputs[k]=bypass.get(String(v[0]));
 const keep=new Set();function visit(id){id=String(id);if(keep.has(id))return;const n=output[id];if(!n)throw Error('Не найден узел видео '+id);keep.add(id);for(const v of Object.values(n.inputs||{}))if(Array.isArray(v)&&v.length===2&&typeof v[1]==='number')visit(v[0]);}
 for(const id of targets)visit(id);const workflow=structuredClone(data.workflow);for(const n of workflow?.nodes||[])if(modes.has(n.id))n.mode=modes.get(n.id);
 return{...data,workflow,output:Object.fromEntries([...keep].map(id=>[id,output[id]]))};
}
const queued=new Set();let building=false;const owner=()=> (app.graph?._nodes||app.graph?.nodes||[]).find(n=>n.properties?.acf_video?.sigmaRefiner);
export function videoPlan(node){const s=node.properties.acf_video,c=readVideo(node),plan=[{name:'Видео · генерация MiniMax H3',sample:String(s.main),stepCount:c.steps+c.extraSteps,selfLift:true,transition:c.transition,ids:new Set(s.nodes.map(String)),finish:[String(c.refiner?s.ref:s.output)],runningLabel:'создание видео и звука'}];if(c.refiner)plan.push({name:'Видео · рефайнер',sample:String(s.ref),stepCount:c.refSteps,ids:new Set(s.nodes.map(String)),finish:[String(s.output)],runningLabel:'доработка видео'});if(c.upscale&&s.upscale)plan.push({name:'Видео · SeedVR',sample:String(s.upscale.sample),ids:new Set([s.upscale.sample,s.upscale.clean,s.upscale.dit,s.upscale.vae].map(String)),finish:[String(s.output)],multiProgress:true,runningLabel:'апскейл кадров'});plan.operations=new Map([[String(s.media),'загрузка референсов'],[String(s.condition),'кодирование промта и референсов'],[String(s.first),'загрузка первого кадра'],[String(s.last),'загрузка последнего кадра'],[String(s.vdecode),'декодирование видео'],[String(s.adecode),'декодирование звука'],[String(s.output),'подготовка результата']]);return plan;}
export async function queueVideo(node,batch=1){if(building)throw Error('Подожди отправки предыдущего задания.');building=true;try{const s=node.properties.acf_video,g=node.graph,c=readVideo(node);if(!String(g.getNodeById(s.prompt)?.widgets?.find(w=>w.name==='value')?.value||'').trim())throw Error('Напиши промт для видео.');for(const[id,key,label]of[[c.gguf?s.gguf:s.model,'unet_name',c.gguf?'модель MiniMax GGUF':'модель MiniMax'],[s.clip,'clip_name','энкодер MiniMax'],[s.vv,'vae_name','Video VAE'],[s.av,'vae_name','Audio VAE'],[s.main,'upscaler_model','MiniMax H3 · увеличение латента']]){const w=g.getNodeById(id)?.widgets?.find(w=>w.name===key),opts=typeof w?.options?.values==='function'?w.options.values():w?.options?.values;if(!w?.value||Array.isArray(opts)&&!opts.includes(w.value))throw Error('Не найден '+label+'. Выбери файл в общих настройках.');}const runtimeResponse=await api.fetchApi('/universal/video/runtime');if(!runtimeResponse.ok)throw Error('Обнови модуль Universal Video и перезапусти ComfyUI.');const runtime=await runtimeResponse.json();if(!runtime.ok)throw Error('Для видео нужны CUDA 13 и установленные модули генерации и обработки референсов.');const targets=[s.output],modes=new Map(targets.map(id=>[id,g.getNodeById(id)?.mode]));if([...modes.values()].some(v=>v==null))throw Error('Не найден вывод видео. Перезапусти ComfyUI после установки дополнения.');let data;for(const id of targets)g.getNodeById(id).mode=0;try{data=await app.graphToPrompt();}finally{for(const[id,mode]of modes)g.getNodeById(id).mode=mode;}data=videoPrompt(data,targets,modes,s,c);for(let i=0;i<Math.max(1,Math.min(64,Math.round(batch)));i++){const r=await queueWithMemory(api,0,data,{partialExecutionTargets:targets.map(String)});if(r?.prompt_id)queued.add(r.prompt_id);if(r?.node_errors&&Object.keys(r.node_errors).length)throw Error('Ошибка видео: '+JSON.stringify(r.node_errors));}return true;}finally{building=false;}}
bindFactoryProgress(videoProgress,{plan:()=>{const n=owner();return n?videoPlan(n):null;},queued,contains:id=>!!owner()?.properties?.acf_video?.nodes.map(String).includes(String(id))});
