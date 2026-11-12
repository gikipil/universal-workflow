// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions/modifications by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
// One UI loader, separate saved Krea/Z-Image rows. Processing graph is unchanged.
import {powerLoraParams} from './rgthree_power_params.js';
export function factoryRefineLoraParams(router,touch=()=>{}){
 if(router?.properties?.nd_ui_src?.tag!=='k2pass-switch')return[];
 const target=()=>{
  const mode=Number(router.widgets?.find(w=>w.name==='index')?.value)||0;
  const z=mode===3||mode===4;
  const nodes=router.graph?._nodes||router.graph?.nodes||[];
  const node=nodes.find(n=>n.properties?.nd_ui_src?.tag===(z?'k2pass-z_lora':'k2pass-krea_lora'));
  return{node,offset:z?0:1};
 };
 const parameter=(i,field)=>{const{node,offset}=target();return powerLoraParams(node,touch).find(p=>p.name===`power_lora_${i+offset}.${field}`);};
 return Array.from({length:5},(_,j)=>['lora','on','strength'].map(field=>{
  const i=j+1,name=`refine_lora_${i}.${field}`,ptype=field==='lora'?'COMBO':field==='on'?'BOOLEAN':'FLOAT',options={};
  if(field==='lora')Object.defineProperty(options,'values',{enumerable:true,get:()=>parameter(i,field)?.widget?.options?.values||['None']});
  const proxy={name,node:router,type:field==='lora'?'combo':field==='on'?'toggle':'number',options,
   get value(){return parameter(i,field)?.widget?.value??(field==='lora'?'None':field==='on'?false:1);},
   setValue(v){return parameter(i,field)?.widget?.setValue(v);}};
  return{name,label:`LoRA ${i} · ${field}`,ptype,widget:proxy,node:router,multiline:false,virtual:true,min:ptype==='FLOAT'?-100:undefined,max:ptype==='FLOAT'?100:undefined,step:.05,precision:2,control:false,seed:false};
 })).flat();
}
