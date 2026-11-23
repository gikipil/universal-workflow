// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-23: persistent presentation-only tab order.
export function orderedTaskIds(saved,available){
 const valid=new Set(available),seen=new Set(),result=[];
 for(const id of [...(Array.isArray(saved)?saved:[]),...available])if(valid.has(id)&&!seen.has(id)){seen.add(id);result.push(id);}
 return result;
}
export function mountTaskOrder(ctx,navigation,tabs){
 const entries=new Map(tabs.map(t=>[t[1],t])),available=[...entries.keys()],listeners=[];
 let dragged=null,target=null,blockedUntil=0,stamp='';
 function listen(node,event,fn){node.addEventListener(event,fn);listeners.push(()=>node.removeEventListener(event,fn));}
 function clearTarget(){if(target){target.style.outline='';target.style.outlineOffset='';}target=null;}
 function reset(){clearTarget();for(const [button]of tabs)button.style.opacity='';dragged=null;}
 function apply(ids){const ordered=ids.map(id=>entries.get(id));tabs.splice(0,tabs.length,...ordered);for(const [button]of tabs)navigation.append(button);stamp=JSON.stringify(ids);}
 function update(){const ids=orderedTaskIds(ctx.prop('tabOrder'),available);if(JSON.stringify(ids)!==stamp)apply(ids);}
 function save(ids){if(JSON.stringify(ids)===stamp)return;const write=ctx.setTaskProp||ctx.setProp;if(!write)return;write.call(ctx,'tabOrder',ids);apply(ids);}
 function move(id,to,insertAfter){const ids=tabs.map(t=>t[1]);if(id===to)return;ids.splice(ids.indexOf(id),1);ids.splice(ids.indexOf(to)+(insertAfter?1:0),0,id);save(ids);}
 for(const [button,id]of tabs){
  button.draggable=true;button.title=ctx.tr?.('Перетащи вкладку, чтобы изменить порядок')||'Перетащи вкладку, чтобы изменить порядок';
  listen(button,'dragstart',e=>{if(ctx.isEditing?.()){e.preventDefault();return;}e.stopPropagation();dragged=id;button.style.opacity='.45';if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',id);}});
  listen(button,'dragover',e=>{if(!dragged)return;e.preventDefault();e.stopPropagation();if(e.dataTransfer)e.dataTransfer.dropEffect='move';clearTarget();target=button;const rect=button.getBoundingClientRect();button.style.outline='2px solid currentColor';button.style.outlineOffset='-3px';const nav=navigation.getBoundingClientRect();if(e.clientX<nav.left+28)navigation.scrollLeft-=18;else if(e.clientX>nav.right-28)navigation.scrollLeft+=18;});
  listen(button,'dragleave',()=>{if(target===button)clearTarget();});
  listen(button,'drop',e=>{if(!dragged)return;e.preventDefault();e.stopPropagation();const rect=button.getBoundingClientRect();move(dragged,id,e.clientX>=rect.left+rect.width/2);blockedUntil=Date.now()+250;reset();});
  listen(button,'dragend',()=>{blockedUntil=Date.now()+250;reset();});
 }
 update();return{update,suppressClick:()=>Date.now()<blockedUntil,destroy(){reset();for(const remove of listeners)remove();}};
}
