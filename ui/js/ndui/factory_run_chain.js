// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-23: read-only summary of the active task.
import {factoryPlan} from './factory_progress.js';
import {editPlan} from './factory_edit_run.js';
import {upscalePlan} from './factory_upscale_run.js';
import {videoPlan} from './factory_video_run.js';
import {audioPlan} from './factory_audio_run.js';
import {backgroundPlan} from './factory_background_run.js';
import {outpaintPlan} from './factory_outpaint_run.js';
import {readVideo} from './factory_video_params.js';
import {readAudio} from './factory_audio_params.js';
import {readCaption} from './factory_caption.js';
export function runChain(graph,page){
 const nodes=graph?._nodes||graph?.nodes||[],owner=key=>nodes.find(n=>n.properties?.[key]),value=(n,key)=>n?.widgets?.find(w=>w.name===key)?.value;
 let plan=[],save=false;
 if(page==='p1'){
  plan=factoryPlan(graph)||[];
  const pose=nodes.find(n=>n.properties?.acf_pose);if(pose&&Number(value(pose,'value')))plan=[{name:'Поза по референсу'},...plan];
  save=[71,167].some(id=>graph.getNodeById(id)?.mode===0);
 }else if(page==='p_edit'){
  const node=owner('acf_edit');if(node){plan=editPlan(node);save=node.properties.acf_edit.save===true;}
 }else if(page==='p_upscale'){
  const node=owner('acf_upscale_task');if(node){plan=upscalePlan(node);save=node.properties.acf_upscale_task.save===true;}
 }else if(page==='p_video'){
  const node=owner('acf_video');if(node){plan=videoPlan(node);save=readVideo(node).save;}
 }else if(page==='p_audio'){
  const node=owner('acf_audio');if(node){plan=audioPlan(node);save=readAudio(node).save;}
 }else if(page==='p_bg'){
  const node=owner('acf_background');if(node){plan=backgroundPlan(node);save=node.properties.acf_background.save===true;}
 }else if(page==='p_outpaint'){
  const node=owner('acf_outpaint');if(node){plan=outpaintPlan(node);save=node.properties.acf_outpaint.save===true;}
 }else if(page==='p_dataset'){
  const node=owner('acf_caption');if(node){const c=readCaption(node);plan=[{name:c.source==='folder'?'Папка изображений':'Одно фото'},{name:({florence:'Florence',qwen:'Qwen',joy:'JoyCaption'})[c.engine]||c.engine}];save=c.save_txt===true;}
 }
 const stages=plan.map(p=>p.name.replace(/^\d+\s*·\s*/,'').replace(/^Область\s*·\s*/,''));
 if(save&&stages.length)stages.push('Сохранение');return stages;
}
