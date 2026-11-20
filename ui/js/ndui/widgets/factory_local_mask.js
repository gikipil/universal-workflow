// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
import {el} from './util.js';
import {queueLocalMask} from '../factory_local_mask_run.js';
import {factoryDialog} from './factory_dialog.js';
import {forNode,viewUrl,events,execIdOf} from '../events.js';
export function localImage(node,id){return forNode(node?.graph?.getNodeById(id)).images?.[0];}
// Match the actual IMAGE wire, including KJ virtual links and disabled stage gates.
// Never substitute an arbitrary latest image, a mask, or the upscaled final frame.
export function localStageImage(node,key='manual'){
 const spec=node?.properties?.acf_local,g=node?.graph;if(!spec||!g)return;
 const nodes=g._nodes||g.nodes||[],linkOf=id=>g.getLink?.(id)??g.links?.get?.(id)??g.links?.[id];
 function input(n,name,seen){const i=n?.inputs?.find(i=>!name||i.name===name),l=i?.link!=null?linkOf(i.link):null;return l?resolve(l.origin_id,l.origin_slot??0,seen):null;}
 function resolve(id,slot=0,seen=new Set()){
  const key=String(id)+':'+slot;if(seen.has(key))return null;seen=new Set(seen).add(key);const n=g.getNodeById(id);if(!n)return null;
  if(n.type==='GetNode'){const name=n.widgets?.[0]?.value,set=nodes.find(s=>s.type==='SetNode'&&s.widgets?.[0]?.value===name);return input(set,null,seen);}
  if(n.type==='SetNode')return input(n,null,seen);
  if(n.type==='easy anythingIndexSwitch'){let index=n.widgets?.find(w=>w.name==='index')?.value;const control=n.inputs?.find(i=>i.name==='index');if(control?.link!=null){const endpoint=input(n,'index',seen),id=endpoint?.split(':')[0],provider=id!=null?g.getNodeById(id):null;index=provider?.widgets?.find(w=>w.name==='value')?.value;}if(index==null||!Number.isInteger(Number(index)))return null;return input(n,'value'+Number(index),seen);}
  return key;
 }
 const source=resolve(spec[key]?.input);if(!source)return;
 const matches=[];
 for(const candidate of nodes){
  if(candidate.type!=='PreviewImage'||input(candidate,'images',new Set())!==source)continue;
  const ref=forNode(candidate).images?.[0];if(ref)matches.push({ref,at:events.results.get(execIdOf(candidate))?.at||0,own:candidate.id===spec[key]?.before});
 }
 return matches.sort((a,b)=>b.at-a.at||Number(b.own)-Number(a.own))[0]?.ref;
}
export const manualMaskImage=node=>localStageImage(node,'manual');
export function showLocalMask(ctx,node,key){
 if(typeof key!=='string')key=Object.keys(node.properties.acf_local).find(k=>node.properties.acf_local[k]?.maskPreview===key);
 const controller=new AbortController(),d=factoryDialog(ctx,{title:'Маска · белое будет обработано',width:840,onClose:()=>controller.abort()}),status=el('p'),image=el('img');
 image.hidden=true;image.alt='Маска локальной детализации';Object.assign(image.style,{display:'block',maxWidth:'100%',maxHeight:'70vh',margin:'auto',objectFit:'contain'});d.body.append(status,image);
 const show=ref=>{if(controller.signal.aborted)return;image.onload=()=>{status.textContent='';image.hidden=false;};image.onerror=()=>{status.textContent='Предыдущую маску не удалось загрузить; можно нарисовать новую.';};image.src=viewUrl(ref);};
 if(key==='manual'){
  const path=node.graph.getNodeById(node.properties.acf_local.manual.file)?.widgets?.find(w=>w.name==='image')?.value;
  if(!path){status.textContent='Нарисуй или измени маску';return d;}
  const parts=String(path).replace(/\\/g,'/').split('/'),filename=parts.pop();show({filename,subfolder:parts.join('/'),type:'input'});return d;
 }
 const ref=localStageImage(node,key)||localImage(node,node.properties.acf_local.sam.before);
 if(!ref){status.textContent='Сначала получи кадр для просмотра маски.';return d;}
 status.textContent='Подготовка выделения…';queueLocalMask(node,key,ref,{signal:controller.signal,onStatus:text=>{if(!controller.signal.aborted)status.textContent=text;}}).then(show).catch(error=>{if(!controller.signal.aborted)status.textContent=error.message;});return d;
}
export function editLocalMask(ctx,node,onSaved=()=>{}){
 const spec=node.properties.acf_local,ref=manualMaskImage(node),d=factoryDialog(ctx,{title:'🖌️ Ручная маска',width:980});
 if(!ref){d.body.append(el('p','','Сначала получи кадр с выключенной ручной маской. Затем открой это окно и выдели нужные участки.'));return d;}
 const hint=el('p','','Закрась участки для детализации. Маска привязана к этому кадру: после смены композиции нарисуй её заново.'),tools=el('div'),size=el('input'),erase=el('input'),clear=el('button','ndk-chip','Очистить'),save=el('button','ndk-chip','Сохранить маску'),status=el('span'),wrap=el('div'),base=el('canvas'),paint=el('canvas');
 Object.assign(tools.style,{display:'flex',gap:'12px',alignItems:'center',flexWrap:'wrap'});size.type='range';size.min='2';size.max='200';size.value='45';size.setAttribute('aria-label','Размер кисти');erase.type='checkbox';const eraseLabel=el('label','','Ластик ');eraseLabel.append(erase);tools.append(el('span','','Кисть'),size,eraseLabel,clear);d.body.append(hint,tools,wrap);d.footer.append(status,save);
 Object.assign(wrap.style,{position:'relative',marginTop:'12px',maxWidth:'100%',marginInline:'auto'});Object.assign(base.style,{display:'block',width:'100%',height:'auto'});Object.assign(paint.style,{position:'absolute',inset:'0',width:'100%',height:'100%',touchAction:'none',opacity:'.5',cursor:'crosshair'});wrap.append(base,paint);
 const mask=document.createElement('canvas'),image=new Image(),draw=()=>{const out=paint.getContext('2d');out.clearRect(0,0,paint.width,paint.height);out.drawImage(mask,0,0);out.globalCompositeOperation='source-in';out.fillStyle='#da8cff';out.fillRect(0,0,paint.width,paint.height);out.globalCompositeOperation='source-over';};let down=false,last=null,ready=false;
 image.onload=async()=>{for(const c of[base,paint,mask]){c.width=image.naturalWidth;c.height=image.naturalHeight;}wrap.style.width=`min(100%,${Math.round(560*image.naturalWidth/image.naturalHeight)}px)`;base.getContext('2d').drawImage(image,0,0);const old=node.graph.getNodeById(spec.manual.file)?.widgets?.find(w=>w.name==='image')?.value;
  if(old&&old!=='universal-local-empty-mask.png'){try{const m=new Image();m.src=`/view?filename=${encodeURIComponent(old)}&type=input`;await m.decode();const c=document.createElement('canvas');c.width=mask.width;c.height=mask.height;const mc=c.getContext('2d');mc.drawImage(m,0,0,c.width,c.height);const pixels=mc.getImageData(0,0,c.width,c.height);for(let i=0;i<pixels.data.length;i+=4){pixels.data[i+3]=pixels.data[i];pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;}mask.getContext('2d').putImageData(pixels,0,0);}catch{status.textContent='Предыдущую маску не удалось загрузить; можно нарисовать новую.';}}
  ready=true;draw();};image.src=viewUrl(ref);
 function point(e){const r=paint.getBoundingClientRect();return[(e.clientX-r.left)*mask.width/r.width,(e.clientY-r.top)*mask.height/r.height];}
 function stroke(e){if(!down||!ready)return;const p=point(e),c=mask.getContext('2d');c.globalCompositeOperation=erase.checked?'destination-out':'source-over';c.strokeStyle='white';c.fillStyle='white';c.lineWidth=Number(size.value)*mask.width/Math.max(1,paint.clientWidth);c.lineCap='round';c.lineJoin='round';if(last){c.beginPath();c.moveTo(...last);c.lineTo(...p);c.stroke();}else{c.beginPath();c.arc(...p,c.lineWidth/2,0,Math.PI*2);c.fill();}last=p;draw();}
 paint.addEventListener('pointerdown',e=>{e.preventDefault();paint.setPointerCapture(e.pointerId);down=true;last=null;stroke(e);});paint.addEventListener('pointermove',stroke);for(const name of['pointerup','pointercancel','lostpointercapture'])paint.addEventListener(name,()=>{down=false;last=null;});clear.addEventListener('click',()=>{mask.getContext('2d').clearRect(0,0,mask.width,mask.height);draw();});
 save.addEventListener('click',async()=>{if(!ready)return;save.disabled=true;try{const output=document.createElement('canvas');output.width=mask.width;output.height=mask.height;const c=output.getContext('2d');c.fillStyle='black';c.fillRect(0,0,output.width,output.height);c.drawImage(mask,0,0);const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));if(!blob)throw Error('Не удалось сохранить маску.');const form=new FormData();form.append('image',blob,`local-mask-${Date.now()}.png`);form.append('type','input');form.append('subfolder','universal-masks');const response=await fetch('/upload/image',{method:'POST',body:form});if(!response.ok)throw Error('Не удалось загрузить маску.');const f=await response.json(),name=[f.subfolder,f.name].filter(Boolean).join('/'),target=node.graph.getNodeById(spec.manual.file),w=target.widgets.find(w=>w.name==='image');w.value=name;w.callback?.(name);node.graph.change?.();node.graph.setDirtyCanvas?.(true,false);onSaved(name);d.close();}catch(error){status.textContent=error.message;}finally{save.disabled=false;}});return d;
}
