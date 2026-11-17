// Universal Workflow update by gikipil, 2026-11-14: standalone and post-edit upscale.
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions/modifications by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
// User-facing task navigation, including explicitly prepared sections.
// Updated by gikipil, 2026-11-17: photo processing and video sections.
import {el,icon} from './util.js';
import {openFactorySettings,SETTINGS_SLOTS} from './factory_settings.js';
export const factorytaskbar_v0215={
 type:'factorytaskbar_v0215',label:'Вкладки задач',icon:'layers',group:'Layout',live:true,
 slots:SETTINGS_SLOTS,size:{w:1152,h:64,minW:400,minH:64},props:[],fill:true,
 mount(ctx){
  const row=el('div'),line=el('div'),tab=el('button'),settings=el('button');
  Object.assign(row.style,{position:'relative',display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'16px',width:'100%',height:'100%',padding:'6px 0 0 6px',boxSizing:'border-box',isolation:'isolate'});
  Object.assign(line.style,{position:'absolute',left:'6px',right:'0',bottom:'0',height:'1px',zIndex:'-1'});
  tab.type='button';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','true');tab.setAttribute('aria-label','Генерация — текущая задача');
  const tabStyle={position:'relative',display:'inline-flex',alignItems:'center',gap:'10px',height:'48px',padding:'0 26px',border:'1.5px solid transparent',borderBottom:'0',borderRadius:'18px 18px 0 0',font:'inherit',fontWeight:'700',fontSize:'16px',letterSpacing:'.15px',cursor:'default',whiteSpace:'nowrap',transition:'box-shadow 160ms ease'};Object.assign(tab.style,tabStyle);
  tab.append(icon('image',19),el('span','','Генерация'));
  const background=el('button'),navigation=el('div');Object.assign(background.style,tabStyle);background.type='button';background.setAttribute('role','tab');background.append(icon('layers',19),el('span','','Удаление фона'));Object.assign(navigation.style,{display:'flex',alignItems:'flex-end',gap:'8px',minWidth:'0',overflowX:'auto',overflowY:'visible'});navigation.setAttribute('role','tablist');navigation.setAttribute('aria-label','Задачи');const edit=el('button');Object.assign(edit.style,tabStyle);edit.type='button';edit.setAttribute('role','tab');edit.append(icon('pencil',19),el('span','','Редактирование'));const upscale=el('button');Object.assign(upscale.style,tabStyle);upscale.type='button';upscale.setAttribute('role','tab');upscale.append(icon('image',19),el('span','','Апскейл'));navigation.append(tab,background,edit,upscale);const tabs=[[tab,'p1','Генерация'],[background,'p_bg','Удаление фона'],[edit,'p_edit','Редактирование'],[upscale,'p_upscale','Апскейл']];if(ctx.pages?.().some(p=>p.id==='p_outpaint')){const outpaint=el('button');Object.assign(outpaint.style,tabStyle);outpaint.type='button';outpaint.setAttribute('role','tab');outpaint.append(el('span','','↔️'),el('span','','Дорисовка'));navigation.append(outpaint);tabs.push([outpaint,'p_outpaint','Дорисовка']);}if(ctx.pages?.().some(p=>p.id==='p_dataset')){const dataset=el('button');Object.assign(dataset.style,tabStyle);dataset.type='button';dataset.setAttribute('role','tab');dataset.append(el('span','','📝'),el('span','','Промты'));navigation.append(dataset);tabs.push([dataset,'p_dataset','Промты']);}for(const [page,title,emoji] of [['p_photo_processing','Обработка фото','🎨'],['p_video','Видео','🎬']]){if(ctx.pages?.().some(p=>p.id===page)){const button=el('button');Object.assign(button.style,tabStyle);button.type='button';button.setAttribute('role','tab');button.append(el('span','',emoji),el('span','',title));navigation.append(button);tabs.push([button,page,title]);}}for(const[b,page]of tabs){b.addEventListener('click',()=>ctx.goPage?.(page));b.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const i=tabs.findIndex(x=>x[1]===page),next=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;ctx.goPage?.(tabs[next][1]);tabs[next][0].focus();}});}
  settings.type='button';settings.setAttribute('aria-label','Настройки интерфейса');settings.setAttribute('aria-haspopup','dialog');settings.setAttribute('aria-expanded','false');
  Object.assign(settings.style,{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'8px',height:'40px',minWidth:'138px',marginBottom:'6px',padding:'0 15px',border:'1px solid #47636c',borderRadius:'10px',background:'linear-gradient(180deg,#222b33,#171d24)',color:'#c8d3dc',font:'inherit',fontWeight:'600',fontSize:'14px',cursor:'pointer',transition:'border-color 140ms ease,background 140ms ease'});
  const gear=el('span');
  Object.assign(gear.style,{display:'inline-flex',width:'20px',height:'20px',flex:'0 0 20px',color:'#91dfdb'});
  const teeth=Array.from({length:32},(_,i)=>{const a=(i/32)*Math.PI*2-Math.PI/32,r=i%4<2?9.5:7.6;return`${(12+Math.cos(a)*r).toFixed(2)},${(12+Math.sin(a)*r).toFixed(2)}`;}).join(' ');
  gear.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><polygon points="${teeth}"/><circle cx="12" cy="12" r="3.1"/></svg>`;
  settings.append(gear,el('span','','Настройки'));
  row.append(line,navigation,settings);ctx.body.style.flex='1 1 auto';
  if(ctx.body.parentElement)ctx.body.parentElement.style.padding='0';
  ctx.body.append(row);
  const color=()=>({a:ctx.prop('accentA')||'#36cfea',b:ctx.prop('accentB')||'#59e68d'});
  const strength=()=>['off','soft','bright'].includes(ctx.prop('glow'))?ctx.prop('glow'):'soft';
  function show(){const{a,b}=color(),s=strength(),current=ctx.activePage?.()||ctx.w.page||'p1';
   for(const[button,page,title]of tabs){const active=current===page;button.setAttribute('aria-selected',String(active));button.setAttribute('aria-label',title+(active?' — текущая задача':''));button.tabIndex=active?0:-1;button.style.cursor=active?'default':'pointer';button.style.color=active?'#e9fff7':'#a4b7bd';button.style.background=active?`linear-gradient(155deg,#1b3032,#142126) padding-box,linear-gradient(115deg,${a},${b}) border-box`:'linear-gradient(155deg,#1a2429,#161d23)';button.style.borderColor=active?'transparent':'#35484b';button.style.boxShadow=!active||s==='off'?'none':s==='bright'?`0 -2px 18px ${a}66, 0 0 24px ${b}33, inset 0 6px 14px ${a}18`:`0 -1px 10px ${a}44, 0 0 16px ${b}22, inset 0 5px 12px ${a}12`;}
   line.style.background=`linear-gradient(90deg,${a}99,${b}66 36%,#303b44 76%)`;
  }
  settings.addEventListener('pointerenter',()=>{settings.style.borderColor=color().a;settings.style.background='linear-gradient(180deg,#293841,#1a252d)';});
  settings.addEventListener('pointerleave',()=>{settings.style.borderColor='#3f505a';settings.style.background='linear-gradient(180deg,#222b33,#171d24)';});
  let settingsWindow=null;
  settings.addEventListener('click',()=>{
   if(settingsWindow){settingsWindow.close();return;}
   settings.setAttribute('aria-expanded','true');
   settingsWindow=openFactorySettings({...ctx,setProp:(id,v)=>ctx.setTaskProp?ctx.setTaskProp(id,v):ctx.setProp(id,v)},()=>{settingsWindow=null;settings.setAttribute('aria-expanded','false');show();});
  });
  show();return{update(){show();settingsWindow?.update?.();},destroy(){settingsWindow?.close?.();}};
 }
};
