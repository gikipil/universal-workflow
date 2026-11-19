// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-13.
const find=(n,id,name)=>n.graph.getNodeById(id)?.widgets?.find(w=>w.name===name);
const read=(n,id,name)=>find(n,id,name)?.value;
const ultimateFields=['steps','sampler_name','scheduler','denoise','tile_width','tile_height','mask_blur','tile_padding','seam_fix_mode','seam_fix_denoise','seam_fix_width','seam_fix_mask_blur','seam_fix_padding','force_uniform_tiles','tiled_decode'];
const seedFields=['color_correction'];
const ditFields=['blocks_to_swap','attention_mode'];
const vaeFields=['encode_tiled','encode_tile_size','encode_tile_overlap','decode_tiled','decode_tile_size','decode_tile_overlap'];
function options(n,id,name){const value=find(n,id,name)?.options?.values;return typeof value==='function'?value():Array.isArray(value)?value:[];}
export function readUpscale(node){const s=node?.properties?.acf_upscale;if(!s)return null;return{enabled:!!read(node,s.enabled,'index'),mode:Number(read(node,node.id,'index')),size:Number(read(node,s.size,'index')),factor:read(node,s.factor,'scale_by'),long:read(node,s.long,'largest_size'),simple:Number(read(node,s.simple,'index')),seed:read(node,s.seed,'seed'),prompt:read(node,s.prompt,'text'),ultimate:Object.fromEntries(ultimateFields.map(k=>[k,read(node,s.ultimate,k)])),seedvr:Object.fromEntries(seedFields.map(k=>[k,read(node,s.seedvr,k)])),dit:Object.fromEntries(ditFields.map(k=>[k,read(node,s.dit,k)])),vae:Object.fromEntries(vaeFields.map(k=>[k,read(node,s.vae,k)])),choices:Object.fromEntries([['sampler_name',s.ultimate],['scheduler',s.ultimate],['seam_fix_mode',s.ultimate],['color_correction',s.seedvr],['attention_mode',s.dit]].map(([k,id])=>[k,options(node,id,k)]))};}
export function writeUpscale(node,value,touch=()=>{}){
 const v=typeof value==='string'?JSON.parse(value):value,s=node.properties.acf_upscale;
 const number=(x,lo,hi,integer=false)=>{if(!Number.isFinite(x)||x<lo||x>hi||(integer&&!Number.isInteger(x)))throw Error('Проверь числовые настройки апскейла.');};
 if(typeof v.enabled!=='boolean'||![0,1,2].includes(v.mode)||![0,1].includes(v.size)||![0,1].includes(v.simple))throw Error('Неверный режим апскейла.');number(v.factor,1,4);number(v.long,64,16384,true);number(v.seed,0,4294967295,true);if(typeof v.prompt!=='string'||v.prompt.length>20000)throw Error('Неверный промт Ultimate.');
 const edits=[[node.id,'index',v.mode],[s.enabled,'index',Number(v.enabled)],[s.size,'index',v.size],[s.factor,'scale_by',v.factor],[s.long,'largest_size',v.long],[s.simple,'index',v.simple],[s.seed,'seed',v.seed],[s.prompt,'text',v.prompt]];
 for(const[group,fields,id]of[['ultimate',ultimateFields,s.ultimate],['seedvr',seedFields,s.seedvr],['dit',ditFields,s.dit],['vae',vaeFields,s.vae]])for(const k of fields){const w=find(node,id,k),x=v[group]?.[k];if(!w)throw Error('Не найден параметр '+k);const opts=options(node,id,k);if(opts.length){if(!opts.includes(x))throw Error('Недоступный вариант '+k);}else if(typeof w.value==='boolean'){if(typeof x!=='boolean')throw Error('Неверный переключатель '+k);}else{number(x,Number.isFinite(w.options?.min)?w.options.min:0,Number.isFinite(w.options?.max)?w.options.max:16384,['steps','tile_width','tile_height','mask_blur','tile_padding','seam_fix_width','seam_fix_mask_blur','seam_fix_padding','blocks_to_swap','encode_tile_size','encode_tile_overlap','decode_tile_size','decode_tile_overlap'].includes(k));}edits.push([id,k,x]);}
 if(v.vae.encode_tile_overlap>=v.vae.encode_tile_size||v.vae.decode_tile_overlap>=v.vae.decode_tile_size)throw Error('Перекрытие тайлов должно быть меньше их размера.');
 const ditModel=String(read(node,s.dit,'model')||'');if(/3b/i.test(ditModel)&&v.dit.blocks_to_swap>32)throw Error('Для SeedVR 3B доступно не больше 32 блоков выгрузки.');
 for(const[id,k]of edits)if(!find(node,id,k))throw Error('Не найден параметр '+k);
 for(const[id,k,x]of edits){const w=find(node,id,k);if(w.value===x)continue;w.value=x;w.callback?.(x);}
 touch(node);return true;
}
export function upscaleParams(node,touch){if(!node?.properties?.acf_upscale)return[];const w={name:'factory_upscale_config',node,type:'text',options:{},get value(){return JSON.stringify(readUpscale(node));},setValue(v){return writeUpscale(node,v,touch);}};return[{name:w.name,label:'Upscale settings',ptype:'STRING',widget:w,node,virtual:true,multiline:false,control:false,seed:false}];}
