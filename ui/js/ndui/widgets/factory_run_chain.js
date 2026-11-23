// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-23: live execution chain before the run button.
import {app} from '../../../../scripts/app.js';
import {el} from './util.js';
import {runChain} from '../factory_run_chain.js';
import {translateInterface} from '../factory_locale.js';
import {fitFactoryContent} from './factory_content_height.js';
export const factoryrunchain={type:'factoryrunchain',label:'Цепочка обработки',group:'Run',live:true,noLabel:true,fill:true,slots:[],props:[],size:{w:1152,h:44,minW:270,minH:44},mount(ctx){
 const root=el('section'),label=el('small'),list=el('div');root.setAttribute('role','group');list.setAttribute('role','list');root.style.cssText='box-sizing:border-box;width:100%;height:auto;min-height:44px;display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:8px 12px;border:1px solid var(--ndk-border,#365a45);border-radius:10px;background:var(--ndk-s1,#181c23)';label.style.cssText='color:var(--ndk-muted,#a4adbf);font-size:12px;white-space:nowrap';list.style.cssText='display:flex;align-items:center;flex-wrap:wrap;gap:8px;min-width:0';root.append(label,list);ctx.body.append(root);if(ctx.body.parentElement)ctx.body.parentElement.style.padding='0';const sizing=fitFactoryContent(ctx,root,{min:44});let stamp='';
 function update(){const language=ctx.language?.()||'ru',tr=s=>translateInterface(s,language);let stages;try{stages=runChain(app.rootGraph||app.graph,ctx.w.page);}catch{stages=[];}const next=JSON.stringify([language,stages]);if(next===stamp)return;stamp=next;label.textContent=tr('Будет выполнено');root.setAttribute('aria-label',label.textContent);list.replaceChildren();if(!stages.length)stages=['Не удалось определить цепочку'];stages.forEach((stage,i)=>{if(i){const arrow=el('span','','→');arrow.setAttribute('aria-hidden','true');arrow.style.color='var(--ndk-muted,#a4adbf)';list.append(arrow);}const chip=el('span','',tr(stage));chip.setAttribute('role','listitem');chip.style.cssText='color:var(--ndk-text,#e8eaf0);font-size:13px;font-weight:600;line-height:20px;overflow-wrap:anywhere';list.append(chip);});sizing.update(44);}
 const timer=setInterval(update,300);update();return{update,resize:()=>sizing.update(),destroy(){clearInterval(timer);sizing.destroy();}};
}};
