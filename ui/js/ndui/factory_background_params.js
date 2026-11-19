// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-13.
const fields=['model','sensitivity','process_res','mask_blur','mask_offset','refine_foreground'];
const find=(n,key)=>n.widgets?.find(w=>w.name===key);
export function readBackground(node){return{...Object.fromEntries(fields.map(k=>[k,find(node,k)?.value])),save:node.properties.acf_background.save===true};}
export function writeBackground(node,value,touch=()=>{}){const v=typeof value==='string'?JSON.parse(value):value;
 const choices=find(node,'model')?.options?.values,models=typeof choices==='function'?choices():choices;
 if(!Array.isArray(models)||!models.includes(v.model)||!Number.isFinite(v.sensitivity)||v.sensitivity<0||v.sensitivity>1||!Number.isInteger(v.process_res)||v.process_res<256||v.process_res>2048||v.process_res%8||!Number.isInteger(v.mask_blur)||v.mask_blur<0||v.mask_blur>64||!Number.isInteger(v.mask_offset)||v.mask_offset< -64||v.mask_offset>64||typeof v.refine_foreground!=='boolean'||typeof v.save!=='boolean'||fields.some(k=>!find(node,k)))throw Error('Проверь настройки удаления фона.');
 for(const k of fields){const w=find(node,k);if(w.value!==v[k]){w.value=v[k];w.callback?.(v[k]);}}node.properties.acf_background.save=v.save;touch(node);return true;
}
export function backgroundParams(node,touch){if(!node?.properties?.acf_background)return[];const cfg={name:'factory_background_config',type:'text',options:{},node,get value(){return JSON.stringify(readBackground(node));},setValue(v){return writeBackground(node,v,touch);}},save={name:'factory_background_save',type:'toggle',options:{},node,get value(){return node.properties.acf_background.save===true;},setValue(v){if(typeof v!=='boolean')return false;node.properties.acf_background.save=v;touch(node);return true;}};return[{name:cfg.name,label:'Background settings',ptype:'STRING',widget:cfg,node,virtual:true,multiline:false},{name:save.name,label:'Save background result',ptype:'BOOLEAN',widget:save,node,virtual:true,modeControl:true}];}
