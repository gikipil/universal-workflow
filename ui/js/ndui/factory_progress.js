// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-13.
import {api} from '../../../scripts/api.js';
import {app} from '../../../scripts/app.js';
const clamp=v=>Math.max(0,Math.min(1,v));
export function factoryPlan(graph){
 const nodes=graph?._nodes||graph?.nodes||[],tag=t=>nodes.find(n=>n.properties?.nd_ui_src?.tag===t),value=(n,k)=>n?.widgets?.find(w=>w.name===k)?.value;
 if(!tag('k2module-mode'))return null;
 const generation=Number(value(tag('k2module-mode'),'index'))||0,refine=Number(value(tag('k2pass-switch'),'index'))||0,local=tag('local-controller'),spec=local?.properties?.acf_local,get=id=>graph.getNodeById(id);
 const first=tag(['k2module-ordinary','k2module-res','k2module-two'][generation]);
 const result=[{name:'1 · Генерация',sample:String(first.id),ids:new Set(nodes.filter(n=>n.id<75).map(n=>String(n.id))),finish:['69'],twoStage:generation===2&&Number(value(first,'handoff_percent'))>0&&Number(value(first,'handoff_percent'))<100}];
 if(refine){const n=tag(['','k2pass-ordinary_k','k2pass-res_k','k2pass-ordinary_z','k2pass-res_z'][refine]);result.push({name:'2 · Детализация',sample:String(n.id),ids:new Set(nodes.filter(n=>n.id>=75&&n.id<170).map(n=>String(n.id))),finish:[String([0,122,132,142,152][refine])]});}
 if(spec)for(const key of spec.order){const s=spec[key];if(!Number(value(get(s.gate),'index')))continue;result.push({name:'3 · '+({face:'Лицо',hands:'Руки',sam:'SAM · область',manual:'Ручная маска'}[key]),sample:String(s.detail),ids:new Set(Object.values(s).filter(Number.isInteger).map(String)),finish:[String(s.after)],local:true,detect:String(s.detect),sam:key==='sam'});}
 result.operations=new Map(nodes.map(n=>[String(n.id),({UNETLoader:'загрузка модели',CLIPLoader:'загрузка энкодера',VAELoader:'загрузка VAE',CheckpointLoaderSimple:'загрузка SAM',CLIPTextEncode:'обработка промта',VAEEncode:'кодирование изображения',VAEDecode:'сборка изображения','Power Lora Loader (rgthree)':'подключение LoRA',UltralyticsDetectorProvider:'загрузка YOLO',BboxDetectorSEGS:'поиск области',SAM3_Detect:'выделение SAM',MaskToSEGS:'подготовка маски',PreviewImage:'подготовка просмотра','Image Saver Simple':'сохранение'})[n.comfyClass||n.type]||'подготовка']));
 return result;
}
export class FactoryProgress {
 constructor(){this.reset();}
 reset(){this.active=false;this.complete=false;this.interrupted=false;this.error='';this.stopped=0;this.plan=[];this.current='';this.started=0;this.high=0;this.rows=new Map();}
 start(plan,now=Date.now()){this.reset();this.plan=plan||[];this.active=true;this.started=now;for(const e of this.plan)this.rows.set(e.sample,{fraction:0,value:0,max:0,phase:0,area:1,done:false});}
 index(id){return this.plan.findIndex(e=>e.ids.has(String(id)));}
 enter(id){if(id==null)return;this.current=String(id);}
 finish(id){id=String(id);for(const e of this.plan)if(e.sample===id||e.finish.includes(id)){const r=this.rows.get(e.sample);r.done=true;r.fraction=1;}}
 progress(id,value,max){
  if(!this.active)return;id=String(id??this.current);const e=this.plan.find(e=>e.sample===id);if(!e)return;
  value=Number(value);max=Number(max);if(!Number.isFinite(value)||!Number.isFinite(max)||max<=1)return;
  const r=this.rows.get(e.sample);if(r.done)return;
  // Detailer emits an outer 0/1 (or area count) in addition to diffusion steps.
  // Do not let that outer counter replace a larger, real sampling counter.
  if(r.max>max&&e.local)return;
  if(value<r.value&&r.value>=r.max&&r.max>1){if(e.twoStage)r.phase=Math.min(1,r.phase+1);else if(e.local)r.area++;}
  r.value=value;r.max=max;const part=clamp(value/max);
  r.fraction=Math.max(r.fraction,e.twoStage?(r.phase+part)/2:e.local?part*.9:part);this.current=id;
 }
 snapshot(now=Date.now()){
  const fractions=this.plan.map(e=>{const r=this.rows.get(e.sample);return r.done?1:r.fraction;});
  this.high=Math.max(this.high,this.plan.length?fractions.reduce((a,b)=>a+b,0)/this.plan.length:0);
  const pct=this.complete?1:Math.min(.99,this.high);let i=this.index(this.current);
  if(i<0)i=this.plan.findIndex(e=>!this.rows.get(e.sample).done);if(i<0||fractions.every(v=>v===1))i=this.plan.length-1;
  const e=this.plan[i],r=e&&this.rows.get(e.sample);let operation=this.plan.operations?.get(this.current)||'подготовка';
  if(e&&this.current===e.sample)operation=e.twoStage?(r.phase?'Turbo':'Raw'):r.max>1?'обработка':'подготовка';
  else if(e&&this.current===e.detect)operation=e.sam?'выделение маски':'поиск области';
  else if(e&&e.finish.includes(this.current))operation='сборка результата';
  let label=this.error?'Ошибка: '+this.error:this.active?'Выполняется · '+(e?.name||'Подготовка')+' · '+operation:this.complete?'Готово':this.interrupted?'Остановлено':'Простой';
  if(this.active&&this.plan.length&&fractions.every(v=>v===1))label='Выполняется · Завершение · '+operation;
  if(e?.local&&r.area>1&&this.current===e.sample)label+=' · участок '+r.area;
  const steps=this.active&&e&&this.current===e.sample&&r.max>1?`${r.value}/${r.max}`:'—';
  return{active:this.active,complete:this.complete,pct,label,steps,elapsed:this.started?Math.max(0,((this.stopped||now)-this.started)/1000):0,stage:i+1,total:this.plan.length};
 }
}
export const factoryProgress=new FactoryProgress();
const eventId=d=>d?.display_node_id??d?.display_node??d?.real_node_id??d?.node_id??d?.node;
api.addEventListener('execution_start',()=>factoryProgress.start(factoryPlan(app.graph)));
api.addEventListener('executing',e=>{const d=e.detail;const previous=factoryProgress.current;const id=d&&typeof d==='object'?eventId(d):d;if(previous&&String(id)!==previous)factoryProgress.finish(previous);factoryProgress.enter(id);});
api.addEventListener('execution_cached',e=>{for(const id of e.detail?.nodes||[])factoryProgress.finish(id);});
api.addEventListener('executed',e=>factoryProgress.finish(eventId(e.detail)));
api.addEventListener('progress',e=>{const d=e.detail||{};factoryProgress.progress(eventId(d),d.value,d.max);});
api.addEventListener('progress_state',e=>{for(const[k,n]of Object.entries(e.detail?.nodes||{})){const id=eventId(n)??k;if(n.state==='finished')factoryProgress.finish(id);else if(n.state==='running'){factoryProgress.enter(id);const row=factoryProgress.rows.get(String(id));if(!row?.max)factoryProgress.progress(id,n.value,n.max);}}});
api.addEventListener('execution_success',()=>{factoryProgress.complete=true;factoryProgress.active=false;factoryProgress.stopped=Date.now();});
api.addEventListener('execution_interrupted',()=>{factoryProgress.active=false;factoryProgress.complete=false;factoryProgress.interrupted=true;factoryProgress.stopped=Date.now();});
api.addEventListener('execution_error',e=>{factoryProgress.active=false;factoryProgress.stopped=Date.now();factoryProgress.error=e.detail?.exception_message||'Не удалось выполнить обработку';});
