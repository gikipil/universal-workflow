// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-13.
import {el} from './util.js';
import {factoryProgress} from '../factory_progress.js';
const duration=s=>{s=Math.round(s);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
export const factoryprogress_v037={type:'factoryprogress_v037',label:'Прогресс этапов',icon:'gauge',group:'Run',live:true,noLabel:true,slots:[],props:[],size:{w:344,h:56,minW:220,minH:48},
 mount(ctx){
  const box=el('div','ndk-prog idle'),bar=el('div','ndk-prog-bar'),fill=el('div','ndk-prog-fill'),row=el('div','ndk-prog-row'),left=el('span'),mid=el('span','mid'),right=el('b','end');bar.append(fill);row.append(left,mid,right);box.append(bar,row);ctx.body.append(box);
  Object.assign(row.style,{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto auto',gap:'12px',alignItems:'center'});Object.assign(left.style,{minWidth:'0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'});mid.style.whiteSpace='nowrap';right.style.whiteSpace='nowrap';
  function update(){const tracker=ctx.progress||factoryProgress,s=tracker.snapshot();fill.style.width=`${Math.round(s.pct*1000)/10}%`;left.textContent=s.label;mid.textContent=s.active?s.steps:'';right.textContent=s.active||s.pct>0?`${Math.round(s.pct*100)}%`:'';box.classList.toggle('idle',!s.active&&!s.complete);box.classList.toggle('err',!!tracker.error);box.title=s.label+(s.total?`\nЭтап ${s.stage} из ${s.total}`:'')+`\nПрошло ${duration(s.elapsed)}\nПроцент всей включённой цепочки; счётчик — шаги текущей обработки.`;left.title=box.title;}
  const timer=setInterval(update,300);update();return{update,destroy(){clearInterval(timer);}};
 }
};
