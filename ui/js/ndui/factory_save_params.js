// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions/modifications by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
// Only the factory module's saver: enable/disable without altering its inputs.
export function factorySaveParams(node,touch=()=>{}){
 if(node?.properties?.nd_ui_src?.tag!=='k2module-save')return[];
 const proxy={name:'ndui_save_enabled',type:'toggle',options:{},node,
  get value(){return(node.mode??0)===0;},
  setValue(v){if(typeof v!=='boolean')return;node.mode=v?0:2;touch(node);}};
 return[{name:proxy.name,label:'Сохранять результат',ptype:'BOOLEAN',widget:proxy,node,virtual:true,modeControl:true,control:false,seed:false}];
}
