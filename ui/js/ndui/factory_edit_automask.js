import {cloneJsonData} from './json_data.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {api} from '../../../scripts/api.js';
import {queueWithMemory} from './factory_memory.js';
import {app} from '../../../scripts/app.js';
import {hasEditImage} from './factory_edit_run.js';
let building=false;
export function maskOptions(value){
 const target=String(value.target||'').trim(),threshold=Number(value.threshold),iterations=Number(value.iterations);
 if(!target||target.length>500)throw Error('Напиши, что выделить, например clothing, hair или sofa.');
 if(!Number.isFinite(threshold)||threshold<0||threshold>1||!Number.isInteger(iterations)||iterations<0||iterations>5)throw Error('Проверь порог и число уточнений SAM.');
 return{target,threshold,iterations};
}
export function autoMaskPrompt(data,s,options,modes=new Map()){
 const o=maskOptions(options),a=s.autoMask,output=cloneJsonData(data.output||{});if(!a||!output[a.detect]||!output[a.text]||!output[a.preview])throw Error('В этом файле нет автомаски. Открой актуальную версию workflow.');
 Object.assign(output[a.detect].inputs,{threshold:o.threshold,refine_iterations:o.iterations,individual_masks:false});output[a.text].inputs.text=o.target;
 const keep=new Set();function visit(id){id=String(id);if(keep.has(id))return;const n=output[id];if(!n)throw Error('Не найден узел автомаски '+id);keep.add(id);for(const v of Object.values(n.inputs||{}))if(Array.isArray(v)&&v.length===2&&typeof v[1]==='number'&&Object.hasOwn(output,String(v[0])))visit(v[0]);}visit(a.preview);
 const workflow=cloneJsonData(data.workflow);for(const n of workflow?.nodes||[])if(modes.has(n.id))n.mode=modes.get(n.id);
 return{...data,workflow,output:Object.fromEntries([...keep].map(id=>[id,output[id]]))};
}
// SAM is a separate queue item. It never starts an editor, refiner, upscale or saver.
export async function queueEditAutoMask(node,options,{signal,onStatus=()=>{}}={}){
 if(building)throw Error('Подожди отправки предыдущей маски.');if(signal?.aborted)throw Error('Запрос маски отменён.');const o=maskOptions(options),s=node?.properties?.acf_edit,a=s?.autoMask,g=node?.graph;
 if(!a)throw Error('Открой workflow с поддержкой автомаски.');const image=g.getNodeById(s.photo)?.widgets?.find(w=>w.name==='image')?.value;if(!hasEditImage(image))throw Error('Сначала загрузи основной кадр.');
 const model=g.getNodeById(a.model)?.widgets?.find(w=>w.name==='ckpt_name'),values=typeof model?.options?.values==='function'?model.options.values():model?.options?.values;
 if(!model?.value||Array.isArray(values)&&!values.includes(model.value))throw Error('Не найдена модель SAM 3.1. Выбери её в общих настройках → SAM и YOLO.');
 const target=g.getNodeById(a.preview);if(!target)throw Error('Не найден выход автомаски.');const modes=new Map([[target.id,target.mode]]);let data;
 building=true;try{target.mode=0;try{data=await app.graphToPrompt();}finally{target.mode=modes.get(target.id);}data=autoMaskPrompt(data,s,o,modes);}finally{building=false;}
 if(signal?.aborted)throw Error('Запрос маски отменён.');
 return new Promise((resolve,reject)=>{
  let pid='',done=false,timer=null;const early=[],listeners=[];const finish=(error,ref)=>{if(done)return;done=true;clearTimeout(timer);for(const[name,fn]of listeners)api.removeEventListener(name,fn);signal?.removeEventListener('abort',abort);error?reject(error):resolve(ref);};
  const abort=()=>finish(Error('Окно маски закрыто. Результат задания не будет применён.'));signal?.addEventListener('abort',abort,{once:true});
  const pick=output=>output?.images?.find(r=>r&&typeof r.filename==='string'&&r.filename);
  async function cached(){for(const delay of[0,150,400,800]){if(done)return;if(delay)await new Promise(r=>setTimeout(r,delay));if(done)return;try{const response=await api.fetchApi('/history/'+encodeURIComponent(pid));if(!response.ok)continue;const h=await response.json(),ref=pick(h[pid]?.outputs?.[String(a.preview)]);if(ref){finish(null,ref);return;}}catch{}}if(!done)finish(Error('SAM завершился, но маска не получена. Повтори выделение.'));}
  function handle(name,d){if(done)return;if(!pid){if(early.length<64)early.push([name,d]);return;}if(String(d?.prompt_id||'')!==pid)return;
   if(name==='execution_start'){onStatus('Загрузка SAM и выделение области…');clearTimeout(timer);timer=setTimeout(()=>finish(Error('Не удалось дождаться SAM. Проверь очередь и ошибки ComfyUI.')),15*60*1000);}
   if(name==='executing'&&String(d.node??d.node_id)===String(a.detect))onStatus('Выделение области SAM 3.1…');
   if(name==='executed'&&String(d.node??d.node_id)===String(a.preview)){const ref=pick(d.output);if(ref)finish(null,ref);}
   if(name==='execution_error')finish(Error(d.exception_message||'Ошибка SAM 3.1.'));
   if(name==='execution_interrupted')finish(Error('Выделение маски остановлено.'));
   if(name==='execution_success')cached();
  }
  for(const name of['execution_start','executing','executed','execution_error','execution_interrupted','execution_success']){const fn=e=>handle(name,e.detail);listeners.push([name,fn]);api.addEventListener(name,fn);}
  onStatus('Маска в очереди…');queueWithMemory(api,0,data,{partialExecutionTargets:[String(a.preview)]}).then(result=>{if(result?.node_errors&&Object.keys(result.node_errors).length)throw Error('Ошибка автомаски: '+JSON.stringify(result.node_errors));if(!result?.prompt_id)throw Error('ComfyUI не принял задание маски.');pid=String(result.prompt_id);if(done)return;timer=setTimeout(()=>finish(Error('Маска слишком долго ожидает в очереди. Проверь очередь ComfyUI.')),60*60*1000);for(const[name,d]of early)handle(name,d);early.length=0;}).catch(error=>finish(error));
 });
}
