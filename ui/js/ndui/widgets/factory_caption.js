// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-15.
import {el} from './util.js';
import {factoryDialog,gearIcon} from './factory_dialog.js';
import {generate} from './run.js';
import {toggle} from './inputs.js';
import {factoryphoto_v060} from './factory_background.js';
import {captionState,queueCaption,scanCaptions,saveCaption} from '../factory_caption.js';
export const captionInstructionPresets=[
  {
    "id": "lora",
    "label": "Caption для LoRA",
    "text": "Write a concise, factual English caption for this LoRA training image.\n\nDescribe only:\n\n- clothing or nudity state\n- pose and body orientation\n- facial expression\n- framing / crop\n- camera angle or viewpoint\n- lighting\n- background / environment\n\nDo not describe permanent identity traits such as body shape, breast size or shape, skin tone, facial structure, hair color, eye color, age, ethnicity, tattoos, scars, or other stable physical characteristics unless they are clearly temporary or scene-specific.\n\nDo not identify the person.\nDo not infer hidden anatomy.\nDo not invent details.\nDo not use aesthetic judgments such as beautiful, attractive, sexy, perfect, rough, smooth, or ideal.\nDo not describe image quality unless it is directly relevant to the scene.\n\nKeep the caption short and literal.\nUse simple natural English.\nReturn only one caption, with no explanation, labels, or formatting."
  },
  {
    "id": "simple",
    "label": "Простое описание",
    "text": "Describe the main visible subject, action and setting in one short, plain English sentence. Mention only the most important elements. Describe only what is visibly supported by the image. Do not identify the person, invent details, infer hidden features, or add aesthetic judgments. Return only the English description, without explanations, labels or formatting."
  },
  {
    "id": "standard",
    "label": "Обычное описание",
    "text": "Write a factual English description of the image in one compact paragraph. Describe the subject, visible appearance and clothing, pose, expression, framing, camera viewpoint, lighting and environment. Balance useful detail with brevity; avoid an exhaustive inventory. Describe only what is visibly supported by the image. Do not identify the person, invent details, infer hidden features, or add aesthetic judgments. Return only the English description, without explanations, labels or formatting."
  },
  {
    "id": "detailed",
    "label": "Максимально подробное описание",
    "text": "Write a thorough, factual English description of the visible image. Cover the main subject and visible appearance, clothing, pose and body orientation, hand placement, facial expression and gaze, framing, viewpoint and perspective, foreground, background, object positions, lighting direction and softness, shadows, colors, materials and visible textures. Distinguish observable details from uncertainty; omit anything that cannot be established visually. Use coherent paragraphs without repeating information. Describe only what is visibly supported by the image. Do not identify the person, invent details, infer hidden features, or add aesthetic judgments. Return only the English description, without explanations, labels or formatting."
  },
  {
    "id": "clothing",
    "label": "Только одежда",
    "text": "Describe only the visible clothing, footwear and accessories in English. Specify garment types, colors, patterns, materials when visually supported, cut, fit, length, layering, fastenings and visible fabric details. If relevant, state which areas are uncovered, neutrally and briefly. Do not describe the person's identity, body shape, pose, facial expression, background or lighting. Describe only what is visibly supported by the image. Do not identify the person, invent details, infer hidden features, or add aesthetic judgments. Return only the English description, without explanations, labels or formatting."
  },
  {
    "id": "pose",
    "label": "Только поза",
    "text": "Describe only the visible pose and body orientation in precise English. Include sitting, standing or lying position, torso rotation and lean, head direction, arm and leg placement, hand positions, contact with surfaces and gaze direction when visible. Distinguish the subject's left and right only when unambiguous; otherwise use image-left and image-right. Do not describe appearance, clothing, environment or lighting, except a support surface needed to explain the pose. Describe only what is visibly supported by the image. Do not identify the person, invent details, infer hidden features, or add aesthetic judgments. Return only the English description, without explanations, labels or formatting."
  },
  {
    "id": "emotion",
    "label": "Только эмоция и мимика",
    "text": "Describe only the visible facial expression and expressive cues in English: mouth position, eyebrows, eyes, gaze and head tilt. State an apparent emotion cautiously only if these visible cues support it. Do not claim to know internal feelings, intentions or personality. Do not describe clothing, identity, setting or lighting. Describe only what is visibly supported by the image. Do not identify the person, invent details, infer hidden features, or add aesthetic judgments. Return only the English description, without explanations, labels or formatting."
  },
  {
    "id": "appearance",
    "label": "Только внешность",
    "text": "Describe only the subject's visible physical appearance in factual English: hair color, length and style, visible facial features, eye color only if discernible, skin tone, overall build and clearly visible distinctive marks. Do not identify the person or infer ethnicity, exact age, hidden anatomy or details obscured by clothing. Do not describe clothing, pose, emotions, background or lighting. Describe only what is visibly supported by the image. Do not identify the person, invent details, infer hidden features, or add aesthetic judgments. Return only the English description, without explanations, labels or formatting."
  },
  {
    "id": "recreate",
    "label": "Промт для воссоздания кадра",
    "text": "Write one English image-generation prompt that recreates the visible photograph. Describe the subject, clothing, pose, expression, composition, crop, camera viewpoint, environment, lighting, colors and visible materials. Use concrete visual descriptions. Do not identify the person, invent hidden details, add objects or actions, or use quality tags and promotional adjectives. Return only the prompt, with no explanation or formatting."
  }
];
const instructionPreset=text=>captionInstructionPresets.find(p=>p.text===text)?.id||'';
const slots=[{id:'config',accepts:['STRING'],required:true}];
const owner=ctx=>{const b=ctx.info('config');return b.p?.node||b.node;};
const readConfig=(ctx,slot='config')=>{const raw=ctx.get(slot);if(typeof raw!=='string'||!raw.trim())return null;try{const v=JSON.parse(raw);return v&&typeof v==='object'&&v.models?v:null;}catch{return null;}};
const missingConfig='Модуль подписей не подключён. После перезапуска ComfyUI открой актуальный JSON workflow и обнови страницу.';
const control=(ctx)=>({read:()=>readConfig(ctx),write:v=>ctx.set('config',JSON.stringify(v))});
const button=text=>{const b=el('button','ndk-chip',text);b.type='button';return b;};
function field(body,label,value,save,{options,number=false,area=false,min,max,step}={}){
 const box=el('label'),caption=el('small','',label),input=el(area?'textarea':options?'select':'input','ndk-input');box.style.cssText='display:grid;gap:6px;min-width:0';caption.style.color='#9ce5cb';input.style.cssText='width:100%;min-width:0;box-sizing:border-box;background:#20252d;color:#e8eaf0;border:1px solid #39635b;border-radius:9px;padding:10px;font:inherit;color-scheme:dark';
 if(options)for(const v of options){const o=el('option','',Array.isArray(v)?v[1]:v);o.value=Array.isArray(v)?v[0]:v;input.append(o);}else if(area){input.rows=5;input.style.resize='vertical';}else{input.type=number?'number':'text';if(min!=null)input.min=min;if(max!=null)input.max=max;if(step!=null)input.step=step;}
 input.value=String(value??'');input.addEventListener('keydown',e=>e.stopPropagation());input.addEventListener('change',()=>save(number?Number(input.value):input.value));box.append(caption,input);body.append(box);return input;
}
function switchField(ctx,body,label,get,set){const box=el('div');body.append(box);return toggle.mount({...ctx,body:box,w:{...ctx.w,props:{label}},get,set:(_,v)=>set(v),prop:k=>k==='text'||k==='label'?label:k==='description'?'':ctx.prop(k)});}
export function captionModelFields(ctx,body,slot='caption_config'){
 const read=()=>readConfig(ctx,slot),write=v=>ctx.set(slot,JSON.stringify(v));
 if(!read()){body.append(el('small','',missingConfig));return;}
 for(const [key,label,options]of [['florence','Florence · модель',['MiaoshouAI/Florence-2-large-PromptGen-v2.0','microsoft/Florence-2-large','microsoft/Florence-2-base']],['qwen','Qwen · модель',['Qwen3-VL-2B-Instruct','Qwen3-VL-4B-Instruct','Qwen3-VL-8B-Instruct','Qwen2.5-VL-7B-Instruct']],['joy','JoyCaption · Hugging Face ID или локальная папка',null]])field(body,label,read().models[key],x=>{const v=read();v.models[key]=x;write(v);},{options});
 body.append(el('small','','Модели локальные. При первом запуске недостающие веса скачиваются автоматически. JoyCaption — отдельная модель, энкодер Krea его не заменяет.'));
}

