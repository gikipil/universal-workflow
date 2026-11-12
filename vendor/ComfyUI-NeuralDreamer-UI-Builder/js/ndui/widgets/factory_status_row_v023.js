// Read-only queue status and right-aligned native save toggle.
import {el} from './util.js';
import {toggle} from './inputs.js';
import {events} from '../events.js';
export const factorysavetoggle_v023={...toggle,type:'factorysavetoggle_v023',label:'Сохранение справа',
 mount(ctx){const instance=toggle.mount(ctx);
  const align=()=>{const row=ctx.body.querySelector('.ndk-tg'),sw=row?.querySelector('.ndk-tg-sw'),text=row?.querySelector('.ndk-tg-txt');if(!row||!sw||!text)return;row.style.width='100%';row.style.justifyContent='space-between';row.style.gap='12px';text.style.order='0';text.style.minWidth='0';sw.style.order='1';sw.style.marginLeft='auto';};
  align();return{...instance,update(){instance.update?.();align();}};
 }
};
export const factoryqueuestatus_v023={type:'factoryqueuestatus_v023',label:'Очередь',icon:'queue',group:'Run',live:true,noLabel:true,slots:[],props:[],size:{w:184,h:56,minW:140,minH:48},
 mount(ctx){const root=el('div'),top=el('div'),number=el('strong'),label=el('span','','В очереди'),detail=el('span');
  Object.assign(root.style,{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2px',width:'100%',lineHeight:'1.1'});
  Object.assign(top.style,{display:'flex',alignItems:'center',gap:'8px'});Object.assign(number.style,{fontSize:'20px',fontWeight:'700',color:'#65e3f4',fontVariantNumeric:'tabular-nums'});label.style.fontSize='12px';detail.style.fontSize='10px';detail.style.color='#a4adbf';top.append(number,label);root.append(top,detail);ctx.body.append(root);
  const show=()=>{const pending=Math.max(0,Number(events.queue?.pending)||0),busy=!!events.run?.active;number.textContent=String(pending);detail.textContent=busy?'1 выполняется':pending?'Ожидают запуска':'Нет активных заданий';root.setAttribute('aria-label',`В очереди ${pending}${busy?', 1 выполняется':''}`);};show();return{update:show};
 }
};
