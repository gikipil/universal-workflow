import {captionModelFields} from './factory_caption.js';
// Universal Workflow update by gikipil, 2026-11-14: standalone and post-edit upscale.
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
import {el, closePopup} from './util.js';
import {modelpicker} from './special.js';
import {applyVars} from '../kit.js';
import {APPEARANCE_PROFILES} from '../factory_appearance.js';

const MODEL_FIELDS = [
    ['song_model','ACE-Step · модель','diffusion_models'],['song_clip1','ACE · энкодер 0.6B','text_encoders'],['song_clip2','ACE · энкодер 4B','text_encoders'],['song_vae','ACE · Audio VAE','vae'],
    ['aud_model','Higgs v3 · модель','auto'],['aud_whisper','Whisper · расшифровка','auto'],
    ['vid_ref_model','MiniMax REF · модель','diffusion_models'],['vid_fl_model','MiniMax FL · модель','diffusion_models'],['vid_clip','MiniMax H3 · энкодер','text_encoders'],['vid_video_vae','MiniMax H3 · Video VAE','vae'],['vid_audio_vae','MiniMax H3 · Audio VAE','vae'],['vid_turbo','MiniMax H3 · общий Turbo-адаптер','loras'],
    ['out_k_model','Модель Krea Turbo · дорисовка','diffusion_models'],
    ['edit_q21_model','Модель Qwen 2.1','diffusion_models'],['edit_q21_clip','Энкодер Qwen 2.1','text_encoders'],['edit_q21_vae','VAE Qwen 2.1','vae'],
    ['edit_krea_general','General Edit V2 · файл LoRA','loras'],['edit_krea_identity','Identity Edit V2 · файл LoRA','loras'],
    ['edit_model','Модель Qwen Edit 2511','diffusion_models'],['edit_clip','Энкодер Qwen Edit','text_encoders'],['edit_vae','VAE Qwen Edit','vae'],
    ['bg_model','Удаление фона · модель','auto'],
    ['pose_lora','OpenPose · служебная LoRA','loras'],['pose_bbox','Поза · детектор человека','auto'],['pose_estimator','Поза · детектор суставов','auto'],
    ['up_simple_model','Simple · upscale-модель','upscale_models'],['up_ultimate_model','Ultimate · upscale-модель','upscale_models'],
    ['up_seed_dit','SeedVR · DiT','auto'],['up_seed_vae','SeedVR · VAE','auto'],
    ['sam_model','Модель SAM 3.1','checkpoints'],['face_detector','YOLO · лица','auto'],['hand_detector','YOLO · руки','auto'],
    ['k_model','Модель Krea Raw','diffusion_models'], ['k_clip','Текстовый энкодер Krea','text_encoders'], ['k_vae','VAE Krea','vae'],
    ['k_turbo','Общий Turbo-адаптер Krea','loras'],
    ['z_model','Модель Z-Image','diffusion_models'], ['z_clip','Текстовый энкодер Z-Image','text_encoders'], ['z_vae','VAE Z-Image','vae'],
];
export const CONSTANT_LORA_GROUPS = [
    ['kg','Krea · генерация'], ['kr','Krea · детализация'], ['zr','Z-Image · детализация'],
];
export const SETTINGS_SLOTS = [{id:'caption_config',label:'Модели captioning',accepts:['STRING'],required:false},
    ...MODEL_FIELDS.map(([id,label]) => ({id,label,accepts:['COMBO'],required:true})),
    ...CONSTANT_LORA_GROUPS.flatMap(([prefix]) => Array.from({length:3},(_,i) => [
        {id:`${prefix}_${i+1}_lora`,label:`Постоянная LoRA ${i+1}`,accepts:['COMBO'],required:true},
        {id:`${prefix}_${i+1}_on`,label:`Включить LoRA ${i+1}`,accepts:['BOOLEAN'],required:true},
        {id:`${prefix}_${i+1}_strength`,label:`Сила LoRA ${i+1}`,accepts:['FLOAT'],required:true},
    ]).flat()),
];
const css = `
.acf-settings{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;z-index:1000000;display:grid;grid-template-rows:auto auto minmax(0,1fr);box-sizing:border-box;background:#111820;color:#e8eaf0;font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.5;isolation:isolate}
.acf-settings *{box-sizing:border-box}.acf-settings button,.acf-settings input{font:inherit}
.acf-settings-head{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 28px;border-bottom:1px solid #34414b}
.acf-settings-title{font-size:24px;font-weight:750;margin:0}.acf-settings-caption{font-size:13px;color:#a4adbf;margin-top:3px}
.acf-settings-close{display:flex;align-items:center;gap:8px;flex:0 0 auto;min-height:42px;padding:8px 16px;background:#a92e43;border:1px solid #f0637a;color:#fff;border-radius:10px;cursor:pointer}.acf-settings-close:hover{background:#cc3b52}
.acf-settings-tabs{display:flex;gap:8px;padding:14px 28px 0;border-bottom:1px solid #34414b;flex-wrap:wrap}
.acf-settings-tab{padding:12px 22px;border:1px solid #3b4955;border-radius:12px 12px 0 0;background:#1c2530;color:#b5c3d1;cursor:pointer;font-weight:650}.acf-settings-tab[aria-selected=true]{background:linear-gradient(145deg,#1c3c3d,#192d31);border-color:#5bdcb3;color:#b8ffe0;box-shadow:0 -2px 15px #39ddc51a}
.acf-settings-pane{min-height:0;overflow:auto;padding:24px 28px 32px}.acf-settings-pane[hidden]{display:none!important}
.acf-settings-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:16px;align-items:start}
.acf-settings-models{grid-template-columns:repeat(2,minmax(0,1fr))}
.acf-settings-layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:24px;align-items:start}
.acf-settings-categories{display:flex;flex-direction:column;gap:7px;position:sticky;top:0;padding:10px;background:#172129;border:1px solid #344b51;border-radius:14px}
.acf-settings-category{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;padding:10px 12px;border:1px solid transparent;border-radius:10px;background:transparent;color:#b7c7d1;text-align:left;cursor:pointer;font-weight:650}
.acf-settings-category[aria-pressed=true]{color:#c5ffeb;background:linear-gradient(120deg,#214338,#19343d);border-color:#50c5a1}
.acf-settings-category:hover{border-color:#47776b}.acf-settings-category small{color:#9cb4bd;font-size:12px}
.acf-settings-content{min-width:0}.acf-settings-content [hidden]{display:none!important}
@media(max-width:850px){.acf-settings-layout{grid-template-columns:minmax(0,1fr);gap:16px}.acf-settings-categories{position:static;flex-direction:row;flex-wrap:wrap}.acf-settings-category{flex:1 1 150px}}

@media(max-width:1100px){.acf-settings-models{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.acf-settings-models{grid-template-columns:minmax(0,1fr)}}
.acf-settings-card{padding:20px;border:1px solid #35554b;border-radius:16px;background:#18232a;min-width:0}
.acf-settings-card h3{margin:0 0 6px;font-size:18px;color:#8eefb4}.acf-settings-card p{margin:0 0 12px;font-size:13px;color:#a4adbf}
.acf-settings-field{display:flex;flex-direction:column;gap:6px;margin-top:12px;min-width:0}.acf-settings-field>span{font-size:13px;color:#a9d9bc}.acf-settings-picker{min-width:0;display:flex;flex-direction:column;min-height:44px}.acf-settings-picker .ndk-field{min-height:44px;width:100%}
.acf-settings-subtitle{margin:26px 0 14px;font-size:20px;color:#f0c5f7}
.acf-settings-lora-row{display:grid;grid-template-columns:46px minmax(0,1fr) 90px;gap:10px;align-items:center;margin-top:12px;min-width:0}
.acf-settings-lora-switch{display:flex;align-items:center;justify-content:center;width:46px;height:40px;border:1px solid #704a77;border-radius:10px;background:#28212f;color:#aaa0b0;cursor:pointer}.acf-settings-lora-switch[aria-checked=true]{background:linear-gradient(120deg,#e8588b,#9f43e7);color:#fff;border-color:#e680d1}
.acf-settings-strength{width:100%;min-width:0;height:44px;padding:0 10px;background:#20252d;border:1px solid #704a77;border-radius:10px;color:#f2d8f7;font-variant-numeric:tabular-nums}
.acf-settings-profile{display:flex;flex-direction:column;gap:10px;align-items:flex-start;text-align:left;width:100%;min-height:145px;padding:20px;background:#18232a;color:#dbe6ef;border:1px solid #3b4955;border-radius:14px;cursor:pointer}.acf-settings-profile[aria-pressed=true]{border-color:#76e5b6;box-shadow:0 0 0 2px #59e68d22}.acf-settings-profile strong{font-size:17px}.acf-settings-profile small{color:#a4adbf;font-size:13px}.acf-settings-swatches{display:flex;gap:6px}.acf-settings-swatches i{display:block;width:28px;height:18px;border-radius:5px;border:1px solid #ffffff33}
.acf-settings-glow{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}.acf-settings-glow button{flex:1;min-width:100px;min-height:42px;border:1px solid #3d6555;border-radius:10px;background:#202b31;color:#d9ede4;cursor:pointer}.acf-settings-glow button[aria-pressed=true]{background:#28513f;color:#c6ffdd;border-color:#6ae7a4}
.acf-settings button:focus-visible,.acf-settings input:focus-visible{outline:2px solid #75e4df;outline-offset:3px}
@media(max-width:620px){.acf-settings-head{padding:16px;align-items:flex-start}.acf-settings-title{font-size:21px}.acf-settings-tabs{padding:12px 16px 0}.acf-settings-tab{padding:10px 14px}.acf-settings-pane{padding:18px 16px}.acf-settings-card{padding:15px}.acf-settings-lora-row{gap:7px;grid-template-columns:40px minmax(0,1fr) 76px}.acf-settings-lora-switch{width:40px}.acf-settings-close{padding:8px 10px}}
`;

