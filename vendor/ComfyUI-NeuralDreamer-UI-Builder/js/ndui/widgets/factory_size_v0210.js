// Compact one-line image size controls with a popup ratio matrix.
import {el,icon,popup} from './util.js';
import {dimensions,RATIOS} from './factory_resolution.js';
const MP=[.5,1,1.5,2,3,4,6];
export const factorysize_v0210={type:'factorysize_v0210',label:'Размер изображения',icon:'ratio',group:'Run',live:true,
 slots:[{id:'width',label:'Width',accepts:['INT'],required:true},{id:'height',label:'Height',accepts:['INT'],required:true}],size:{w:312,h:96,minW:280,minH:88},props:[],
 mount(ctx){const root=el('div'),row=el('div'),manual=el('div'),ratio=el('button','ndk-chip'),mpField=el('div','ndk-field'),select=el('select','ndk-input'),labels=el('div'),info=el('div');
  const columns='minmax(0,1fr) 44px 64px';Object.assign(root.style,{display:'grid',gap:'5px',width:'100%'});
  for(const box of[row,labels])Object.assign(box.style,{display:'grid',gridTemplateColumns:columns,gap:'8px',alignItems:'center'});
  Object.assign(manual.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr) 14px minmax(0,1fr)',gap:'4px',alignItems:'center'});
  const inputs={};
  for(const key of['width','height']){const field=el('div','ndk-field'),input=el('input','ndk-input');Object.assign(field.style,{minWidth:'0',height:'40px',padding:'0 7px'});input.type='number';input.min='64';input.max='16384';input.step='16';input.setAttribute('aria-label',key==='width'?'Ширина изображения':'Высота изображения');input.style.minWidth='0';input.style.fontSize='13px';field.append(input);manual.append(field);inputs[key]=input;
   if(key==='width'){const x=el('span','','×');Object.assign(x.style,{textAlign:'center',color:'#a4adbf',fontSize:'13px'});manual.append(x);}
   input.addEventListener('change',()=>{const n=Number(input.value);if(input.value.trim()!==''&&Number.isFinite(n)&&n>=64)ctx.set(key,Math.min(16384,Math.round(n/16)*16));show();});
   input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){input.dispatchEvent(new Event('change'));input.blur();}});
  }
  const size=()=>[Number(ctx.get('width'))||1024,Number(ctx.get('height'))||1024],put=(r,mp)=>{const[w,h]=dimensions(r,mp);ctx.set('width',w);ctx.set('height',h);show();};
  ratio.type='button';ratio.setAttribute('aria-label','Выбрать соотношение сторон');ratio.setAttribute('aria-haspopup','dialog');ratio.setAttribute('aria-expanded','false');Object.assign(ratio.style,{height:'40px',padding:'0 4px',display:'flex',gap:'2px',alignItems:'center',justifyContent:'center'});ratio.append(icon('grid',16),icon('chevD',11));
  let menu=null;ratio.addEventListener('click',()=>{ratio.setAttribute('aria-expanded','true');ctx.onPopupClose=()=>{ratio.setAttribute('aria-expanded','false');menu=null;};menu=popup(ctx,ratio,{width:264,maxH:300,build(box,close){Object.assign(box.style,{padding:'12px',boxSizing:'border-box'});box.setAttribute('role','dialog');box.setAttribute('aria-label','Соотношение сторон');const heading=el('div','','Соотношение сторон'),grid=el('div');heading.style.marginBottom='10px';heading.style.fontSize='12px';Object.assign(grid.style,{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'6px'});const[w,h]=size();for(const[a,b]of RATIOS){const button=el('button','ndk-chip',`${a}:${b}`);button.type='button';button.style.height='34px';const active=Math.abs(w/h-a/b)/(a/b)<.015;button.classList.toggle('on',active);button.setAttribute('aria-pressed',String(active));button.addEventListener('click',()=>{const[cw,ch]=size();put(a/b,cw*ch/1e6);close();});grid.append(button);}box.append(heading,grid);}});});
  Object.assign(mpField.style,{height:'40px',padding:'0 5px',minWidth:'0'});select.setAttribute('aria-label','Мегапиксели');select.style.colorScheme='dark';select.style.fontSize='13px';select.style.minWidth='0';
  const optionStyle=o=>{o.style.backgroundColor='#20252d';o.style.color='#e8eaf0';};const current=el('option');current.value='current';current.disabled=true;optionStyle(current);select.append(current);
  for(const mp of MP){const option=el('option','',String(mp));option.value=String(mp);optionStyle(option);select.append(option);}
  select.addEventListener('change',()=>{const n=Number(select.value);if(MP.includes(n)){const[w,h]=size();put(w/h,n);}});mpField.append(select);row.append(manual,ratio,mpField);
  for(const[text,align]of[['Ширина × высота','left'],['Формат','center'],['МП','center']]){const label=el('span','',text);Object.assign(label.style,{fontSize:'10px',color:'#a4adbf',textAlign:align,whiteSpace:'nowrap'});labels.append(label);}
  info.style.fontSize='11px';info.style.color='#a4adbf';root.append(row,labels,info);ctx.body.append(root);
  function show(){const[w,h]=size(),mp=w*h/1e6;for(const k of['width','height'])if(document.activeElement!==inputs[k])inputs[k].value=String(k==='width'?w:h);current.textContent=String(Number(mp.toFixed(2)));const exact=MP.find(n=>Math.abs(mp-n)/n<.015);select.value=exact==null?'current':String(exact);ratio.title=`Соотношение сторон · ${w} × ${h}`;info.textContent=`${w} × ${h} px · ${mp.toFixed(2)} МП`;}
  show();return{update:show,destroy(){menu?.close?.();}};
 }
};
