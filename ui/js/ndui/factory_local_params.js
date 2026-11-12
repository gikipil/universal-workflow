// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
const keys=['face','hands','sam','manual'];
const widget=(graph,id,name)=>graph.getNodeById(id)?.widgets?.find(w=>w.name===name);
const get=(graph,id,name)=>widget(graph,id,name)?.value;
function put(graph,id,name,value){const w=widget(graph,id,name);if(!w)throw Error(`Недоступен параметр ${name} узла ${id}`);w.value=value;w.callback?.(value);}
export function readLocal(node){
 const s=node?.properties?.acf_local;if(!s)return null;const g=node.graph;
 return {order:[...s.order],model:Number(get(g,node.id,'index'))||0,seed:get(g,s.seed,'seed'),steps:get(g,s.face.detail,'steps'),sampler:get(g,s.face.detail,'sampler_name'),scheduler:get(g,s.face.detail,'scheduler'),modes:Object.fromEntries(keys.map(k=>{const v=s[k];return[k,{enabled:!!get(g,v.gate,'index'),lora:!!get(g,v.model,'index'),prompt:get(g,v.text,'text'),denoise:get(g,v.detail,'denoise'),guide:get(g,v.detail,'guide_size'),max:get(g,v.detail,'max_size'),feather:get(g,v.detail,'feather'),crop:get(g,v.segs,'crop_factor'),threshold:get(g,v.detect,k==='sam'?'threshold':'threshold'),target:k==='sam'?get(g,s.sam.target,'text'):undefined}];}))};
}
export function applyLocalOrder(node,order){
 const s=node.properties.acf_local,g=node.graph;
 if(!Array.isArray(order)||order.length!==4||new Set(order).size!==4||order.some(k=>!keys.includes(k)))throw Error('Каждый режим должен встречаться в порядке ровно один раз.');
 // All input references are changed together. KJ virtual links resolve the saved
 // names at queue time; no physical links or diffusion settings are rewritten.
 const edits=order.map((k,i)=>[s[k].input,i?`LOCAL_${order[i-1].toUpperCase()}`:'GEN2_RESULT_IMAGE']);edits.push([s.final,`LOCAL_${order.at(-1).toUpperCase()}`]);
 for(const[id]of edits)if(!g.getNodeById(id)?.widgets?.[0])throw Error('Не найден вход локального режима.');
 for(const[id,name]of edits)g.getNodeById(id).widgets[0].value=name;
 for(const[id]of edits)g.getNodeById(id).onRename?.();
 s.order=[...order];
}
export function writeLocal(node,value,touch=()=>{}){
 const v=typeof value==='string'?JSON.parse(value):value,s=node.properties.acf_local,g=node.graph;
 if(!s||![0,1].includes(v.model)||!Number.isSafeInteger(v.seed)||v.seed<0)throw Error('Неверные настройки модели или Seed.');
 const samplers=widget(g,s.face.detail,'sampler_name')?.options?.values,schedulers=widget(g,s.face.detail,'scheduler')?.options?.values;
 if(!Number.isInteger(v.steps)||v.steps<1||v.steps>1000||(Array.isArray(samplers)&&!samplers.includes(v.sampler))||(Array.isArray(schedulers)&&!schedulers.includes(v.scheduler)))throw Error('Проверь настройки сэмплера.');
 for(const k of keys){const m=v.modes?.[k];if(!m||typeof m.enabled!=='boolean'||typeof m.lora!=='boolean'||typeof m.prompt!=='string'||m.prompt.length>20000)throw Error('Неверные настройки режима.');for(const[field,lo,hi]of[['denoise',0.0001,1],['guide',64,4096],['max',64,4096],['feather',0,100],['crop',1,10]])if(!Number.isFinite(m[field])||m[field]<lo||m[field]>hi)throw Error(`Неверное значение ${field}`);if(['guide','max','feather'].some(f=>!Number.isInteger(m[f])))throw Error('Размеры и мягкость края указываются целыми пикселями.');if(m.max<m.guide)throw Error('Максимальный размер не должен быть меньше рабочего.');if(k!=='manual'&&(!Number.isFinite(m.threshold)||m.threshold<0||m.threshold>1))throw Error('Неверный порог обнаружения.');if(k==='sam'&&typeof m.target!=='string')throw Error('Укажи область для SAM.');}
 if(!Array.isArray(v.order)||v.order.length!==4||new Set(v.order).size!==4||v.order.some(k=>!keys.includes(k)))throw Error('Неверный порядок режимов.');
 applyLocalOrder(node,v.order);for(const id of[node.id,s.clip,s.vae,s.loraModel,s.loraClip])put(g,id,'index',v.model);put(g,s.seed,'seed',v.seed);
 for(const k of keys){const m=v.modes[k],d=s[k];put(g,d.gate,'index',Number(m.enabled));put(g,d.maskGate,'index',Number(m.enabled));for(const id of[d.model,d.clip])put(g,id,'index',Number(m.lora));put(g,d.text,'text',m.prompt);for(const field of['steps','sampler_name','scheduler'])put(g,d.detail,field,field==='steps'?v.steps:field==='sampler_name'?v.sampler:v.scheduler);for(const[field,name]of[['denoise','denoise'],['guide','guide_size'],['max','max_size'],['feather','feather']])put(g,d.detail,name,m[field]);put(g,d.segs,'crop_factor',m.crop);if(k!=='manual')put(g,d.detect,'threshold',m.threshold);if(k==='sam')put(g,s.sam.target,'text',m.target);}
 touch(node);return true;
}
export function localParams(node,touch){if(!node?.properties?.acf_local)return[];const proxy={name:'factory_local_config',node,type:'text',options:{},get value(){return JSON.stringify(readLocal(node));},setValue(v){return writeLocal(node,v,touch);}};return[{name:proxy.name,label:'Local detail',ptype:'STRING',widget:proxy,node,virtual:true,multiline:false,control:false,seed:false}];}
