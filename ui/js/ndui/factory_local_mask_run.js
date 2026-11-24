import {cloneJsonData} from './json_data.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow, gikipil 2026: detector-only mask previews.
import {api} from '../../../scripts/api.js';
import {app} from '../../../scripts/app.js';
import {queueWithMemory} from './factory_memory.js';
const allowed=new Set(['LoadImage','UltralyticsDetectorProvider','BboxDetectorSEGS','SAM3_Detect','CheckpointLoaderSimple','CLIPTextEncode','PrimitiveStringMultiline','PrimitiveString','PrimitiveFloat','PrimitiveInt','MaskToImage','SegsToCombinedMask','PreviewImage']);
export function localMaskPrompt(data,s,key,ref){
 if(!['face','hands','sam'].includes(key)||!s?.[key])throw Error('Не найден выбранный режим.');
 if(!ref?.filename||!['input','temp','output'].includes(ref.type||'output'))throw Error('Сначала получи кадр для просмотра маски.');
 const output=cloneJsonData(data.output||{}),mode=s[key],detect=output[mode.detect];
 if(!detect||detect.class_type!==(key==='sam'?'SAM3_Detect':'BboxDetectorSEGS'))throw Error('Не найден детектор маски.');
 if(key==='sam'&&typeof output[mode.target]?.inputs?.text==='string'&&!output[mode.target].inputs.text.trim())throw Error('Напиши, что выделить, например clothing, hair или sofa.');
 const image='uw_mask_source',combined='uw_mask_combined',rgb='uw_mask_rgb',preview='uw_mask_preview';
 for(const id of[image,combined,rgb,preview])if(Object.hasOwn(output,id))throw Error('Повторяющийся идентификатор маски.');
 const filename=[ref.subfolder,ref.filename].filter(Boolean).join('/')+' ['+(ref.type||'output')+']';
 output[image]={class_type:'LoadImage',inputs:{image:filename}};detect.inputs.image=[image,0];
 let mask=[String(mode.detect),0];
 if(key!=='sam'){output[combined]={class_type:'SegsToCombinedMask',inputs:{segs:mask}};mask=[combined,0];}
 output[rgb]={class_type:'MaskToImage',inputs:{mask}};output[preview]={class_type:'PreviewImage',inputs:{images:[rgb,0]}};
 const keep=new Set(),active=new Set();function visit(id){id=String(id);if(active.has(id))throw Error('Зацикленная цепочка маски.');if(keep.has(id))return;const n=output[id];if(!n||!allowed.has(n.class_type))throw Error('Просмотр маски не должен запускать обработку изображения.');active.add(id);for(const v of Object.values(n.inputs||{}))if(Array.isArray(v)&&v.length===2&&typeof v[1]==='number')visit(v[0]);active.delete(id);keep.add(id);}visit(preview);
 return{target:preview,detect:String(mode.detect),data:{output:Object.fromEntries([...keep].map(id=>[id,output[id]])),workflow:{nodes:[],links:[],groups:[],extra:{},widget_idx_map:{}}}};
}
export async function queueLocalMask(node,key,ref,{signal,onStatus=()=>{}}={}){
 if(signal?.aborted)throw Error('Просмотр маски закрыт.');
 const job=localMaskPrompt(await app.graphToPrompt(),node.properties.acf_local,key,ref);
 if(signal?.aborted)throw Error('Просмотр маски закрыт.');
 return new Promise((resolve,reject)=>{
  let pid='',done=false,timer;const early=[],listeners=[];
  const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);for(const[name,fn]of listeners)api.removeEventListener(name,fn);signal?.removeEventListener('abort',abort);error?reject(error):resolve(result);};
  const abort=()=>finish(Error('Просмотр маски закрыт.'));signal?.addEventListener('abort',abort,{once:true});
  const pick=o=>o?.images?.find(r=>r&&typeof r.filename==='string'&&r.filename);
  async function cached(){for(const delay of[0,150,400,800]){if(done)return;if(delay)await new Promise(resolve=>setTimeout(resolve,delay));if(done)return;try{const response=await api.fetchApi('/history/'+encodeURIComponent(pid));if(response.ok){const h=await response.json(),ref=pick(h[pid]?.outputs?.[job.target]);if(ref){finish(null,ref);return;}}}catch{}}if(!done)finish(Error('Не удалось получить маску. Проверь очередь ComfyUI.'));}
  function handle(name,d){if(done)return;if(!pid){if(early.length<64)early.push([name,d]);return;}if(String(d?.prompt_id||'')!==pid)return;
   if(name==='execution_start'){onStatus('Подготовка выделения…');clearTimeout(timer);timer=setTimeout(()=>finish(Error('Не удалось получить маску. Проверь очередь ComfyUI.')),15*60*1000);}
   if(name==='executed'&&String(d.node??d.node_id)===job.target){const ref=pick(d.output);if(ref)finish(null,ref);}
   if(name==='execution_error')finish(Error(d.exception_message||'Не удалось получить маску. Проверь очередь ComfyUI.'));
   if(name==='execution_interrupted')finish(Error('Выделение маски остановлено.'));
   if(name==='execution_success')cached();
  }
  for(const name of['execution_start','executed','execution_error','execution_interrupted','execution_success']){const fn=e=>handle(name,e.detail);listeners.push([name,fn]);api.addEventListener(name,fn);}
  onStatus('Маска в очереди…');queueWithMemory(api,0,job.data,{partialExecutionTargets:[job.target]}).then(result=>{if(result?.node_errors&&Object.keys(result.node_errors).length)throw Error(JSON.stringify(result.node_errors));if(!result?.prompt_id)throw Error('Не удалось получить маску. Проверь очередь ComfyUI.');pid=String(result.prompt_id);if(done)return;timer=setTimeout(()=>finish(Error('Не удалось получить маску. Проверь очередь ComfyUI.')),60*60*1000);for(const[name,d]of early)handle(name,d);early.length=0;}).catch(error=>finish(error));
 });
}
