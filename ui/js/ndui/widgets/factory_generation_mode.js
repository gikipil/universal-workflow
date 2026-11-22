import {modeFileSlots,mountModePresence,modeLabel} from './factory_mode_presence.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions/modifications by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
// Native ND UI carousel for the three existing generation branches.
import {el} from './util.js';
import {toggle} from './inputs.js';
export const MODES=['Обычный · Turbo','RES4LYF · Turbo','Raw → Turbo'];
const FIELDS=[
 [['steps','Шаги'],['sampler','Сэмплер','scheduler','Шедулер']],
 [['res_steps','Шаги'],['res_sampler','Сэмплер','res_scheduler','Шедулер'],['eta','Eta']],
 [['handoff','Переход на Turbo, %'],['raw_steps','Raw · шаги','raw_cfg','Raw · CFG'],['raw_sampler','Raw · сэмплер','raw_scheduler','Raw · шедулер'],['turbo_steps','Turbo · шаги'],['turbo_sampler','Turbo · сэмплер','turbo_scheduler','Turbo · шедулер']]
];
const TYPES={mode:'INT',steps:'INT',sampler:'COMBO',scheduler:'COMBO',res_steps:'INT',res_sampler:'COMBO',res_scheduler:'COMBO',eta:'FLOAT',handoff:'INT',raw_steps:'INT',raw_cfg:'FLOAT',raw_sampler:'COMBO',raw_scheduler:'COMBO',turbo_steps:'INT',turbo_sampler:'COMBO',turbo_scheduler:'COMBO'};
export const factorygenerationmode={type:'factorygenerationmode',label:'Режим генерации',icon:'layers',group:'Run',live:true,
 slots:[...Object.entries(TYPES).map(([id,t])=>({id,label:id,accepts:[t],required:true})),{id:'lightweight',label:'Облегчённая версия',accepts:['BOOLEAN'],required:false},...modeFileSlots('generation')],
 size:{w:312,h:408,minW:280,minH:100},props:[],
 mount(ctx){
  const root=el('div'),header=el('div'),prev=el('button','ndk-chip','‹'),next=el('button','ndk-chip','›'),title=el('div'),body=el('div'),dots=el('div');
  Object.assign(root.style,{display:'flex',flexDirection:'column',gap:'10px',height:'100%',width:'100%'});
  Object.assign(header.style,{display:'grid',gridTemplateColumns:'36px 1fr 36px',alignItems:'center',gap:'8px',touchAction:'pan-y'});
  Object.assign(title.style,{fontWeight:'700',textAlign:'center',color:'#8eefb4'});
  for(const b of [prev,next]){b.type='button';b.style.fontSize='24px';b.style.height='38px';}
  prev.setAttribute('aria-label','Предыдущий режим');next.setAttribute('aria-label','Следующий режим');
  header.append(prev,title,next);Object.assign(body.style,{display:'grid',alignContent:'start',gap:'8px',flex:'1',minHeight:'0',overflowY:'auto'});
  Object.assign(dots.style,{display:'flex',justifyContent:'center',gap:'10px'});
  const labelText=modeLabel(title),presence=ctx.prop?.('part')==='settings'?null:mountModePresence(ctx,title,'generation');
  const controls=new Map();let active=-1,liteControl=null;
  const current=()=>Math.min(2,Math.max(0,Number(ctx.get('mode'))||0));
  function go(i){ctx.set('mode',(i+3)%3);show();}
  prev.addEventListener('click',()=>go(current()-1));next.addEventListener('click',()=>go(current()+1));
  let start=null;header.addEventListener('pointerdown',e=>{if(e.target===prev||e.target===next)return;start=[e.clientX,e.clientY];});
  header.addEventListener('pointerup',e=>{if(start){const dx=e.clientX-start[0],dy=e.clientY-start[1];if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5)go(current()+(dx<0?1:-1));}start=null;});
  header.addEventListener('pointercancel',()=>start=null);
  header.tabIndex=0;header.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();go(current()+(e.key==='ArrowRight'?1:-1));}});
  const buttons=MODES.map((name,i)=>{const b=el('button','ndk-chip',String(i+1));b.type='button';b.title=name;b.setAttribute('aria-label',name);b.addEventListener('click',()=>go(i));dots.append(b);return b;});
  function field(key,label){
   const wrap=el('label'),caption=el('div','',label),box=el('div','ndk-field'),combo=TYPES[key]==='COMBO',input=el(combo?'select':'input','ndk-input');
   wrap.style.minWidth='0';caption.style.fontSize='12px';caption.style.color='#8eefb4';input.setAttribute('aria-label',label);
   if(combo){input.style.colorScheme='dark';const options=ctx.info(key)?.options||[];for(const value of options){const o=el('option','',String(value));o.value=String(value);o.style.backgroundColor='#20252d';o.style.color='#e8eaf0';input.append(o);}}
   else{input.type='number';input.step=TYPES[key]==='INT'?'1':'0.05';const info=ctx.info(key);if(info?.min!=null)input.min=String(info.min);if(info?.max!=null)input.max=String(info.max);}
   input.addEventListener('change',()=>{let v=combo?input.value:Number(input.value);if(!combo){if(input.value.trim()===''||!Number.isFinite(v))return;const lo=Number(input.min),hi=Number(input.max);if(input.min!=='')v=Math.max(lo,v);if(input.max!=='')v=Math.min(hi,v);if(TYPES[key]==='INT')v=Math.round(v);}ctx.set(key,v);show();});
   input.addEventListener('keydown',e=>e.stopPropagation());box.append(input);wrap.append(caption,box);controls.set(key,input);return wrap;
  }
  function show(){presence?.update();const m=current();if(m!==active){active=m;liteControl?.destroy?.();liteControl=null;controls.clear();body.replaceChildren();labelText.textContent=MODES[m];labelText.title=MODES[m];
   const hint=el('div','', ['Генерация Turbo обычным сэмплером.','Генерация Turbo через RES4LYF.','Начало шума — Raw, завершение — Turbo.'][m]);hint.style.fontSize='12px';hint.style.color='#a4adbf';body.append(hint);
   if(m<2&&ctx.info('lightweight')?.bound){const host=el('div');body.append(host);liteControl=toggle.mount({...ctx,body:host,w:{...ctx.w,props:{...ctx.w?.props,label:'Облегчённая версия'},slots:{value:ctx.w?.slots?.lightweight}},get:k=>ctx.get(k==='value'?'lightweight':k),set:(k,v)=>{ctx.set(k==='value'?'lightweight':k,v);show();},info:k=>ctx.info(k==='value'?'lightweight':k),prop:k=>k==='text'?'Облегчённая версия':k==='description'?'Готовая Turbo-модель без Turbo LoRA. Файл — в общих настройках Krea2.':ctx.prop(k)});}
   for(const row of FIELDS[m]){const r=el('div');Object.assign(r.style,{display:'grid',gridTemplateColumns:row.length===4?'minmax(0,1fr) minmax(0,1fr)':'minmax(0,1fr)',gap:'8px'});for(let i=0;i<row.length;i+=2)r.append(field(row[i],row[i+1]));body.append(r);}
   const note=el('div','',m===2?'Негативный промт применяется к Raw. CFG Turbo = 1.':'CFG = 1. Негативный промт не применяется. Настройки других режимов сохраняются при переключении.');note.style.cssText='font-size:12px;color:#a4adbf;line-height:1.5';body.append(note);
  }
  for(const [key,input]of controls)if(document.activeElement!==input)input.value=String(ctx.get(key)??'');
  liteControl?.update?.();
  buttons.forEach((b,i)=>{b.classList.toggle('on',m===i);b.setAttribute('aria-pressed',String(m===i));});
  }
  const part=ctx.prop?.('part')||'all';
  if(part==='header')root.append(header);
  else if(part==='settings')root.append(body);
  else root.append(header,body);
  ctx.body.append(root);show();return{update:show,destroy(){liteControl?.destroy?.();presence?.destroy();}};
 }
};
