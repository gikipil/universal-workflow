// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-13.
import {powerLoraParams} from './rgthree_power_params.js';
const get=(n,id,key)=>n.graph.getNodeById(id)?.widgets?.find(w=>w.name===key);
const fields=['detect_hand','detect_body','detect_face','resolution'];
const rows=(node)=>node?.widgets?.filter(w=>/^lora_\d+$/.test(w.name)&&w.value&&typeof w.value==='object')||[];
export function readPose(node){const s=node.properties.acf_pose,row=rows(node.graph.getNodeById(s.loras[0]))[0];return{enabled:!!get(node,node.id,'value')?.value,strength:row?.value.strength??1,...Object.fromEntries(fields.map(k=>[k,get(node,s.dw,k)?.value]))};}
export function writePose(node,value,touch=()=>{}){
 const v=typeof value==='string'?JSON.parse(value):value,s=node.properties.acf_pose;
 if(typeof v.enabled!=='boolean'||!Number.isFinite(v.strength)||v.strength<0||v.strength>2||!Number.isInteger(v.resolution)||v.resolution<64||v.resolution>2048||v.resolution%64||['detect_hand','detect_body','detect_face'].some(k=>!['enable','disable'].includes(v[k]))||v.detect_body!=='enable')throw Error('Проверь настройки позы. Разрешение — кратное 64, сила — от 0 до 2.');
 const targets=s.loras.map(id=>[node.graph.getNodeById(id),rows(node.graph.getNodeById(id))[0]]),edits=[[node.id,'value',Number(v.enabled)],...fields.map(k=>[s.dw,k,v[k]])];
 if(targets.some(([,row])=>!row)||edits.some(([id,k])=>!get(node,id,k))||!node.graph.getNodeById(s.preview))throw Error('Не найдены ноды режима позы.');
 for(const[id,k,x]of edits){const w=get(node,id,k);if(w.value!==x){w.value=x;w.callback?.(x);}}
 for(const[n,row]of targets){row.value.on=v.enabled;row.value.strength=v.strength;touch(n);}
 // A disabled preview must not independently execute the reference branch.
 node.graph.getNodeById(s.preview).mode=v.enabled?0:4;touch(node);return true;
}
export function poseParams(node,touch){if(!node?.properties?.acf_pose)return[];const s=node.properties.acf_pose,master=node.graph.getNodeById(s.loras[0]),file=powerLoraParams(master,touch).find(p=>p.name==='power_lora_1.lora');
 const config={name:'factory_pose_config',node,type:'text',options:{},get value(){return JSON.stringify(readPose(node));},setValue(v){return writePose(node,v,touch);}};
 const result=[{name:config.name,label:'Pose settings',ptype:'STRING',widget:config,node,virtual:true,multiline:false,control:false,seed:false}];
 if(file){const proxy={name:'factory_pose_lora',node,type:'combo',options:file.widget.options,get value(){return file.widget.value;},setValue(v){if(typeof v!=='string'||!v.trim())return false;const params=s.loras.map(id=>powerLoraParams(node.graph.getNodeById(id),touch).find(p=>p.name==='power_lora_1.lora'));if(params.some(p=>!p))throw Error('Не найден адаптер позы.');for(const p of params)p.widget.setValue(v);touch(node);return true;}};result.push({...file,name:proxy.name,label:'OpenPose · adapter',widget:proxy,node});}
 return result;
}