export const factorycapsource_v0163={type:'factorycapsource_v0163',label:'Источник изображений',icon:'image',group:'Inputs',live:true,noLabel:true,fill:true,slots:[...slots,{id:'image',accepts:['COMBO','STRING'],required:false}],props:[],size:{w:336,h:180,minW:280,minH:180},mount(ctx){
 const root=el('section'),row=el('div'),single=button('📷 Одно фото'),folder=button('📂 Папка'),photo=el('div'),path=el('div'),error=el('small');
 root.style.cssText='display:flex;flex-direction:column;gap:12px;padding:12px;width:100%;box-sizing:border-box;border:1px solid #3d726c;border-radius:12px;background:linear-gradient(150deg,#192b2a,#191e28)';row.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px';photo.style.cssText='height:260px;min-height:0';path.style.cssText='display:grid;gap:8px';error.style.color='#ffa7b9';root.append(el('strong','','Источник изображений'),row,photo,path,error);row.append(single,folder);ctx.body.append(root);
 const {read,write}=control(ctx);let picker=null;
 const input=field(path,'Папка на ПК с ComfyUI','',value=>{const v=read();if(v){v.folder=value;write(v);}});input.placeholder='C:/dataset';path.append(el('small','','Будут обработаны изображения этой папки без подпапок.'));
 function choose(source){const v=read();if(!v)return;v.source=source;write(v);update();}
 single.addEventListener('click',()=>choose('single'));folder.addEventListener('click',()=>choose('folder'));
 function update(){const v=read(),one=v?.source!=='folder';single.disabled=folder.disabled=!v;error.textContent=v?'':missingConfig;photo.style.display=one&&v?'flex':'none';path.style.display=!one&&v?'grid':'none';
 for(const[b,on]of[[single,one],[folder,!one]]){b.setAttribute('aria-pressed',String(on));b.style.cssText='height:42px;min-width:0;font:inherit;font-weight:600;border-radius:9px;border:1px solid '+(on?'#59e68d':'#39635b')+';background:'+(on?'#24513e':'#20252d')+';color:'+(on?'#a9f4c6':'#c5d0d5');}
 if(v&&one&&!picker)picker=factoryphoto_v060.mount({...ctx,body:photo,size:()=>({w:(ctx.size?.().w||336)-24,h:260}),prop:k=>k==='label'?'':ctx.prop(k)});if(one)picker?.update?.();if(v&&document.activeElement!==input)input.value=v.folder||'';ctx.setContentHeight?.(one?380:200);}
 update();return{update,destroy(){picker?.destroy?.();}};
}};

