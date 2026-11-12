// User-facing task navigation. Only implemented tasks are shown.
import {el,icon,popup} from './util.js';
export const factorytaskbar={
 type:'factorytaskbar',label:'Вкладки задач',icon:'layers',group:'Layout',live:true,
 slots:[],size:{w:1152,h:64,minW:400,minH:64},props:[],fill:true,
 mount(ctx){
  const row=el('div'),line=el('div'),tab=el('button'),settings=el('button');
  Object.assign(row.style,{position:'relative',display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'16px',width:'100%',height:'100%',padding:'6px 6px 0',boxSizing:'border-box',isolation:'isolate'});
  Object.assign(line.style,{position:'absolute',left:'6px',right:'6px',bottom:'0',height:'1px',zIndex:'-1'});
  tab.type='button';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','true');tab.setAttribute('aria-label','Генерация — текущая задача');
  Object.assign(tab.style,{position:'relative',display:'inline-flex',alignItems:'center',gap:'10px',height:'48px',padding:'0 26px',border:'1.5px solid transparent',borderBottom:'0',borderRadius:'18px 18px 0 0',font:'inherit',fontWeight:'700',fontSize:'16px',letterSpacing:'.15px',cursor:'default',whiteSpace:'nowrap',transition:'box-shadow 160ms ease'});
  tab.append(icon('image',19),el('span','','Генерация'));
  settings.type='button';settings.setAttribute('aria-label','Настройки интерфейса');settings.setAttribute('aria-haspopup','dialog');settings.setAttribute('aria-expanded','false');
  Object.assign(settings.style,{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'8px',height:'38px',marginBottom:'6px',padding:'0 15px',border:'1px solid #3f505a',borderRadius:'10px',background:'linear-gradient(180deg,#222b33,#171d24)',color:'#c8d3dc',font:'inherit',fontWeight:'600',fontSize:'14px',cursor:'pointer',transition:'border-color 140ms ease,background 140ms ease'});
  settings.append(icon('settings',16),el('span','','Настройки'));
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
  settings.addEventListener('click',()=>{
   settings.setAttribute('aria-expanded','true');ctx.onPopupClose=()=>settings.setAttribute('aria-expanded','false');
   popup(ctx,settings,{width:320,maxH:320,build(box,close){
    box.setAttribute('role','dialog');box.setAttribute('aria-label','Настройки интерфейса');Object.assign(box.style,{padding:'16px',boxSizing:'border-box',border:'1px solid #3b5960',borderRadius:'14px',background:'#181f27',color:'#e8eaf0',boxShadow:'0 12px 36px #0008'});
    const head=el('div'),title=el('strong','','Настройки интерфейса'),x=el('button','ndk-chip','×');x.type='button';x.setAttribute('aria-label','Закрыть настройки');x.addEventListener('click',close);Object.assign(head.style,{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px'});head.append(title,x);
    const label=el('div','','Свечение активной вкладки');label.style.marginBottom='10px';label.style.fontSize='13px';
    const choices=el('div');Object.assign(choices.style,{display:'flex',gap:'6px'});
    const buttons=[];
    for(const[value,text]of[['off','Выкл.'],['soft','Мягкое'],['bright','Яркое']]){const button=el('button','ndk-chip',text);button.type='button';button.style.flex='1';button.setAttribute('aria-pressed',String(strength()===value));button.classList.toggle('on',strength()===value);button.addEventListener('click',()=>{ctx.setProp('glow',value);show();for(const[b,v]of buttons){b.classList.toggle('on',v===value);b.setAttribute('aria-pressed',String(v===value));}});buttons.push([button,value]);choices.append(button);}
    box.append(head,label,choices);
   }});
  });
  show();return{update:show};
 }
};
