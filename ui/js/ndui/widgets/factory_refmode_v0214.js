// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions/modifications by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
// Compact generation selector with mode-specific settings in a centred popup.
import {el,popup} from './util.js';
import {prompt as promptWidget} from './text.js';
import {factoryrefinementmode,MODES} from './factory_refinement_mode.js';
function gearIcon(){const gear=el('span');Object.assign(gear.style,{display:'inline-flex',width:'20px',height:'20px',flex:'0 0 20px'});
 const points=Array.from({length:32},(_,i)=>{const a=i/32*Math.PI*2-Math.PI/32,r=i%4<2?9.5:7.6;return`${(12+Math.cos(a)*r).toFixed(2)},${(12+Math.sin(a)*r).toFixed(2)}`;}).join(' ');
 gear.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><polygon points="${points}"/><circle cx="12" cy="12" r="3.1"/></svg>`;return gear;
}
export const factoryrefmode_v0214={...factoryrefinementmode,type:'factoryrefmode_v0214',slots:[...factoryrefinementmode.slots,{id:'detail_prompt',label:'Промт детализации',accepts:['STRING'],required:false}],label:'Способ детализации и настройки',noLabel:true,fill:true,size:{w:312,h:48,minW:270,minH:48},
 mount(ctx){const row=el('div'),selector=el('div'),settings=el('button');
  Object.assign(row.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr) 40px',gap:'10px',alignItems:'center',width:'100%',height:'100%'});
  Object.assign(selector.style,{minWidth:'0',height:'38px'});
  settings.type='button';settings.setAttribute('aria-label','Настройки выбранного режима детализации');settings.setAttribute('aria-haspopup','dialog');settings.setAttribute('aria-expanded','false');
  Object.assign(settings.style,{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'40px',height:'40px',padding:'0',border:'1px solid #365a45',borderRadius:'10px',background:'linear-gradient(180deg,#23362d,#1a2823)',color:'#8eefb4',cursor:'pointer',boxSizing:'border-box'});settings.append(gearIcon());row.append(selector,settings);
  ctx.body.style.flex='1 1 auto';if(ctx.body.parentElement)ctx.body.parentElement.style.padding='0';ctx.body.append(row);
  const selectorContext={...ctx,body:selector,prop:k=>k==='part'?'header':ctx.prop(k)};
  const main=factoryrefinementmode.mount(selectorContext);
  let pane=null,contentInstance=null,title=null,negativeInstance=null,negativeSection=null;
  const selected=()=>Math.min(4,Math.max(0,Number(ctx.get('mode'))||0));
  const update=()=>{main.update?.();settings.title=`Настройки · ${MODES[selected()]}`;if(title)title.textContent=`Настройки · ${MODES[selected()]}`;contentInstance?.update?.();negativeInstance?.update?.();};
  settings.addEventListener('click',()=>{
   settings.setAttribute('aria-expanded','true');ctx.onPopupClose=()=>{settings.setAttribute('aria-expanded','false');contentInstance?.destroy?.();contentInstance=null;negativeInstance?.destroy?.();negativeInstance=null;negativeSection=null;title=null;pane=null;};
   pane=popup(ctx,settings,{center:{w:540,h:680},build(box,close){
    box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Настройки режима детализации');Object.assign(box.style,{display:'flex',flexDirection:'column',gap:'16px',padding:'20px',boxSizing:'border-box',border:'1px solid #416e59',borderRadius:'16px',background:'#181f24',color:'#e8eaf0',boxShadow:'0 20px 70px #000a'});
    const head=el('div'),closeButton=el('button','ndk-chip','×'),content=el('div'),scrollArea=el('div');title=el('strong','','');
    Object.assign(head.style,{flex:'0 0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'});title.style.fontSize='16px';title.style.color='#8eefb4';closeButton.type='button';closeButton.setAttribute('aria-label','Закрыть настройки');closeButton.addEventListener('click',close);head.append(title,closeButton);
    Object.assign(scrollArea.style,{display:'flex',flexDirection:'column',gap:'16px',flex:'0 1 auto',minHeight:'0',overflowY:'auto'});Object.assign(content.style,{flex:'0 0 auto',height:'auto',overflowY:'visible'});scrollArea.append(content);box.append(head,scrollArea);
    contentInstance=factoryrefinementmode.mount({...ctx,body:content,prop:k=>k==='part'?'settings':ctx.prop(k)});
    if(content.firstElementChild){content.firstElementChild.style.height='auto';content.firstElementChild.style.flex='0 0 auto';if(content.firstElementChild.firstElementChild){content.firstElementChild.firstElementChild.style.flex='0 0 auto';content.firstElementChild.firstElementChild.style.overflowY='visible';}}
    negativeSection=el('div');const caption=el('strong','','Промт детализации'),negativeBody=el('div');
    Object.assign(negativeSection.style,{display:'flex',flexDirection:'column',gap:'8px',flex:'0 0 226px',minHeight:'0'});caption.style.fontSize='13px';caption.style.color='#80f2a9';
    Object.assign(negativeBody.style,{height:'200px',minHeight:'0',display:'flex',flexDirection:'column',color:'#e8eaf0'});
    negativeBody.style.setProperty('--ndk-field-bg','#192b22');negativeBody.style.setProperty('--ndk-field-border','#3b9e66');
    negativeSection.append(caption,negativeBody);scrollArea.append(negativeSection);
    const negativeContext={...ctx,body:negativeBody,w:{...ctx.w,slots:{value:ctx.w.slots.detail_prompt,enabled:ctx.w.slots.mode}},
     get:k=>ctx.get(k==='value'?'detail_prompt':k==='enabled'?'mode':k),set:(k,v)=>ctx.set(k==='value'?'detail_prompt':k==='enabled'?'mode':k,v),info:k=>ctx.info(k==='value'?'detail_prompt':k==='enabled'?'mode':k),
     prop:k=>k==='counter'?false:k==='spell'?false:k==='placeholder'?'Описание кадра для второго прохода…':k==='weights'?true:ctx.prop(k)};
    negativeInstance=promptWidget.mount(negativeContext);if(negativeBody.firstElementChild)Object.assign(negativeBody.firstElementChild.style,{height:'100%',flex:'1 1 auto'});update();
   }});
   if(pane?.box)Object.assign(pane.box.style,{height:'auto',maxHeight:'calc(100vh - 32px)',top:'50%',transform:'translateY(-50%)'});
  });
  update();return{update,destroy(){pane?.close?.();main.destroy?.();contentInstance?.destroy?.();negativeInstance?.destroy?.();}};
 }
};
