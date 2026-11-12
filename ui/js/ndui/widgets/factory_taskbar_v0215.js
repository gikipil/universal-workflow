// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions/modifications by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
// User-facing task navigation. Only implemented tasks are shown.
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
  Object.assign(tab.style,{position:'relative',display:'inline-flex',alignItems:'center',gap:'10px',height:'48px',padding:'0 26px',border:'1.5px solid transparent',borderBottom:'0',borderRadius:'18px 18px 0 0',font:'inherit',fontWeight:'700',fontSize:'16px',letterSpacing:'.15px',cursor:'default',whiteSpace:'nowrap',transition:'box-shadow 160ms ease'});
  tab.append(icon('image',19),el('span','','Генерация'));
  settings.type='button';settings.setAttribute('aria-label','Настройки интерфейса');settings.setAttribute('aria-haspopup','dialog');settings.setAttribute('aria-expanded','false');
  Object.assign(settings.style,{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'8px',height:'40px',minWidth:'138px',marginBottom:'6px',padding:'0 15px',border:'1px solid #47636c',borderRadius:'10px',background:'linear-gradient(180deg,#222b33,#171d24)',color:'#c8d3dc',font:'inherit',fontWeight:'600',fontSize:'14px',cursor:'pointer',transition:'border-color 140ms ease,background 140ms ease'});
  const gear=el('span');
  Object.assign(gear.style,{display:'inline-flex',width:'20px',height:'20px',flex:'0 0 20px',color:'#91dfdb'});
  const teeth=Array.from({length:32},(_,i)=>{const a=(i/32)*Math.PI*2-Math.PI/32,r=i%4<2?9.5:7.6;return`${(12+Math.cos(a)*r).toFixed(2)},${(12+Math.sin(a)*r).toFixed(2)}`;}).join(' ');
  gear.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><polygon points="${teeth}"/><circle cx="12" cy="12" r="3.1"/></svg>`;
  settings.append(gear,el('span','','Настройки'));
  row.append(line,tab,settings);ctx.body.style.flex='1 1 auto';
  if(ctx.body.parentElement)ctx.body.parentElement.style.padding='0';
  ctx.body.append(row);
  const color=()=>({a:ctx.prop('accentA')||'#36cfea',b:ctx.prop('accentB')||'#59e68d'});
  const strength=()=>['off','soft','bright'].includes(ctx.prop('glow'))?ctx.prop('glow'):'soft';
  function show(){const{a,b}=color(),s=strength();
   tab.style.color='#e9fff7';tab.style.background=`linear-gradient(155deg,#1b3032,#142126) padding-box,linear-gradient(115deg,${a},${b}) border-box`;
   tab.style.boxShadow=s==='off'?'none':s==='bright'?`0 -2px 18px ${a}66, 0 0 24px ${b}33, inset 0 6px 14px ${a}18`:`0 -1px 10px ${a}44, 0 0 16px ${b}22, inset 0 5px 12px ${a}12`;
   line.style.background=`linear-gradient(90deg,${a}99,${b}66 36%,#303b44 76%)`;
  }
  settings.addEventListener('pointerenter',()=>{settings.style.borderColor=color().a;settings.style.background='linear-gradient(180deg,#293841,#1a252d)';});
  settings.addEventListener('pointerleave',()=>{settings.style.borderColor='#3f505a';settings.style.background='linear-gradient(180deg,#222b33,#171d24)';});
  let settingsWindow=null;
  settings.addEventListener('click',()=>{
   if(settingsWindow){settingsWindow.close();return;}
   settings.setAttribute('aria-expanded','true');
   settingsWindow=openFactorySettings(ctx,()=>{settingsWindow=null;settings.setAttribute('aria-expanded','false');show();});
  });
  show();return{update(){show();settingsWindow?.update?.();},destroy(){settingsWindow?.close?.();}};
 }
};
