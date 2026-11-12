// Native ND UI size controls; values are bound to real resize-node parameters.
import {el} from './util.js';
export const RATIOS=[[1,1],[16,9],[9,16],[2,3],[3,2],[4,3],[3,4],[4,5],[5,4]];
export function dimensions(ratio,mp,multiple=16){
  if(!(ratio>0&&Number.isFinite(ratio)&&mp>0&&Number.isFinite(mp)))throw new RangeError('Invalid image size');
  const round=v=>Math.max(64,Math.min(16384,Math.round(v/multiple)*multiple));
  return [round(Math.sqrt(mp*1e6*ratio)),round(Math.sqrt(mp*1e6/ratio))];
}
export const factoryresolution={
  type:'factoryresolution',label:'Размер изображения',icon:'ratio',group:'Run',live:true,
  slots:[{id:'width',label:'Width',accepts:['INT'],required:true},{id:'height',label:'Height',accepts:['INT'],required:true}],
  size:{w:312,h:264,minW:280,minH:248},props:[],
  mount(ctx){
    const root=el('div'),top=el('div'),ratios=el('div'),manual=el('div');
    Object.assign(root.style,{display:'grid',gap:'8px',width:'100%'});
    Object.assign(top.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr) 104px',gap:'8px'});
    Object.assign(ratios.style,{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'6px',alignContent:'start'});
    Object.assign(manual.style,{display:'grid',gap:'6px'});
    const inputs={};
    for(const [key,label] of [['width','Ширина'],['height','Высота']]){
      const wrap=el('label'),caption=el('div','',label),field=el('div','ndk-field'),input=el('input','ndk-input');
      input.type='number';input.min='64';input.max='16384';input.step='16';input.setAttribute('aria-label',label);
      caption.style.fontSize='12px';wrap.style.minWidth='0';field.append(input);wrap.append(caption,field);manual.append(wrap);inputs[key]=input;
      input.addEventListener('change',()=>{const n=Number(input.value);if(Number.isFinite(n)&&n>=64)ctx.set(key,Math.min(16384,Math.round(n/16)*16));show();});
      input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){input.dispatchEvent(new Event('change'));input.blur();}});
    }
    const size=()=>[Number(ctx.get('width'))||1024,Number(ctx.get('height'))||1024];
    const put=(r,mp)=>{const [w,h]=dimensions(r,mp);ctx.set('width',w);ctx.set('height',h);show();};
    const buttons=RATIOS.map(([a,b])=>{const button=el('button','ndk-chip',`${a}×${b}`);button.type='button';button.style.padding='4px';button.setAttribute('aria-label',`Пропорции ${a} на ${b}`);button.addEventListener('click',()=>{const [w,h]=size();put(a/b,w*h/1e6);});ratios.append(button);return [button,a/b];});
    top.append(ratios,manual);
    const mpLabel=el('label'),caption=el('div','','Разрешение, МП'),field=el('div','ndk-field'),select=el('select','ndk-input');
    select.setAttribute('aria-label','Разрешение в мегапикселях');caption.style.fontSize='12px';
    select.style.colorScheme='dark';
    const optionStyle=option=>{option.style.backgroundColor='#20252d';option.style.color='#e8eaf0';};
    const custom=el('option');custom.value='custom';optionStyle(custom);select.append(custom);
    for(const n of [.5,1,1.5,2,3,4,6]){const option=el('option','',`${n} МП`);option.value=String(n);optionStyle(option);select.append(option);}
    select.addEventListener('change',()=>{if(select.value!=='custom'){const [w,h]=size();put(w/h,Number(select.value));}});
    field.append(select);mpLabel.append(caption,field);
    const info=el('div');info.style.fontSize='12px';info.style.opacity='.8';
    root.append(top,mpLabel,info);ctx.body.append(root);
    function show(){const [w,h]=size();for(const k of ['width','height'])if(document.activeElement!==inputs[k])inputs[k].value=String(k==='width'?w:h);
      const mp=w*h/1e6;custom.textContent=`Текущее · ${mp.toFixed(2)} МП`;select.value='custom';
      for(const [button,r] of buttons){const active=Math.abs(w/h-r)/r<.015;button.classList.toggle('on',active);button.setAttribute('aria-pressed',String(active));}
      info.textContent=`${w} × ${h} px · ${mp.toFixed(2)} МП`;
    }
    show();return {update:show};
  }
};