export function openFactorySettings(ctx, onClose=()=>{}) {
    closePopup();
    const overlay=el('div','ndk acf-settings'), style=el('style'), header=el('header','acf-settings-head'), titleBox=el('div'), close=el('button','acf-settings-close');
    style.textContent=css;overlay.append(style);overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Настройки универсального workflow');overlay.tabIndex=-1;
    titleBox.append(el('h2','acf-settings-title','Настройки'),el('div','acf-settings-caption','Модели, постоянные LoRA и оформление интерфейса'));
    close.type='button';close.setAttribute('aria-label','Закрыть настройки');close.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';close.append(el('span','','Закрыть'));header.append(titleBox,close);
    const tabs=el('div','acf-settings-tabs'), models=el('section','acf-settings-pane'), visual=el('section','acf-settings-pane');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Разделы настроек');
    const panes=[models,visual],tabButtons=[];let active=0,closed=false;
    const previous=document.activeElement,oldOverflow=document.body.style.overflow,instances=[],updaters=[],profileButtons=[],glowButtons=[];
    for (const [i,name] of ['Модели и LoRA','Внешний вид'].entries()) {
        const button=el('button','acf-settings-tab',name);button.type='button';button.id=`acf-settings-tab-${i}`;button.setAttribute('role','tab');button.setAttribute('aria-controls',`acf-settings-panel-${i}`);
        const select=()=>{active=i;for(const[j,b]of tabButtons.entries()){b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;panes[j].hidden=i!==j;}};
        button.addEventListener('click',select);button.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();const next=(active+(event.key==='ArrowRight'?1:-1)+2)%2;tabButtons[next].click();tabButtons[next].focus();}});
        panes[i].id=`acf-settings-panel-${i}`;panes[i].setAttribute('role','tabpanel');panes[i].setAttribute('aria-labelledby',button.id);tabs.append(button);tabButtons.push(button);
    }
    function subContext(body,key,folder,afterSet) {
        return {...ctx,body,w:{...ctx.w,slots:{value:ctx.w.slots[key]}},popupHost:()=>overlay,
            get:id=>ctx.get(id==='value'?key:id),info:id=>ctx.info(id==='value'?key:id),
            set(id,value){ctx.set(id==='value'?key:id,value);afterSet?.(value);},
            prop:id=>id==='requiredModel'?['k_turbo','pose_lora','vid_turbo'].includes(key):id==='folder'?folder:id==='pickerStyle'&&folder==='loras'?'lora':id==='placeholder'?'Выбрать файл…':ctx.prop(id)};
    }
    function picker(container,key,caption,folder,afterSet) {
        const field=el('div','acf-settings-field'),body=el('div','acf-settings-picker');if(caption)field.append(el('span','',caption));field.append(body);container.append(field);
        const instance=modelpicker.mount(subContext(body,key,folder,afterSet));instances.push(instance);return field;
    }
    function card(container,title,hint) {const box=el('div','acf-settings-card');box.append(el('h3','',title));if(hint)box.append(el('p','',hint));container.append(box);return box;}
    const modelsGrid=el('div','acf-settings-grid acf-settings-models');models.append(modelsGrid);
    const krea=card(modelsGrid,'💠 Krea 2 · основной комплект','Общий комплект для генерации, детализации, локальных областей и Krea Edit. Выбирай Raw-модель: Turbo-адаптер подключается в нужных режимах автоматически.');
    const zimage=card(modelsGrid,'⚡ Z-Image · основной комплект','Общий комплект Z-Image для второго прохода и локальных областей. LoRA каждого этапа независимы.');
    const turbo=card(modelsGrid,'⚡ Krea 2 · Turbo-адаптер','Один файл для всех Turbo-режимов Krea: генерации, детализации и локальных областей. Применяется автоматически.');
    const detection=card(modelsGrid,'🔎 SAM и YOLO','SAM выделяет область по описанию, YOLO находит лица и руки. Здесь выбираются установленные файлы детекторов.');
    const upModels=card(modelsGrid,'Апскейл · общие модели','Один выбор для генерации, редактирования и отдельной вкладки. У Simple и Ultimate свои файлы.');
    const pose=card(modelsGrid,'🦴 Поза по референсу','OpenPose LoRA подключается автоматически при включении позы. Детекторы извлекают скелет из фото.');
    const kreaEditor=card(modelsGrid,'✏️ Редактирование · Krea','Выбери файлы General Edit и Identity Edit. В настройках режима редактора переключается их назначение. Комплект Krea и Turbo-адаптер общие.');
    const qwen21Editor=card(modelsGrid,'✏️ Редактирование · Qwen 2.1','Отдельные модель, энкодер Qwen3-VL 8B и VAE Qwen 2.1. Комплект 2511 сюда не подходит. LoRA выбираются на вкладке редактора.');
    const editor=card(modelsGrid,'✏️ Редактирование · Qwen 2511','Независимый комплект редактора. Обычные LoRA выбираются на вкладке редактирования.');
    const audioCard=card(modelsGrid,'🔊 Звук · модели','Higgs и Whisper для голосовых референсов. Один выбор Whisper действует для обоих голосов. Голос по описанию использует отдельную фиксированную модель Qwen3-TTS VoiceDesign 1.7B из models/TTS/Qwen3-TTS.');
    const songCard=card(modelsGrid,'🎼 Звук · песни ACE-Step','Модель XL SFT, оба текстовых энкодера и Audio VAE существующего workflow для песен.');
    const videoCard=card(modelsGrid,'🎬 Видео · MiniMax H3','REF использует референсы, FL — первый и последний кадр. Назначь файлы обеих моделей. Рабочий режим REF / FL переключается слева во вкладке видео. Энкодер, VAE и Turbo-адаптер общие. Пользовательские LoRA выбираются отдельно во вкладке видео.');
    const outpaint=card(modelsGrid,'↔️ Дорисовка · Krea2','Проверенный вариант использует готовую Turbo-модель. Энкодер и VAE общие с Krea; Qwen берёт комплекты редактора. Дополнительные LoRA выбираются во вкладке дорисовки.');
    const background=card(modelsGrid,'🧽 Удаление фона','Отдельная функция. Выбор модели не меняет генерацию.');
    const upSeed=card(modelsGrid,'Апскейл · SeedVR','Общие DiT и VAE для генерации, редактирования и отдельного апскейла.');
    for (const [key,caption,folder] of MODEL_FIELDS) {
        const container=key.startsWith('song_')?songCard:key.startsWith('aud_')?audioCard:key.startsWith('vid_')?videoCard:key==='out_k_model'?outpaint:key.startsWith('edit_q21_')?qwen21Editor:key.startsWith('edit_krea_')?kreaEditor:key.startsWith('edit_')?editor:key==='bg_model'?background:key.startsWith('pose_')?pose:key==='up_simple_model'||key==='up_ultimate_model'?upModels:key.startsWith('up_seed_')?upSeed:['sam_model','face_detector','hand_detector'].includes(key)?detection:key.includes('turbo')?turbo:key.startsWith('z_')?zimage:krea;
        picker(container,key,caption,folder,key==='up_seed_dit'?value=>{if(/3b/i.test(String(value))){const state=ctx.info(key),node=state.p?.node||state.node,w=node?.widgets?.find(w=>w.name==='blocks_to_swap');if(w&&w.value>32){w.value=32;w.callback?.(32);node.graph?.change?.();}}}:undefined);
    }
    let captionCard=null;
    if(ctx.info('caption_config')?.bound){captionCard=card(modelsGrid,'📝 Промты · модели','Локальные Florence, Qwen и JoyCaption.');captionModelFields(ctx,captionCard);}
    const constantCards=new Map();
    for (const [prefix,name] of CONSTANT_LORA_GROUPS) {
        const box=card(modelsGrid,'🧩 Постоянные LoRA · '+name,'Три независимых слота. Не занимают список LoRA на главной странице.');constantCards.set(prefix,box);
        for(let i=1;i<=3;i++) {
            const row=el('div','acf-settings-lora-row'),toggle=el('button','acf-settings-lora-switch'),file=el('div'),strength=el('input','acf-settings-strength');
            const lora=`${prefix}_${i}_lora`,enabled=`${prefix}_${i}_on`,weight=`${prefix}_${i}_strength`;
            toggle.type='button';toggle.setAttribute('role','switch');toggle.setAttribute('aria-label',`${name} · постоянная LoRA ${i}`);
            toggle.addEventListener('click',()=>{ctx.set(enabled,!ctx.get(enabled));update();});
            const field=picker(file,lora,'','loras',value=>{ctx.set(enabled,!!value&&value!=='None');update();});field.style.marginTop='0';
            strength.type='number';strength.step='0.05';strength.min='-100';strength.max='100';strength.setAttribute('aria-label',`${name} · сила LoRA ${i}`);
            strength.addEventListener('change',()=>{const n=Number(strength.value);if(strength.value.trim()!==''&&Number.isFinite(n)&&n>=-100&&n<=100)ctx.set(weight,n);else strength.value=String(ctx.get(weight)??1);update();});
            strength.addEventListener('keydown',event=>event.stopPropagation());
            updaters.push(()=>{const on=!!ctx.get(enabled);toggle.setAttribute('aria-checked',String(on));toggle.textContent=on?'●':'○';toggle.title=on?'Включена':'Выключена';if(document.activeElement!==strength)strength.value=String(ctx.get(weight)??1);});
            row.append(toggle,file,strength);box.append(row);
        }
    }
    // Presentation only: existing pickers keep their slots, instances and values.
    const settingsLayout=el('div','acf-settings-layout'),categories=el('nav','acf-settings-categories'),content=el('div','acf-settings-content');
    categories.setAttribute('aria-label','Категории моделей');
    content.append(modelsGrid);
    settingsLayout.append(categories,content);models.append(settingsLayout);
    const groups=[
        ['💠 Krea 2',[krea,turbo,kreaEditor,outpaint,constantCards.get('kg'),constantCards.get('kr')]],
        ['⚡ Z-Image',[zimage,constantCards.get('zr')]],
        ['✏️ Редактирование и дорисовка',[qwen21Editor,editor]],
        ['🎯 Лицо, руки и поза',[detection,pose]],
        ['🔍 Апскейл',[upModels,upSeed]],
        ['🧽 Удаление фона',[background]],
        ['🎬 Видео',[videoCard]],
        ['🔊 Звук',[audioCard,songCard]],
        ...(captionCard?[['📝 Промты',[captionCard]]]:[]),
    ];
    const allCards=[...modelsGrid.children],categoryButtons=[];
    function selectCategory(index){
        const [,cards]=groups[index];
        for(const box of allCards)box.hidden=!cards.includes(box);
        modelsGrid.style.gridTemplateColumns=cards.length===1?'minmax(0,1fr)':'';
        for(const [i,button]of categoryButtons.entries())button.setAttribute('aria-pressed',String(i===index));
    }
    for(const [i,[name,cards]]of groups.entries()){
        const button=el('button','acf-settings-category');button.type='button';button.append(el('span','',name),el('small','',String(cards.length)));
        button.addEventListener('click',()=>selectCategory(i));categories.append(button);categoryButtons.push(button);
    }
    selectCategory(0);
    const visualGrid=el('div','acf-settings-grid');visual.append(el('h3','acf-settings-subtitle','Цветовой профиль'));visual.firstElementChild.style.marginTop='0';visual.append(visualGrid);
    for(const profile of APPEARANCE_PROFILES) {
        const button=el('button','acf-settings-profile'),swatches=el('span','acf-settings-swatches');button.type='button';
        for(const color of[profile.bg,profile.s2,profile.a,profile.b]){const sample=el('i');sample.style.background=color;swatches.append(sample);}
        button.append(swatches,el('strong','',profile.name),el('small','',profile.description));button.addEventListener('click',()=>{ctx.setAppearance?.(profile.id);update();});visualGrid.append(button);profileButtons.push([button,profile.id]);
    }
    visual.append(el('p','acf-settings-caption','Цвета промтов, LoRA и кнопки генерации сохраняют своё назначение. Изменения оформления сохраняются вместе с workflow.'));
    const glowCard=card(visual,'Свечение активной вкладки','Выбери комфортную яркость контура вкладки «Генерация».');glowCard.style.marginTop='24px';
    const glowRow=el('div','acf-settings-glow');glowCard.append(glowRow);
    for(const[value,label]of[['off','Выключено'],['soft','Мягкое'],['bright','Яркое']]){const button=el('button','',label);button.type='button';button.addEventListener('click',()=>{ctx.setProp('glow',value);update();});glowRow.append(button);glowButtons.push([button,value]);}
    overlay.append(header,tabs,models,visual);applyVars(overlay,ctx.vars());document.body.append(overlay);document.body.style.overflow='hidden';
    function update() {
        for(const instance of instances)instance.update?.();for(const fn of updaters)fn();
        const appearance=ctx.appearance?.()||'standard',profile=APPEARANCE_PROFILES.find(p=>p.id===appearance)||APPEARANCE_PROFILES[0];overlay.style.background=profile.bg;
        applyVars(overlay,ctx.vars());for(const[b,id]of profileButtons)b.setAttribute('aria-pressed',String(id===appearance));
        for(const[b,value]of glowButtons)b.setAttribute('aria-pressed',String((ctx.prop('glow')||'soft')===value));
    }
    function dismiss() {
        if(closed)return;closed=true;closePopup();window.removeEventListener('keydown',key,true);for(const instance of instances)instance.destroy?.();overlay.remove();document.body.style.overflow=oldOverflow;previous?.focus?.();onClose();
    }
    function key(event) {
        if(event.key==='Escape'){if(overlay.querySelector('.ndk-pop'))return;event.preventDefault();event.stopPropagation();dismiss();}
        if(event.key==='Tab'){
            const nodes=[...overlay.querySelectorAll('button,[tabindex="0"],input,select,textarea,a[href]')].filter(n=>!n.disabled&&n.getClientRects().length);
            const first=nodes[0],last=nodes.at(-1);if(!first)return;
            if(event.shiftKey&&(document.activeElement===first||!overlay.contains(document.activeElement))){event.preventDefault();last.focus();}
            else if(!event.shiftKey&&(document.activeElement===last||!overlay.contains(document.activeElement))){event.preventDefault();first.focus();}
        }
    }
    close.addEventListener('click',dismiss);window.addEventListener('keydown',key,true);tabButtons[0].click();update();close.focus();
    return {update,close:dismiss};
}
