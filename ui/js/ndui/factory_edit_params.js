// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {readUserLoraBank,writeUserLoraBank} from './factory_lora_bank_params.js';
import {powerLoraParams} from './rgthree_power_params.js';
const widget=(node,key)=>node?.widgets?.find(w=>w.name===key);
const adapterFile=(s,kind)=>s.adapterFiles?.[kind]||'Krea2\\krea2_'+kind+'_edit_v2.safetensors';
const profile=node=>{const s=node.properties.acf_edit;return s.backend==='qwen21'?{sampler:s.qwen21.sampler,scale:s.qwen21.scale,refScale:s.qwen21.refScale,shift:null,lora:s.qwen21.lora}:s.backend==='krea'?{sampler:s.kreaSampler,scale:s.scale,refScale:s.refScale,shift:s.kreaShift,lora:s.kreaLora}:{sampler:node.id,scale:s.scale,refScale:s.refScale,shift:s.shift,lora:s.qwenLora};};
export function readEdit(node){const s=node.properties.acf_edit,g=node.graph,p=profile(node),n=g.getNodeById(p.sampler),q=s.qwen21;return{hasAutoMask:!!s.autoMask,samTarget:s.autoMask?widget(g.getNodeById(s.autoMask.text),'text')?.value||'clothing':'clothing',samThreshold:s.autoMask?widget(g.getNodeById(s.autoMask.detect),'threshold')?.value??0.5:0.5,samIterations:s.autoMask?widget(g.getNodeById(s.autoMask.detect),'refine_iterations')?.value??2:2,backend:s.backend||'qwen',adapter:s.adapter||'general',hasQwen21:!!q,steps:widget(n,'steps')?.value,cfg:widget(n,'cfg')?.value,denoise:widget(n,'denoise')?.value,sampler:widget(n,'sampler_name')?.value,scheduler:widget(n,'scheduler')?.value,longest:widget(g.getNodeById(p.scale),'longest_side')?.value,refLongest:widget(g.getNodeById(p.refScale),'longest_side')?.value,double:widget(g.getNodeById(s.double),'value')?.value,shift:p.shift?widget(g.getNodeById(p.shift),'shift')?.value:0,negative:q?widget(g.getNodeById(q.encode),'negative_prompt')?.value||'':'',cacheDevice:q?widget(g.getNodeById(q.cache),'device')?.value||'auto':'auto',cacheDtype:q?widget(g.getNodeById(q.cache),'dtype')?.value||'default':'default',save:s.save===true,maskEnabled:s.maskEnabled===true,maskFile:widget(g.getNodeById(s.maskFile),'image')?.value||'universal-local-empty-mask.png',maskFor:s.maskFor||'',maskBlur:widget(g.getNodeById(s.maskBlur),'blur_radius')?.value??8};}
export function writeEdit(node,value,touch=()=>{}){
 const v=typeof value==='string'?JSON.parse(value):value,s=node.properties.acf_edit,g=node.graph;
 if(!['qwen','krea',...(s.qwen21?['qwen21']:[])].includes(v.backend)||!['general','identity'].includes(v.adapter))throw Error('Выбери способ редактирования.');
 if(v.backend!==(s.backend||'qwen')){s.backend=v.backend;const gate=widget(g.getNodeById(s.gate),'index');gate.value={qwen:0,krea:1,qwen21:2}[v.backend];gate.callback?.(gate.value);touch(node);return true;}
 for(const[k,min,max,integer]of[['steps',1,1000,true],['cfg',0,30,false],['denoise',0,1,false],['longest',256,4096,true],['refLongest',256,4096,true],['shift',0,100,false]])if(!Number.isFinite(v[k])||v[k]<min||v[k]>max||(integer&&!Number.isInteger(v[k])))throw Error('Проверь настройки редактирования.');
 if(typeof v.maskEnabled!=='boolean'||typeof v.maskFile!=='string'||typeof v.maskFor!=='string'||!Number.isFinite(v.maskBlur)||v.maskBlur<0||v.maskBlur>64)throw Error('Проверь настройки маски.');
 if(typeof v.double!=='boolean'||typeof v.save!=='boolean')throw Error('Проверь переключатели редактирования.');
 const p=profile(node),n=g.getNodeById(p.sampler),is21=s.backend==='qwen21';
 for(const[k,field]of[['sampler','sampler_name'],['scheduler','scheduler']])if(!widget(n,field)?.options?.values?.includes(v[k]))throw Error('Выбери сэмплер и шедулер.');
 if(is21&&(typeof v.negative!=='string'||v.negative.length>20000||!['auto','gpu','cpu','off'].includes(v.cacheDevice)||!['default','int8','int4'].includes(v.cacheDtype)))throw Error('Проверь настройки Qwen 2.1.');
 if(s.autoMask&&(typeof v.samTarget!=='string'||!v.samTarget.trim()||v.samTarget.length>500||!Number.isFinite(v.samThreshold)||v.samThreshold<0||v.samThreshold>1||!Number.isInteger(v.samIterations)||v.samIterations<0||v.samIterations>5))throw Error('Проверь настройки автомаски SAM.');
 const changes=[[g.getNodeById(s.maskFile),'image',v.maskFile],[g.getNodeById(s.maskBlur),'blur_radius',v.maskBlur],[n,'steps',v.steps],[n,'cfg',v.cfg],[n,'denoise',v.denoise],[n,'sampler_name',v.sampler],[n,'scheduler',v.scheduler],[g.getNodeById(p.scale),'longest_side',v.longest],[g.getNodeById(p.refScale),'longest_side',v.refLongest],[g.getNodeById(s.double),'value',v.double]];
 if(s.autoMask)changes.push([g.getNodeById(s.autoMask.text),'text',v.samTarget.trim()],[g.getNodeById(s.autoMask.detect),'threshold',v.samThreshold],[g.getNodeById(s.autoMask.detect),'refine_iterations',v.samIterations]);
 if(p.shift)changes.push([g.getNodeById(p.shift),'shift',v.shift]);
 if(is21)changes.push([g.getNodeById(s.qwen21.encode),'negative_prompt',v.negative],[g.getNodeById(s.qwen21.cache),'device',v.cacheDevice],[g.getNodeById(s.qwen21.cache),'dtype',v.cacheDtype]);
 if(changes.some(([n,k])=>!widget(n,k)))throw Error('Не найдены настройки редактора.');
 const adapter=powerLoraParams(g.getNodeById(s.kreaAdapter),touch).find(p=>p.name==='power_lora_1.lora');if(!adapter)throw Error('Не найден адаптер Krea Edit.');
 for(const[n,k,x]of changes){const w=widget(n,k);if(w.value!==x){w.value=x;w.callback?.(x);}}if(!is21)adapter.widget.setValue(adapterFile(s,v.adapter));s.adapter=v.adapter;s.save=v.save;s.maskEnabled=v.maskEnabled;s.maskFor=v.maskFor;touch(node);return true;
}
function adapterFileParam(node,kind,touch){
 const name='factory_edit_'+kind+'_file',s=node.properties.acf_edit;
 const row=()=>powerLoraParams(node.graph.getNodeById(s.kreaAdapter),touch).find(p=>p.name==='power_lora_1.lora');
 const options={get values(){return [...new Set([adapterFile(s,kind),...(row()?.widget.options.values||[])])];}};
 const proxy={name,node,type:'combo',options,get value(){return adapterFile(s,kind);},setValue(value){
  if(typeof value!=='string'||!value.trim())return false;
  const p=row();if(!p)throw Error('Не найден адаптер Krea Edit.');
  if((s.adapter||'general')===kind)p.widget.setValue(value);
  s.adapterFiles={general:adapterFile(s,'general'),identity:adapterFile(s,'identity'),[kind]:value};touch(node);return true;
 }};
 return{name,label:kind==='general'?'General Edit · файл LoRA':'Identity Edit · файл LoRA',ptype:'COMBO',widget:proxy,node,virtual:true};
}
export function editParams(node,touch){if(!node?.properties?.acf_edit)return[];const cfg={name:'factory_edit_config',node,type:'text',options:{},get value(){return JSON.stringify(readEdit(node));},setValue(v){return writeEdit(node,v,touch);}},save={name:'factory_edit_save',node,type:'toggle',options:{},get value(){return node.properties.acf_edit.save===true;},setValue(v){if(typeof v!=='boolean')return false;node.properties.acf_edit.save=v;touch(node);return true;}},bank={name:'factory_edit_loras',node,type:'text',options:{},get value(){const s=node.properties.acf_edit;return JSON.stringify(readUserLoraBank(node.graph.getNodeById(profile(node).lora)));},setValue(v){const s=node.properties.acf_edit;return writeUserLoraBank(node.graph.getNodeById(profile(node).lora),v,touch);}};return[...['general','identity'].map(kind=>adapterFileParam(node,kind,touch)),{name:cfg.name,label:'Edit settings',ptype:'STRING',widget:cfg,node,virtual:true},{name:save.name,label:'Save edit result',ptype:'BOOLEAN',widget:save,node,virtual:true,modeControl:true},{name:bank.name,label:'Edit LoRA bank',ptype:'STRING',widget:bank,node,virtual:true}];}
