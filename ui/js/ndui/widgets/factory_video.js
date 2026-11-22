import {fitFactoryContent} from './factory_content_height.js';
import {factorysize_v0213} from './factory_size_v0213.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-18: MiniMax H3 UI, no enhancer or live preview.
import {api} from '../../../../scripts/api.js';
import {el} from './util.js';
import {toggle} from './inputs.js';
import {generate} from './run.js';
import {factoryDialog,gearIcon} from './factory_dialog.js';
import {factoryprogress_v037} from './factory_progress.js';
import {modeFileSlots,mountModePresence} from './factory_mode_presence.js';
import {queueVideo,videoProgress} from '../factory_video_run.js';
import {VIDEO_LIMITS,videoMediaKind} from '../factory_video_params.js';
import {fileUrl,refFromName,readDrop,copyToInput} from '../media/io.js';
const surface='box-sizing:border-box;width:100%;padding:10px;border:1px solid #3d726c;border-radius:12px;background:linear-gradient(150deg,#192b2a,#191e28);display:flex;flex-direction:column;gap:10px';
const inputStyle='width:100%;height:var(--ndk-ctl,40px);box-sizing:border-box;padding:0 10px;background:#20252d;color:#e8eaf0;border:1px solid #39635b;border-radius:var(--ndk-rm,9px);font:inherit';
const labels={first:'🎞️ Первый кадр',last:'🎞️ Последний кадр',picture:'🖼️ Фото',video:'🎞️ Видео',audio:'🎵 Аудио'},mediaHeights={first:112,last:112,picture:112,video:128,audio:80};
let nextReferenceSlot=0;
export function videoReferenceId(kind,slots=[]){let id;do{id=kind+'_'+Date.now().toString(36)+'_'+(++nextReferenceSlot).toString(36);}while(slots.some(item=>item.id===id));return id;}
export const factoryvidrefs_v0180={type:'factoryvidrefs_v110',label:'Референсы видео',group:'Inputs',live:true,fill:true,noLabel:true,slots:[{id:'media',accepts:['STRING'],required:true},{id:'config',accepts:['STRING'],required:false}],props:[],size:{w:336,h:464,minW:270,minH:128},mount(ctx){
 const root=el('section'),content=el('div'),error=el('small');root.style.cssText=surface;content.style.cssText='display:flex;flex-direction:column;gap:10px';error.style.cssText='color:#ffa7b9;line-height:18px;overflow-wrap:anywhere';error.hidden=true;root.append(content,error);ctx.body.append(root);if(ctx.body.parentElement)ctx.body.parentElement.style.padding='0';let alive=true,stamp='';const tickets=new Map(),contentHeight=fitFactoryContent(ctx,root,{min:128});const read=()=>JSON.parse(ctx.get('media'));const write=v=>{ctx.set('media',JSON.stringify(v));show();};
 function fail(e){if(!alive)return;error.hidden=false;error.textContent=e.message||String(e);show();}
 async function upload(kind,id,file,ref=null){const token=Symbol();tickets.set(id,token);try{let item;if(file){const body=new FormData();body.append('file',file,file.name);const r=await api.fetchApi('/minimax_h3/upload',{method:'POST',body});item=await r.json();if(!r.ok)throw Error(item.error||'Не удалось загрузить файл.');if(item.kind!==videoMediaKind(kind))throw Error('Выбери '+labels[kind].slice(3).toLowerCase()+' для этого слота.');}else{const copied=await copyToInput(ref);item={file:[copied.subfolder,copied.name].filter(Boolean).join('/')+' ['+(copied.type||'input')+']',kind:videoMediaKind(kind)};if(videoMediaKind(kind)!=='picture'){const r=await api.fetchApi('/minimax_h3/probe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file:item.file})});if(!r.ok)throw Error('Не удалось прочитать медиафайл.');Object.assign(item,await r.json());}}
 if(!alive||tickets.get(id)!==token)return;const v=read(),i=v[kind].findIndex(i=>i.id===id);if(i<0)return;v[kind][i]={...item,id,kind:videoMediaKind(kind),enabled:true,...(kind==='video'?{audio_mode:'paired',...(item.duration>15?{trim:{start:0,end:15}}:{})}:{})};write(v);error.hidden=true;error.textContent='';show();}catch(e){fail(e);}finally{if(tickets.get(id)===token)tickets.delete(id);}}
 function show(){const v=read(),limits=VIDEO_LIMITS;const key=JSON.stringify(v);if(key!==stamp){stamp=key;content.replaceChildren();for(const[kind,max]of Object.entries(limits)){const section=el('section'),head=el('div'),title=el('strong','',labels[kind]+' · '+Math.min(max,v[kind].length)+'/'+max),plus=el('button','ndk-chip acf-fixed-control','+'),grid=el('div');section.style.cssText='display:flex;flex-direction:column;gap:6px';head.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;height:28px';title.style.cssText='color:#78e4cd;font-size:14px';plus.type='button';plus.setAttribute('aria-label','Добавить '+labels[kind]);plus.disabled=v[kind].length>=max;plus.style.cssText='height:28px;width:32px;font-size:22px;padding:0';plus.addEventListener('click',()=>{try{const data=read();if(data[kind].length>=max)return;data[kind].push({id:videoReferenceId(kind,Object.values(data).flat()),kind:videoMediaKind(kind),file:''});write(data);}catch(e){fail(e);}});head.append(title,plus);grid.style.cssText='display:grid;grid-template-columns:repeat('+Math.max(1,Math.min(2,v[kind].length))+',minmax(0,1fr));gap:8px';let ordinal=0;
 for(const [slotIndex,item] of v[kind].slice(0,max).entries()){if(item.file)ordinal++;const card=el('div'),bar=el('div'),name=el('small','',item.file?labels[kind]+' '+ordinal:'Пустой слот'),clear=el('button','ndk-chip','×'),picker=el('input'),preview=el('div');card.style.cssText='height:'+mediaHeights[kind]+'px;box-sizing:border-box;padding:8px;border:1px solid #365a53;border-radius:10px;background:#20252d;display:flex;flex-direction:column;gap:6px;min-width:0;cursor:pointer';bar.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:6px';name.style.cssText='min-width:0;font-size:11px;color:#a7c8bd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';clear.type='button';clear.style.cssText='height:24px;padding:0 6px;font-size:11px;flex:0 0 auto';clear.setAttribute('aria-label','Удалить слот '+kind);clear.addEventListener('click',e=>{e.stopPropagation();try{tickets.delete(item.id);const data=read();data[kind]=data[kind].filter(x=>x.id!==item.id);write(data);}catch(e){fail(e);}});bar.append(name,clear);picker.type='file';picker.accept=videoMediaKind(kind)==='picture'?'image/*':kind==='video'?'video/*':'audio/*';picker.hidden=true;picker.addEventListener('click',e=>e.stopPropagation());picker.addEventListener('change',()=>{const file=picker.files?.[0];if(file)upload(kind,item.id,file);picker.value='';});preview.style.cssText='flex:1;min-height:0;display:grid;place-items:center;overflow:hidden;color:#82948f;font-size:12px;text-align:center';if(item.file){const media=el(videoMediaKind(kind)==='picture'?'img':kind);media.src=fileUrl(refFromName(item.file));media.style.cssText='width:100%;height:100%;min-height:0;object-fit:contain';if(videoMediaKind(kind)!=='picture'){media.controls=true;media.preload='metadata';media.addEventListener('click',e=>e.stopPropagation());}else media.alt='Референс';preview.append(media);card.title=item.file;}else preview.append(el('span','','Выбрать или перетащить файл'));card.append(bar,preview,picker);card.tabIndex=0;card.setAttribute('role','group');card.setAttribute('aria-label',labels[kind]+' · референс');card.addEventListener('click',e=>{if(e.target!==picker)picker.click();});card.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();picker.click();}});card.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';});card.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();const items=readDrop(e.dataTransfer),one=items[0];if(one)upload(kind,item.id,one.kind==='file'?one.file:null,one.ref);});card.addEventListener('paste',e=>{const file=e.clipboardData?.files?.[0];if(file){e.preventDefault();upload(kind,item.id,file);}});grid.append(card);}
 section.append(head);if(v[kind].length)section.append(grid);content.append(section);}}
 const mediaHeight=Object.entries(limits).reduce((sum,[k,max])=>sum+Math.ceil(Math.min(max,v[k].length)/2)*(mediaHeights[k]+8),0);contentHeight.update(208+mediaHeight+(error.hidden?0:44));}show();return{update:show,destroy(){alive=false;contentHeight.destroy();tickets.clear();}};
}};
export const factoryvidsettings_v0180={
 type:'factoryvidsettings_v110',label:'Параметры видео',group:'Inputs',live:true,fill:true,noLabel:true,
 slots:[{id:'config',accepts:['STRING'],required:true},{id:'sampler',accepts:['COMBO'],required:true},{id:'scheduler',accepts:['COMBO'],required:true},...modeFileSlots('video')],props:[],
 size:{w:336,h:460,minW:270,minH:256},
 mount(ctx){
  const root=el('div'),error=el('small'),inputs=new Map();
  root.style.cssText='display:flex;flex-direction:column;gap:12px;width:100%;box-sizing:border-box';
  error.style.cssText='color:#ffa7b9;font-size:12px';error.hidden=true;
  ctx.body.append(root);if(ctx.body.parentElement)ctx.body.parentElement.style.padding='0';
  const contentHeight=fitFactoryContent(ctx,root,{min:96}),read=()=>{const v=JSON.parse(ctx.get('config'));return{...v,totalSteps:v.steps+v.extraSteps};};let dialog,distribution;
  function write(k,v){try{const data=read();delete data.totalSteps;if(k==='totalSteps')data.steps=v-data.extraSteps;else data[k]=v;ctx.set('config',JSON.stringify(data));error.hidden=true;}catch(e){error.hidden=false;error.textContent=e.message;}show();}
  function card(label,aria){
   const section=el('section'),head=el('div'),title=el('strong','',label),gear=el('button','ndk-chip acf-fixed-control');
   section.style.cssText=surface;head.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px';title.style.cssText='color:#78e4cd;font-size:16px';
   gear.type='button';gear.append(gearIcon());gear.setAttribute('aria-label',aria);gear.style.cssText='height:36px;width:36px;padding:0;display:grid;place-items:center;flex:0 0 36px';
   head.append(title,gear);section.append(head);root.append(section);return{section,head,title,gear};
  }
  function grid(host){const box=el('div');box.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px';host.append(box);return box;}
  function field(host,k,label,{min,max,step=1,options}={}){
   const box=el('label'),input=el(options?'select':'input','ndk-input acf-video-input');box.style.cssText='display:grid;gap:5px;color:#a4d3ba;font-size:12px;min-width:0';
   input.style.cssText=inputStyle+';min-width:0;color-scheme:dark';input.setAttribute('aria-label',label);
   if(options){for(const v of options){const o=el('option','',v);o.value=v;input.append(o);}}
   else{input.type='number';input.min=String(min);input.max=String(max);input.step=String(step);input.addEventListener('keydown',e=>e.stopPropagation());}
   input.addEventListener('change',()=>{if(input.value.trim())write(k,options?input.value:Number(input.value));else show();});
   box.append(el('span','',label),input);host.append(box);input.value=String(read()[k]);inputs.set(input,k);return input;
  }
  function openSettings(title,build){dialog?.close();dialog=factoryDialog(ctx,{title,width:600});dialog.body.style.cssText+=';display:flex;flex-direction:column;gap:12px';build(dialog.body);}
  function note(host,text){const n=el('small','',text);n.style.cssText='color:#a4adbf;line-height:1.5';host.append(n);return n;}
  const main=card('🎬 1 · Генерация видео','Дополнительные настройки видео'),fields=grid(main.section);
  field(fields,'fps','FPS',{min:1,max:120});field(fields,'seconds','Секунды',{min:1,max:15});
  field(fields,'sampler','Сэмплер',{options:['euler']});field(fields,'scheduler','Шедулер',{options:ctx.info('scheduler').options||[]});
  const turboBox=el('div'),turboLabel=el('label','','Сила Turbo-LoRA'),turboLine=el('div'),turboRange=el('input'),turboNumber=el('input','ndk-input acf-video-input');
  turboBox.style.cssText='display:grid;gap:6px;min-width:0';turboLabel.style.cssText='font-size:12px;color:#ff94c0';turboLine.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) 76px;align-items:center;gap:12px';
  turboRange.type='range';turboRange.style.cssText='width:100%;min-width:0;margin:0;accent-color:var(--acf-lora-a,#b84dff);cursor:pointer';turboNumber.type='number';turboNumber.style.cssText=inputStyle+';min-width:0;text-align:center';
  for(const input of[turboRange,turboNumber]){input.min='0';input.max='1.5';input.step='0.05';input.setAttribute('aria-label',input===turboRange?'Сила Turbo-LoRA':'Сила Turbo-LoRA · значение');inputs.set(input,'turboStrength');input.addEventListener('keydown',e=>e.stopPropagation());}
  turboRange.addEventListener('input',()=>write('turboStrength',Number(turboRange.value)));turboNumber.addEventListener('change',()=>{if(turboNumber.value.trim())write('turboStrength',Number(turboNumber.value));else show();});
  turboLabel.addEventListener('click',()=>turboRange.focus());turboLine.append(turboRange,turboNumber);turboBox.append(turboLabel,turboLine);main.section.append(turboBox);
  const sizeBody=el('div'),sizeHost=el('div'),sizeTitle=el('strong','','📐 Размер видео');sizeBody.style.cssText='display:flex;flex-direction:column;gap:8px';sizeTitle.style.cssText='color:#78e4cd;font-size:14px';sizeBody.append(sizeTitle,sizeHost);main.section.append(sizeBody);
  const sizeControl=factorysize_v0213.mount({...ctx,body:sizeHost,sizeOptions:{multiple:32,min:32,max:4096,noun:'видео',ratioTolerance:.04,megapixels:[.5,1,1.5,2,2.5,3],includeCurrentOption:false},get:k=>read()[k],set:(k,v)=>write(k,v),setSize:(width,height)=>{try{ctx.set('config',JSON.stringify({...read(),width,height}));error.hidden=true;}catch(e){error.hidden=false;error.textContent=e.message;}show();}});
  main.gear.addEventListener('click',()=>openSettings('Настройки генерации видео',host=>{
   const g=grid(host);
   const total=field(g,'totalSteps','Общее число шагов',{min:2+read().extraSteps,max:1000+read().extraSteps});total.parentElement.style.gridColumn='1 / -1';
   for(const[k,label,min,max,step]of[['transition','Шаги в низком разрешении',1,999,1],['lowScale','Масштаб первого этапа',.25,1,.05],['extraSteps','Дополнительные финальные шаги',0,32,1],['tau','Sol-Attention · порог',0,4,.05]])field(g,k,label,{min,max,step});
   distribution=note(host,'');
   note(host,'Общее число включает дополнительные финальные шаги. Остальные шаги после первого этапа выполняются в полном разрешении.');
   show();
  }));
  const ref=card('✨ 2 · Рефайнер','Настройки рефайнера'),refBody=el('div');ref.section.append(refBody);
  const refToggle=toggle.mount({...ctx,body:refBody,w:{...ctx.w,slots:{}},get:()=>read().refiner,set:(_,v)=>write('refiner',v),prop:k=>k==='text'?'Включить рефайнер':k==='description'?'Доработка видео после генерации. Исходный звук сохраняется.':ctx.prop(k)});
  ref.gear.addEventListener('click',()=>openSettings('Настройки рефайнера',host=>{
   const g=grid(host);
   field(g,'refSteps','Шаги рефайнера',{min:1,max:1000});field(g,'refTotal','Полное расписание рефайнера',{min:1,max:1000});
   field(g,'refSampler','Сэмплер',{options:ctx.info('sampler').options||['euler']});field(g,'refScheduler','Шедулер',{options:ctx.info('scheduler').options||[]});
   note(host,'Рефайнер выполняет последние выбранные шаги своего расписания. Больше шагов при том же расписании — сильнее перерисовка. Модель общая, LoRA рефайнера независимы.');
  }));
  const up=card('🔎 3 · Апскейл','Настройки апскейла видео'),upHead=el('div'),upFields=grid(up.section);up.section.append(upHead);up.section.append(upFields);
  const upToggle=toggle.mount({...ctx,body:upHead,w:{...ctx.w,slots:{}},get:()=>read().upscale,set:(_,v)=>write('upscale',v),prop:k=>k==='text'?'SeedVR':k==='description'?'В конце, после рефайнера. Звук и FPS сохраняются.':ctx.prop(k)});
  const upUnit=el('select','ndk-input acf-video-input'),upAmount=el('input','ndk-input acf-video-input');
  for(const[value,label]of[[0,'Множитель'],[1,'Длинная сторона, px']]){const o=el('option','',label);o.value=String(value);upUnit.append(o);}
  upFields.style.gridTemplateColumns='minmax(0,1fr) 92px';for(const input of[upUnit,upAmount])input.style.cssText=inputStyle+';min-width:0;color-scheme:dark';
  upUnit.setAttribute('aria-label','Размер апскейла видео');upAmount.setAttribute('aria-label','Значение размера апскейла видео');upAmount.type='number';upAmount.addEventListener('keydown',e=>e.stopPropagation());
  upUnit.addEventListener('change',()=>write('upSize',Number(upUnit.value)));upAmount.addEventListener('change',()=>write(read().upSize?'upLong':'upFactor',Number(upAmount.value)));
  upFields.append(upUnit,upAmount);const upHint=el('small','','Размер результата · пропорции сохраняются');upHint.style.cssText='grid-column:1 / -1;color:#a4bcb9;font-size:12px;line-height:18px';upFields.append(upHint);
  up.gear.addEventListener('click',()=>openSettings('Настройки апскейла видео',host=>{const g=grid(host);field(g,'upBatch','SeedVR · кадров в пакете',{min:1,max:16381,step:4});field(g,'upOverlap','SeedVR · перекрытие кадров',{min:0,max:16});}));
  const part=ctx.videoPart;for(const[key,card]of[['main',main],['ref',ref],['up',up]])if(part&&part!==key){card.section.hidden=true;card.section.style.display='none';}
  root.append(error);const presence=mountModePresence(ctx,main.title,'video');
  function show(){
   const v=read();if(distribution)distribution.textContent=(ctx.tr?.('Низкое разрешение')||'Низкое разрешение')+': '+v.transition+' · '+(ctx.tr?.('Полное разрешение')||'Полное разрешение')+': '+(v.totalSteps-v.transition)+' · '+(ctx.tr?.('Всего шагов')||'Всего шагов')+': '+v.totalSteps;for(const[input,k]of inputs)if(document.activeElement!==input)input.value=String(v[k]);
   sizeControl.update?.();refToggle.update?.();upToggle.update?.();upFields.hidden=!v.upscale;upFields.style.display=v.upscale?'grid':'none';upUnit.value=String(v.upSize);upAmount.min=v.upSize?'64':'1';upAmount.max=v.upSize?'16384':'4';upAmount.step=v.upSize?'64':'0.1';
   if(document.activeElement!==upAmount)upAmount.value=String(v.upSize?v.upLong:v.upFactor);presence.update();contentHeight.update((ctx.videoPart==='main'?360:ctx.videoPart==='ref'?112:ctx.videoPart==='up'?(v.upscale?208:112):550+(v.upscale?72:0))+(error.hidden?0:44));
  }
  show();return{update:show,resize:()=>contentHeight.update(),destroy(){dialog?.close();contentHeight.destroy();sizeControl.destroy?.();refToggle.destroy?.();upToggle.destroy?.();presence.destroy();}};
 }
};

export const factoryvidgeneration_v112={...factoryvidsettings_v0180,type:'factoryvidgen_v113',size:{w:336,h:360,minW:270,minH:96},mount:ctx=>factoryvidsettings_v0180.mount({...ctx,videoPart:'main'})};
export const factoryvidrefiner_v112={...factoryvidsettings_v0180,type:'factoryvidrefiner_v112',size:{w:336,h:112,minW:270,minH:96},mount:ctx=>factoryvidsettings_v0180.mount({...ctx,videoPart:'ref'})};
export const factoryvidupscale_v112={...factoryvidsettings_v0180,type:'factoryvidupscale_v112',size:{w:336,h:112,minW:270,minH:96},mount:ctx=>factoryvidsettings_v0180.mount({...ctx,videoPart:'up'})};
export const factoryvidprog_v0180={...factoryprogress_v037,type:'factoryvidprog_v110',mount:ctx=>factoryprogress_v037.mount({...ctx,progress:videoProgress})};
export const factoryvidrun_v0180={...generate,type:'factoryvidrun_v110',slots:[{id:'config',accepts:['STRING'],required:true}],mount(ctx){let dialog,alive=true;const inst=generate.mount({...ctx,queue:async batch=>{try{const state=ctx.info('config');await queueVideo(state.p?.node||state.node,batch);}catch(error){if(!alive)return;dialog?.close();dialog=factoryDialog(ctx,{title:'Видео',width:520});dialog.body.append(el('p','',error.message||String(error)));}}});return{...inst,destroy(){alive=false;dialog?.close();inst.destroy?.();}};}};

// Compatibility with v1.1.2 panels normalized to the Builder's 24-character limit.
export const factoryvidgeneration_compat={...factoryvidgeneration_v112,type:'factoryvidgeneration_v11'};
