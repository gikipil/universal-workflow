// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
// Resolve only the selected upscale branches before submitting a task.
export function rewriteUpscale(output,spec){
 if(!spec)return output;const redirects=new Map();
 for(const id of[spec.enabled,spec.controller,spec.simple,spec.size]){const n=output[id];if(!n)continue;const index=Number(n.inputs.index),value=n.inputs['value'+index];if(!Number.isInteger(index)||!Array.isArray(value))throw Error('Не найден выбранный режим апскейла.');redirects.set(String(id),value);}
 for(const n of Object.values(output))for(const[k,input]of Object.entries(n.inputs||{})){let v=input;const seen=new Set();while(Array.isArray(v)&&v.length===2&&redirects.has(String(v[0]))){if(seen.has(String(v[0])))throw Error('Зацикленный переключатель апскейла.');seen.add(String(v[0]));v=redirects.get(String(v[0]));}n.inputs[k]=v;}return output;
}
export function upscaleTaskParams(node,touch){const s=node?.properties?.acf_upscale_task;if(!s)return[];const w={name:'factory_upscale_save',node,type:'toggle',options:{},get value(){return s.save===true;},setValue(v){if(typeof v!=='boolean')return false;s.save=v;touch(node);return true;}};return[{name:w.name,label:'Save upscaled result',ptype:'BOOLEAN',widget:w,node,virtual:true,modeControl:true}];}
export function upscaleStage(graph,node,title='Апскейл'){
 const s=node.properties.acf_upscale,read=(id,key)=>graph.getNodeById(id)?.widgets?.find(w=>w.name===key)?.value,mode=Number(read(node.id,'index')),simple=Number(read(s.simple,'index'));
 const sample=mode===0?(simple?(Number(read(s.size,'index'))?s.targetLong:s.targetFactor):s.simpleSample):mode===1?s.ultimate:s.seedvr;
 return{name:title+' · '+['Simple','Ultimate','SeedVR'][mode],sample:String(sample),ids:new Set(s.nodes.map(String)),finish:[String(s.after)],local:mode===1,multiProgress:mode===2,unit:mode===1?'тайл':undefined,runningLabel:['увеличение','перерисовка тайлов','восстановление и увеличение'][mode]};
}
