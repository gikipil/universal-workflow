// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {readUserLoraBank,writeUserLoraBank} from './factory_lora_bank_params.js';
import {powerLoraParams} from './rgthree_power_params.js';
const widget=(node,key)=>node?.widgets?.find(w=>w.name===key);
const adapterFile=(s,kind)=>s.adapterFiles?.[kind]||'Krea2\\krea2_'+kind+'_edit_v2.safetensors';
const active=node=>node.properties.acf_edit.backend==='krea'?node.graph.getNodeById(node.properties.acf_edit.kreaSampler):node;
export function readEdit(node){const s=node.properties.acf_edit,g=node.graph,n=active(node);return{backend:s.backend||'qwen',adapter:s.adapter||'general',steps:widget(n,'steps')?.value,cfg:widget(n,'cfg')?.value,denoise:widget(n,'denoise')?.value,sampler:widget(n,'sampler_name')?.value,scheduler:widget(n,'scheduler')?.value,longest:widget(g.getNodeById(s.scale),'longest_side')?.value,refLongest:widget(g.getNodeById(s.refScale),'longest_side')?.value,double:widget(g.getNodeById(s.double),'value')?.value,shift:widget(g.getNodeById(s.backend==='krea'?s.kreaShift:s.shift),'shift')?.value,save:s.save===true,maskEnabled:s.maskEnabled===true,maskFile:widget(g.getNodeById(s.maskFile),'image')?.value||'universal-local-empty-mask.png',maskFor:s.maskFor||'',maskBlur:widget(g.getNodeById(s.maskBlur),'blur_radius')?.value??8};}
export function writeEdit(node,value,touch=()=>{}){
 const v=typeof value==='string'?JSON.parse(value):value,s=node.properties.acf_edit,g=node.graph;
 if(!['qwen','krea'].includes(v.backend)||!['general','identity'].includes(v.adapter))throw Error('Выбери способ редактирования.');
 if(v.backend!==(s.backend||'qwen')){s.backend=v.backend;const gate=widget(g.getNodeById(s.gate),'index');gate.value=v.backend==='krea'?1:0;gate.callback?.(gate.value);touch(node);return true;}
 for(const[k,min,max,integer]of[['steps',1,1000,true],['cfg',0,30,false],['denoise',0,1,false],['longest',256,4096,true],['refLongest',256,4096,true],['shift',0,100,false]])if(!Number.isFinite(v[k])||v[k]<min||v[k]>max||(integer&&!Number.isInteger(v[k])))throw Error('Проверь настройки редактирования.');
 if(typeof v.maskEnabled!=='boolean'||typeof v.maskFile!=='string'||typeof v.maskFor!=='string'||!Number.isFinite(v.maskBlur)||v.maskBlur<0||v.maskBlur>64)throw Error('Проверь настройки маски.');
 if(typeof v.double!=='boolean'||typeof v.save!=='boolean')throw Error('Проверь переключатели редактирования.');
 const n=active(node);
 for(const[k,field]of[['sampler','sampler_name'],['scheduler','scheduler']])if(!widget(n,field)?.options?.values?.includes(v[k]))throw Error('Выбери сэмплер и шедулер.');
 const changes=[[g.getNodeById(s.maskFile),'image',v.maskFile],[g.getNodeById(s.maskBlur),'blur_radius',v.maskBlur],[n,'steps',v.steps],[n,'cfg',v.cfg],[n,'denoise',v.denoise],[n,'sampler_name',v.sampler],[n,'scheduler',v.scheduler],[g.getNodeById(s.scale),'longest_side',v.longest],[g.getNodeById(s.refScale),'longest_side',v.refLongest],[g.getNodeById(s.double),'value',v.double],[g.getNodeById(s.backend==='krea'?s.kreaShift:s.shift),'shift',v.shift]];
 if(changes.some(([n,k])=>!widget(n,k)))throw Error('Не найдены настройки редактора.');
 const adapter=powerLoraParams(g.getNodeById(s.kreaAdapter),touch).find(p=>p.name==='power_lora_1.lora');if(!adapter)throw Error('Не найден адаптер Krea Edit.');
 for(const[n,k,x]of changes){const w=widget(n,k);if(w.value!==x){w.value=x;w.callback?.(x);}}adapter.widget.setValue(adapterFile(s,v.adapter));s.adapter=v.adapter;s.save=v.save;s.maskEnabled=v.maskEnabled;s.maskFor=v.maskFor;touch(node);return true;
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
export function editParams(node,touch){if(!node?.properties?.acf_edit)return[];const cfg={name:'factory_edit_config',node,type:'text',options:{},get value(){return JSON.stringify(readEdit(node));},setValue(v){return writeEdit(node,v,touch);}},save={name:'factory_edit_save',node,type:'toggle',options:{},get value(){return node.properties.acf_edit.save===true;},setValue(v){if(typeof v!=='boolean')return false;node.properties.acf_edit.save=v;touch(node);return true;}},bank={name:'factory_edit_loras',node,type:'text',options:{},get value(){const s=node.properties.acf_edit;return JSON.stringify(readUserLoraBank(node.graph.getNodeById(s.backend==='krea'?s.kreaLora:s.qwenLora)));},setValue(v){const s=node.properties.acf_edit;return writeUserLoraBank(node.graph.getNodeById(s.backend==='krea'?s.kreaLora:s.qwenLora),v,touch);}};return[...['general','identity'].map(kind=>adapterFileParam(node,kind,touch)),{name:cfg.name,label:'Edit settings',ptype:'STRING',widget:cfg,node,virtual:true},{name:save.name,label:'Save edit result',ptype:'BOOLEAN',widget:save,node,virtual:true,modeControl:true},{name:bank.name,label:'Edit LoRA bank',ptype:'STRING',widget:bank,node,virtual:true}];}
