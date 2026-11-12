// Compact generation selector with mode-specific settings in a centred popup.
import {el,popup} from './util.js';
import {factorygenerationmode,MODES} from './factory_generation_mode.js';
function gearIcon(){const gear=el('span');Object.assign(gear.style,{display:'inline-flex',width:'20px',height:'20px',flex:'0 0 20px'});
 const points=Array.from({length:32},(_,i)=>{const a=i/32*Math.PI*2-Math.PI/32,r=i%4<2?9.5:7.6;return`${(12+Math.cos(a)*r).toFixed(2)},${(12+Math.sin(a)*r).toFixed(2)}`;}).join(' ');
 gear.innerHTML=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><polygon points="${points}"/><circle cx="12" cy="12" r="3.1"/></svg>`;return gear;
}
export const factorygenmode_v027={...factorygenerationmode,type:'factorygenmode_v027',label:'Способ генерации и настройки',noLabel:true,fill:true,size:{w:312,h:48,minW:270,minH:48},
 mount(ctx){const row=el('div'),selector=el('div'),settings=el('button');
  Object.assign(row.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr) 40px',gap:'10px',alignItems:'center',width:'100%',height:'100%'});
  Object.assign(selector.style,{minWidth:'0',height:'38px'});
  settings.type='button';settings.setAttribute('aria-label','Настройки выбранного режима генерации');settings.setAttribute('aria-haspopup','dialog');settings.setAttribute('aria-expanded','false');
  Object.assign(settings.style,{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'40px',height:'40px',padding:'0',border:'1px solid #365a45',borderRadius:'10px',background:'linear-gradient(180deg,#23362d,#1a2823)',color:'#8eefb4',cursor:'pointer',boxSizing:'border-box'});settings.append(gearIcon());row.append(selector,settings);
  ctx.body.style.flex='1 1 auto';if(ctx.body.parentElement)ctx.body.parentElement.style.padding='0';ctx.body.append(row);
  const selectorContext={...ctx,body:selector,prop:k=>k==='part'?'header':ctx.prop(k)};
  const main=factorygenerationmode.mount(selectorContext);
  let pane=null,contentInstance=null,title=null;
  const selected=()=>Math.min(2,Math.max(0,Number(ctx.get('mode'))||0));
  const update=()=>{main.update?.();settings.title=`Настройки · ${MODES[selected()]}`;if(title)title.textContent=`Настройки · ${MODES[selected()]}`;contentInstance?.update?.();};
  settings.addEventListener('click',()=>{
   settings.setAttribute('aria-expanded','true');ctx.onPopupClose=()=>{settings.setAttribute('aria-expanded','false');contentInstance?.destroy?.();contentInstance=null;title=null;pane=null;};
   pane=popup(ctx,settings,{center:{w:540,h:[330,400,540][selected()]},build(box,close){
    box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Настройки режима генерации');Object.assign(box.style,{display:'flex',flexDirection:'column',gap:'16px',padding:'20px',boxSizing:'border-box',border:'1px solid #416e59',borderRadius:'16px',background:'#181f24',color:'#e8eaf0',boxShadow:'0 20px 70px #000a'});
    const head=el('div'),closeButton=el('button','ndk-chip','×'),content=el('div');title=el('strong','','');
    Object.assign(head.style,{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'});title.style.fontSize='16px';title.style.color='#8eefb4';closeButton.type='button';closeButton.setAttribute('aria-label','Закрыть настройки');closeButton.addEventListener('click',close);head.append(title,closeButton);
    Object.assign(content.style,{flex:'1 1 auto',minHeight:'0',overflowY:'auto'});box.append(head,content);
    contentInstance=factorygenerationmode.mount({...ctx,body:content,prop:k=>k==='part'?'settings':ctx.prop(k)});update();
   }});
  });
  update();return{update,destroy(){pane?.close?.();main.destroy?.();contentInstance?.destroy?.();}};
 }
};
