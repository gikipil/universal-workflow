// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions/modifications by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
// Compact five-digit size fields, current aspect label and readable numeric MP.
import {el,icon,popup} from './util.js';
import {openList} from './choice.js';
import {dimensions,RATIOS} from './factory_resolution.js';
const MP=[.5,1,1.5,2,3,4,6];
export function aspectLabel(w,h){const match=RATIOS.find(([a,b])=>Math.abs(w/h-a/b)/(a/b)<.015);if(match)return`${match[0]}:${match[1]}`;let a=w,b=h;while(b){const t=b;b=a%b;a=t;}const text=`${w/a}:${h/a}`;return text.length<=7?text:'Своё';}
export const factorysize_v0213={type:'factorysize_v0213',label:'Размер изображения',icon:'ratio',group:'Run',live:true,
 slots:[{id:'width',label:'Width',accepts:['INT'],required:true},{id:'height',label:'Height',accepts:['INT'],required:true}],size:{w:312,h:72,minW:312,minH:64},props:[],
 mount(ctx){const root=el('div'),row=el('div'),manual=el('div'),ratio=el('button','ndk-chip'),ratioText=el('span'),mpField=el('button','ndk-field ndk-dd'),mpText=el('span','ndk-dd-val'),labels=el('div'),manualLabels=el('div');
  Object.assign(root.style,{display:'grid',gap:'5px',width:'100%',maxWidth:'100%',alignSelf:'center'});
  for(const box of[row,labels])Object.assign(box.style,{display:'grid',gap:'8px',alignItems:'center'});
  for(const box of[manual,manualLabels])Object.assign(box.style,{display:'grid',gap:'4px',alignItems:'center'});
  const inputs={};
  for(const key of['width','height']){const field=el('div','ndk-field'),input=el('input','ndk-input acf-size-number-v0213');Object.assign(field.style,{minWidth:'0',height:'40px',padding:'0 6px'});input.type='number';input.min='64';input.max='16384';input.step='16';input.setAttribute('aria-label',key==='width'?'Ширина изображения':'Высота изображения');Object.assign(input.style,{minWidth:'0',width:'100%',fontSize:'13px',fontVariantNumeric:'tabular-nums',appearance:'textfield'});field.append(input);manual.append(field);inputs[key]=input;
   const label=el('span','',key==='width'?'Ширина':'Высота');Object.assign(label.style,{fontSize:'10px',color:'#a4adbf'});manualLabels.append(label);
   if(key==='width'){const x=el('span','','×');Object.assign(x.style,{textAlign:'center',color:'#a4adbf',fontSize:'13px'});manual.append(x);manualLabels.append(el('span'));}
   input.addEventListener('change',()=>{const n=Number(input.value);if(input.value.trim()!==''&&Number.isFinite(n)&&n>=64)ctx.set(key,Math.min(16384,Math.round(n/16)*16));show();});
   input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){input.dispatchEvent(new Event('change'));input.blur();}});
  }
  const size=()=>[Number(ctx.get('width'))||1024,Number(ctx.get('height'))||1024],put=(r,mp)=>{const[w,h]=dimensions(r,mp);ctx.set('width',w);ctx.set('height',h);show();};
  ratio.type='button';ratio.setAttribute('aria-label','Выбрать соотношение сторон');ratio.setAttribute('aria-haspopup','dialog');ratio.setAttribute('aria-expanded','false');Object.assign(ratio.style,{height:'40px',minWidth:'0',padding:'0 6px',display:'flex',gap:'4px',alignItems:'center',justifyContent:'center'});Object.assign(ratioText.style,{fontSize:'13px',whiteSpace:'nowrap'});ratio.append(ratioText,icon('chevD',11));
  let menu=null;ratio.addEventListener('click',()=>{ratio.setAttribute('aria-expanded','true');ctx.onPopupClose=()=>{ratio.setAttribute('aria-expanded','false');menu=null;};menu=popup(ctx,ratio,{width:264,maxH:300,build(box,close){Object.assign(box.style,{padding:'12px',boxSizing:'border-box'});box.setAttribute('role','dialog');box.setAttribute('aria-label','Соотношение сторон');const heading=el('div','','Соотношение сторон'),grid=el('div');heading.style.marginBottom='10px';heading.style.fontSize='12px';Object.assign(grid.style,{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'6px'});const[w,h]=size();for(const[a,b]of RATIOS){const button=el('button','ndk-chip',`${a}:${b}`);button.type='button';button.style.height='34px';const active=Math.abs(w/h-a/b)/(a/b)<.015;button.classList.toggle('on',active);button.setAttribute('aria-pressed',String(active));button.addEventListener('click',()=>{const[cw,ch]=size();put(a/b,cw*ch/1e6);close();});grid.append(button);}box.append(heading,grid);}});});
  mpField.type='button';mpField.setAttribute('aria-label','Мегапиксели');mpField.setAttribute('aria-haspopup','listbox');mpField.setAttribute('aria-expanded','false');Object.assign(mpField.style,{height:'40px',padding:'0 8px',minWidth:'0',width:'100%',position:'relative',cursor:'pointer',fontSize:'13px',fontVariantNumeric:'tabular-nums',color:'var(--ndk-text)',textAlign:'left'});mpField.append(mpText,icon('chevD',12));
  const closeFlags=()=>{ratio.setAttribute('aria-expanded','false');mpField.setAttribute('aria-expanded','false');menu=null;};
  mpField.addEventListener('click',()=>{const[w,h]=size(),mp=w*h/1e6,exact=MP.find(n=>Math.abs(mp-n)/n<.015),current=String(exact??Number(mp.toFixed(2))),options=MP.map(String);if(exact==null)options.unshift(current);ctx.onPopupClose=closeFlags;menu=openList(ctx,mpField,{options,current,search:false,onPick:value=>{const n=Number(value);if(MP.includes(n)){const[cw,ch]=size();put(cw/ch,n);}}});Object.assign(menu.box.style,{width:'128px',minWidth:'0',borderRadius:'12px',border:'1px solid var(--ndk-border)',boxShadow:'0 12px 32px #0008'});menu.box.setAttribute('aria-label','Мегапиксели');mpField.setAttribute('aria-expanded','true');});
  row.append(manual,ratio,mpField);
  labels.append(manualLabels);for(const text of['Формат','МП']){const label=el('span','',text);Object.assign(label.style,{fontSize:'10px',color:'#a4adbf',textAlign:'center',whiteSpace:'nowrap'});labels.append(label);}
  const css=el('style');css.textContent='.acf-size-number-v0213::-webkit-outer-spin-button,.acf-size-number-v0213::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}';root.append(row,labels);ctx.body.append(css,root);
  function layout(){const columns='minmax(0,1fr) 60px 88px';for(const box of[row,labels])box.style.gridTemplateColumns=columns;for(const box of[manual,manualLabels])box.style.gridTemplateColumns='minmax(0,1fr) 12px minmax(0,1fr)';}
  function show(){const[w,h]=size(),mp=w*h/1e6;for(const k of['width','height'])if(document.activeElement!==inputs[k])inputs[k].value=String(k==='width'?w:h);const exact=MP.find(n=>Math.abs(mp-n)/n<.015);mpText.textContent=String(exact??Number(mp.toFixed(2)));ratioText.textContent=aspectLabel(w,h);ratio.title=`Соотношение сторон · ${w} × ${h}`;}
  layout();show();return{update:show,resize:layout,destroy(){menu?.close?.();}};
 }
};
