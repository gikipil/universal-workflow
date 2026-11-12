// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
import {powerLoraParams} from './rgthree_power_params.js';
import {sliderTarget} from './factory_slider_params.js';
const rows=node=>(node?.widgets||[]).filter(w=>/^lora_\d+$/.test(w.name||'')&&w.value&&typeof w.value==='object'&&'lora'in w.value);
const fixed=node=>Number.isInteger(node?.properties?.nd_ui_constant_loras)?node.properties.nd_ui_constant_loras:3;
export function readUserLoraBank(node){
    const target=sliderTarget(node),ids=target?.properties?.nd_ui_user_lora_ids;if(!Array.isArray(ids))return null;
    const current=rows(target),offset=fixed(target);
    return{owner:String(target.id),items:ids.map((id,i)=>({id,lora:current[offset+i]?.value?.lora||'None',on:!!current[offset+i]?.value?.on,strength:Number(current[offset+i]?.value?.strength)||0}))};
}
export function writeUserLoraBank(node,value,touch=()=>{}){
    const next=typeof value==='string'?JSON.parse(value):value,target=sliderTarget(node),before=readUserLoraBank(node);
    if(!target||!before||String(next?.owner)!==before.owner)throw Error('Набор LoRA изменился. Повтори действие в выбранном режиме.');
    if(!Array.isArray(next.items)||next.items.length<5||next.items.length>128)throw Error('Допустимо от 5 до 128 пользовательских LoRA.');
    const ids=new Set();for(const item of next.items){if(typeof item.id!=='string'||!item.id||ids.has(item.id)||typeof item.lora!=='string'||!item.lora.trim()||typeof item.on!=='boolean'||!Number.isFinite(item.strength)||Math.abs(item.strength)>100)throw Error('Неверные настройки LoRA.');ids.add(item.id);}
    let removed=[];
    if(next.items.length<before.items.length){
        removed=before.items.map((item,i)=>ids.has(item.id)?-1:i).filter(i=>i>=0);const survivors=before.items.filter(item=>ids.has(item.id));
        if(before.items.length-next.items.length!==1||removed.length!==1||removed[0]<5||survivors.some((item,i)=>next.items[i]?.id!==item.id))throw Error('Можно удалить только добавленный слот LoRA.');
    }else if(before.items.some((item,i)=>next.items[i]?.id!==item.id))throw Error('Порядок существующих LoRA менять нельзя.');
    const current=rows(target),offset=fixed(target),sliderCount=target.properties.nd_ui_slider_bank?.items?.length||0;
    if(next.items.length!==before.items.length&&current.length!==offset+before.items.length+sliderCount)throw Error('Строки загрузчика изменены вручную. Проверь их перед изменением списка.');
    if(next.items.length>before.items.length&&typeof target.addNewLoraWidget!=='function')throw Error('Нужен загрузчик rgthree с поддержкой добавления LoRA.');
    if(removed.length&&typeof target.removeWidget!=='function')throw Error('Нужен загрузчик rgthree с поддержкой удаления LoRA.');
    for(const i of removed)target.removeWidget(current[offset+i]);
    for(let i=before.items.length;i<next.items.length;i++){
        const anchor=rows(target)[offset+i],widget=target.addNewLoraWidget();widget.value={on:false,lora:'None',strength:1,strengthTwo:null};
        if(anchor){const from=target.widgets.indexOf(widget);target.widgets.splice(from,1);target.widgets.splice(target.widgets.indexOf(anchor),0,widget);}
    }
    const params=new Map(powerLoraParams(target,()=>{}).map(p=>[p.name,p]));
    next.items.forEach((item,i)=>{for(const[field,v]of[['lora',item.lora],['on',item.on],['strength',item.strength]])params.get(`power_lora_${offset+i+1}.${field}`).widget.setValue(v);});
    target.properties.nd_ui_user_lora_ids=next.items.map(item=>item.id);target.properties.nd_ui_user_lora_count=next.items.length;target.properties.nd_ui_slider_offset=offset+next.items.length;
    if(next.items.length>before.items.length&&target.computeSize&&target.size)target.size[1]=Math.max(target.size[1],target.computeSize()[1]);touch(target);return true;
}
export function userLoraBankParams(node,touch=()=>{}){
    if(!readUserLoraBank(node))return[];
    const proxy={name:'factory_user_lora_bank',node,type:'text',options:{},get value(){return JSON.stringify(readUserLoraBank(node));},setValue(value){return writeUserLoraBank(node,value,touch);}};
    return[{name:proxy.name,label:'User LoRA bank',ptype:'STRING',widget:proxy,node,virtual:true,multiline:false,control:false,seed:false}];
}
