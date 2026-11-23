// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
import {el} from './util.js';
import {queueLocalMask} from '../factory_local_mask_run.js';
import {factoryDialog} from './factory_dialog.js';
import {openEditMask} from './factory_edit_mask.js';
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
 const spec=node.properties.acf_local,ref=manualMaskImage(node);
 if(!ref){const d=factoryDialog(ctx,{title:'🖌️ Ручная маска',width:980});d.body.append(el('p','','Сначала получи кадр с выключенной ручной маской. Затем открой это окно и выдели нужные участки.'));return d;}
 const target=node.graph.getNodeById(spec.manual.file),widget=target?.widgets?.find(w=>w.name==='image');
 if(!widget){const d=factoryDialog(ctx,{title:'🖌️ Ручная маска',width:980});d.body.append(el('p','','Нода пропала. Привяжите её заново.'));return d;}
 const write=name=>{widget.value=name;widget.callback?.(name);node.graph.change?.();node.graph.setDirtyCanvas?.(true,false);onSaved(name);};
 return openEditMask(ctx,{
  imageFile:ref,maskFile:widget.value,
  hintText:'Закрась участки для детализации. Маска привязана к этому кадру: после смены композиции нарисуй её заново.',
  uploadSubfolder:'universal-masks',uploadPrefix:'local-mask',
  onSave:name=>{const current=manualMaskImage(node);if(!current||current.filename!==ref.filename||(current.subfolder||'')!==(ref.subfolder||'')||(current.type||'output')!==(ref.type||'output'))throw Error('Исходник изменился. Нарисуй маску на новом фото.');write(name);},
  onClear:()=>write('universal-local-empty-mask.png'),
 });
}