export const factorycaption_v0160={type:'factorycaption_v0160',label:'Caption · настройки',icon:'text',group:'Inputs',live:true,noLabel:true,fill:true,slots,size:{w:336,h:664,minW:280,minH:500},props:[],mount(ctx){
 const root=el('section'),top=el('div'),title=el('strong','','📝 Промты'),gear=button(''),inputs=el('div'),error=el('small');root.style.cssText='display:flex;flex-direction:column;gap:12px;padding:12px;border:1px solid #3d726c;border-radius:12px;background:linear-gradient(150deg,#192b2a,#191e28);box-sizing:border-box;width:100%';top.style.cssText='display:flex;align-items:center;justify-content:space-between';title.style.cssText='color:#78e4cd;font-size:17px';gear.append(gearIcon());gear.setAttribute('aria-label','Настройки captioning');top.append(title,gear);root.append(top,inputs,error);ctx.body.append(root);inputs.style.cssText='display:flex;flex-direction:column;gap:12px';error.style.color='#ffa7b9';let stamp='',dialog;const toggles=[];
 const {read,write}=control(ctx),patch=(k,x)=>{const v=read();v[k]=x;write(v);};
 gear.addEventListener('click',()=>{dialog?.close();dialog=factoryDialog(ctx,{title:'Caption · параметры',width:650});dialog.body.style.cssText='display:flex;flex-direction:column;gap:14px';field(dialog.body,'Максимум токенов',read().max_tokens,x=>patch('max_tokens',x),{number:true,min:32,max:2048,step:32});field(dialog.body,'Точность Qwen / JoyCaption',read().quantization,x=>patch('quantization',x),{options:['8-bit (Balanced)','4-bit (VRAM-friendly)','None (FP16)']});field(dialog.body,'Задача Florence',read().florence_task,x=>patch('florence_task',x),{options:['caption','detailed_caption','more_detailed_caption']});dialog.body.append(el('small','','Свободная инструкция применяется к Qwen и JoyCaption. Florence использует выбранную задачу. Файлы моделей выбираются в общих настройках сверху.'));});
 function update(){const v=read();gear.disabled=!v;if(!v){stamp='';for(const t of toggles)t.destroy?.();toggles.length=0;inputs.replaceChildren();error.textContent=missingConfig;ctx.setContentHeight?.(Math.max(650,root.scrollHeight||0));return;}if(error.textContent===missingConfig)error.textContent='';const next=JSON.stringify([v.engine,v.source]);if(next!==stamp){stamp=next;for(const t of toggles)t.destroy?.();toggles.length=0;inputs.replaceChildren();field(inputs,'Способ описания',v.engine,x=>{patch('engine',x);update();},{options:[['florence','Florence'],['qwen','Qwen'],['joy','JoyCaption']]}); field(inputs,'Trigger word · необязательно',v.trigger,x=>patch('trigger',x));
 let instruction;
 const preset=field(inputs,'Готовая инструкция',instructionPreset(v.instruction),id=>{const selected=captionInstructionPresets.find(p=>p.id===id);if(selected){patch('instruction',selected.text);instruction.value=selected.text;}},{options:[['','Выбрать инструкцию…'],...captionInstructionPresets.map(p=>[p.id,p.label])]});preset.children[0].disabled=true;preset.disabled=v.engine==='florence';
 instruction=field(inputs,'Инструкция описания',v.instruction,x=>{patch('instruction',x);preset.value=instructionPreset(x);},{area:true});instruction.disabled=v.engine==='florence';
 instruction.addEventListener('input',()=>{patch('instruction',instruction.value);preset.value=instructionPreset(instruction.value);});
 const clear=button('Очистить');clear.setAttribute('aria-label','Очистить инструкцию');clear.style.cssText='justify-self:end;font:inherit';clear.disabled=v.engine==='florence';const instructionLabel=instruction.parentElement,heading=instructionLabel.children[0],instructionBar=el('div');instructionBar.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px';instructionBar.append(heading,clear);instructionLabel.replaceChildren(instructionBar,instruction);
 clear.addEventListener('click',()=>{patch('instruction','');instruction.value='';preset.value='';instruction.focus();});

 toggles.push(switchField(ctx,inputs,'Сохранять .txt автоматически',()=>read().save_txt,x=>patch('save_txt',x)),switchField(ctx,inputs,'Пропускать существующие .txt',()=>read().skip_existing,x=>patch('skip_existing',x)));
 const scan=button('📂 Открыть фото и подписи');scan.addEventListener('click',async()=>{try{await scanCaptions(owner(ctx));error.textContent='';}catch(e){error.textContent=e.message;}});inputs.append(scan,el('small','','Обрабатывается текущая папка без подпапок. Фото не изменяются. Подписи сохраняются рядом, с тем же именем. Для одиночного загруженного фото — рядом с копией в input ComfyUI.'));}
 for(const t of toggles)t.update?.();ctx.setContentHeight?.(Math.max(650,root.scrollHeight||0));}
 update();return{update,destroy(){for(const t of toggles)t.destroy?.();dialog?.close();}};
}};
export const factorycapresult_v0160={type:'factorycapresult_v0160',label:'Промты · фото и подписи',icon:'image',group:'Results',live:true,noLabel:true,fill:true,slots:[{id:'config',accepts:['STRING'],required:false},{id:'result',data:'text',required:false}],props:[],size:{w:792,h:950,minW:350,minH:400},mount(ctx){
 const root=el('div'),select=el('select','ndk-input'),stage=el('div'),image=el('img'),text=el('textarea','ndk-input'),status=el('small'),bar=el('div'),save=button('💾 Сохранить подпись'),saveAll=button('💾 Сохранить все'),hint=el('div','','Загрузи фото или укажи папку. Нажми «Открыть фото и подписи» либо запусти captioning.');root.style.cssText='display:grid;grid-template-rows:42px minmax(0,1fr) minmax(90px,180px) 22px 40px;gap:12px;height:100%;width:100%;min-height:0;overflow:hidden;padding:12px;box-sizing:border-box;border:1px solid #287e91;border-radius:12px;background:#181c23';stage.style.cssText='display:grid;place-items:center;min-height:0;overflow:hidden;background:#20252d;border-radius:10px';hint.style.cssText='padding:24px;text-align:center;color:#a4adbf;max-width:420px;line-height:1.5';stage.append(image,hint);image.style.cssText='width:100%;height:100%;min-height:0;object-fit:contain;background:#20252d;border-radius:10px';text.style.cssText='width:100%;height:100%;min-height:0;resize:none;box-sizing:border-box;background:#20252d;color:#e8eaf0;border:1px solid #39635b;border-radius:10px;padding:12px;font:inherit';text.placeholder='Подпись изображения';select.style.cssText='width:100%;background:#20252d;color:#e8eaf0;border:1px solid #39635b;border-radius:9px;color-scheme:dark';bar.style.cssText='display:flex;gap:10px';bar.append(save,saveAll);root.append(select,stage,text,status,bar);ctx.body.append(root);let stamp='',selection=-1;
 const row=()=>captionState.rows[captionState.selected];select.addEventListener('change',()=>{captionState.selected=Number(select.value);selection=-1;update();});text.addEventListener('keydown',e=>e.stopPropagation());text.addEventListener('input',()=>{if(row()){row().caption=text.value;row().status='edited';}});
 save.addEventListener('click',async()=>{try{if(row())await saveCaption(row());update();}catch(e){status.textContent=e.message;}});
 saveAll.addEventListener('click',async()=>{saveAll.disabled=true;try{for(const r of captionState.rows)if(r.caption.trim())await saveCaption(r);update();}catch(e){status.textContent=e.message;}finally{saveAll.disabled=false;}});
 function update(){const state=captionState,key=state.session+'|'+state.rows.map(r=>r.name).join('|');if(key!==stamp){stamp=key;select.replaceChildren();for(const [i,r]of state.rows.entries()){const o=el('option','',r.name);o.value=String(i);select.append(o);}selection=-1;}const r=row();select.value=String(state.selected);if(r&&selection!==state.selected){selection=state.selected;image.src=r.image;text.value=r.caption;}image.hidden=!r;hint.hidden=!!r;select.disabled=!state.rows.length;if(!r){text.value='';if(!select.children.length){const empty=el('option','','Нет выбранных фото');empty.value='0';select.append(empty);}}text.disabled=!r||state.running;save.disabled=!r||state.running;saveAll.disabled=!state.rows.length||state.running;status.textContent=state.error||(!r?'Нет выбранных фото':r.status==='saved'?'Подпись сохранена':r.status==='skipped'?'Существующая подпись · пропущена':r.status==='existing'?'Существующая подпись':r.status==='edited'?'Есть несохранённые изменения':r.status==='generated'?'Подпись готова · не сохранена':'Ожидает описания');if(r&&document.activeElement!==text&&text.value!==r.caption)text.value=r.caption;}
 update();return{update};
}};
export const factorycaprun_v0160={...generate,type:'factorycaprun_v0160',slots,mount(ctx){let d;const inst=generate.mount({...ctx,queue:async()=>{try{await queueCaption(owner(ctx));}catch(e){d?.close();d=factoryDialog(ctx,{title:'Промты',width:600});d.body.append(el('p','',e.message));}}});return{...inst,destroy(){inst.destroy?.();d?.close();}};}};
export const factorycapprog_v0160={type:'factorycapprog_v0160',label:'Caption · статус',icon:'text',group:'Results',live:true,noLabel:true,fill:true,slots:[{id:'result',data:'text',required:false}],props:[],size:{w:792,h:56,minW:200,minH:40},mount(ctx){const root=el('div'),track=el('div'),fill=el('div'),row=el('div'),label=el('span'),count=el('span'),percent=el('strong');root.style.cssText='padding:8px 12px;min-height:0;overflow:hidden;flex:1 1 auto;border:1px solid #287e91;border-radius:12px;width:100%;height:100%;box-sizing:border-box;color:#b8d6df;display:grid;grid-template-rows:8px minmax(0,1fr);gap:6px';track.style.cssText='height:8px;background:#2c333e;border-radius:8px;overflow:hidden';track.setAttribute('role','progressbar');track.setAttribute('aria-label','Обработка подписей');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');fill.style.cssText='height:100%;background:#36cfea;border-radius:8px;transition:width .2s';row.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) auto 48px;gap:12px;min-height:0;align-items:center;font-size:12px;line-height:18px';label.style.cssText='min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis';percent.style.textAlign='right';row.append(label,count,percent);track.append(fill);root.append(track,row);ctx.body.append(root);const update=()=>{const s=captionState,total=Number(s.total)||0,done=Number(s.done)||0,pct=total?Math.min(100,Math.round(done/total*100)):0;label.textContent=s.error||s.status||'Ожидание';count.textContent=total?`${done} из ${total}`:'';percent.textContent=s.running&&!total?'—':`${pct}%`;fill.style.width=(s.running&&!total?20:pct)+'%';fill.style.background=s.error?'#b17683':'#36cfea';track.setAttribute('aria-valuenow',String(pct));track.setAttribute('aria-valuetext',s.running&&!total?'Подготовка модели':`${done} из ${total}`);};update();return{update};}};
