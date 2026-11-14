// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {el} from './util.js';
import {factoryProgress} from '../factory_progress.js';
const duration=s=>{s=Math.round(s);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
let tooltipId=0;
export const factoryprogress_v037={type:'factoryprogress_v037',label:'Прогресс этапов',icon:'gauge',group:'Run',live:true,noLabel:true,slots:[],props:[],size:{w:344,h:56,minW:220,minH:48},
 mount(ctx){
  const box=el('div','ndk-prog idle'),bar=el('div','ndk-prog-bar'),fill=el('div','ndk-prog-fill'),row=el('div','ndk-prog-row'),left=el('span'),mid=el('span','mid'),right=el('b','end');bar.append(fill);row.append(left,mid,right);box.append(bar,row);ctx.body.append(box);
  Object.assign(row.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto auto',gap:'12px',alignItems:'center'});Object.assign(left.style,{minWidth:'0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'});mid.style.whiteSpace='nowrap';right.style.whiteSpace='nowrap';
  const hint=el('div');hint.id=`acf-progress-hint-${++tooltipId}`;hint.setAttribute('role','tooltip');hint.hidden=true;Object.assign(hint.style,{position:'fixed',display:'none',maxWidth:'min(360px,calc(100vw - 24px))',boxSizing:'border-box',padding:'12px 14px',border:'1px solid #357184',borderRadius:'10px',background:'#17212b',color:'#e8eaf0',boxShadow:'0 10px 30px #0008',fontFamily:'Inter,system-ui,sans-serif',fontSize:'13px',lineHeight:'1.5',whiteSpace:'pre-line',pointerEvents:'none',zIndex:'1150000'});document.body.append(hint);box.tabIndex=0;box.setAttribute('aria-describedby',hint.id);
  let hovered=false,focused=false,visible=false,closed=false,delay=null;
  function position(){if(!visible)return;const r=box.getBoundingClientRect(),h=hint.getBoundingClientRect(),vw=window.innerWidth||document.documentElement.clientWidth,vh=window.innerHeight||document.documentElement.clientHeight;hint.style.left=Math.max(12,Math.min(vw-h.width-12,r.left+r.width/2-h.width/2))+'px';hint.style.top=Math.max(12,Math.min(vh-h.height-12,r.top-h.height-10>=12?r.top-h.height-10:r.bottom+10))+'px';}
  function hide(){clearTimeout(delay);delay=null;visible=false;hint.hidden=true;hint.style.display='none';}
  function show(){delay=null;if(closed||(!hovered&&!focused))return;visible=true;hint.hidden=false;hint.style.display='block';position();}
  box.addEventListener('pointerenter',()=>{hovered=true;clearTimeout(delay);delay=setTimeout(show,300);});box.addEventListener('pointerleave',()=>{hovered=false;if(!focused)hide();});box.addEventListener('focus',()=>{focused=true;clearTimeout(delay);show();});box.addEventListener('blur',()=>{focused=false;if(!hovered)hide();});box.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();hide();}});window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
  const text=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
  function update(){const tracker=ctx.progress||factoryProgress,s=tracker.snapshot();fill.style.width=`${Math.round(s.pct*1000)/10}%`;text(left,s.label);text(mid,s.active?s.steps:'');text(right,s.active||s.pct>0?`${Math.round(s.pct*100)}%`:'');box.classList.toggle('idle',!s.active&&!s.complete);box.classList.toggle('err',!!tracker.error);text(hint,s.label+(s.total?`\nЭтап ${s.stage} из ${s.total}`:'')+`\nПрошло ${duration(s.elapsed)}\nПроцент всей включённой цепочки; счётчик — шаги текущей обработки.`);position();}
  const timer=setInterval(update,300);update();return{update,destroy(){closed=true;clearInterval(timer);hide();window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);hint.remove();}};
 }
};
