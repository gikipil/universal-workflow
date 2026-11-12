// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
import {powerLoraParams} from './rgthree_power_params.js';

export const MAX_SLIDERS=128;
export function sliderTarget(node) {
    if(node?.properties?.nd_ui_src?.tag==='k2pass-switch') {
        const mode=Number(node.widgets?.find(w=>w.name==='index')?.value)||0;
        const tag=mode===3||mode===4?'k2pass-z_lora':'k2pass-krea_lora';
        return (node.graph?._nodes||node.graph?.nodes||[]).find(n=>n.properties?.nd_ui_src?.tag===tag);
    }
    return node;
}
const rows=node=>(node?.widgets||[]).filter(w=>/^lora_\d+$/.test(w.name||'')&&w.value&&typeof w.value==='object'&&'lora'in w.value);
const offset=node=>Number.isInteger(node?.properties?.nd_ui_slider_offset)?node.properties.nd_ui_slider_offset:8;
export function readSliderBank(node) {
    const target=sliderTarget(node),config=target?.properties?.nd_ui_slider_bank;
    if(!Array.isArray(config?.items))return null;
    const current=rows(target),start=offset(target),tag=target.properties?.nd_ui_src?.tag;
    const label=tag==='k2module-lora'?'Krea · генерация':tag==='k2pass-z_lora'?'Z-Image · детализация':'Krea · детализация';
    return {owner:String(target.id),label,items:config.items.map((item,i)=>({id:item.id,hint:item.hint||'',min:item.min,max:item.max,
        lora:current[start+i]?.value?.lora||'None',value:Number(current[start+i]?.value?.strength)||0,on:!!current[start+i]?.value?.on}))};
}
export function normalizeSliderBank(value) {
    const parsed=typeof value==='string'?JSON.parse(value):value;
    if(!parsed||!Array.isArray(parsed.items)||parsed.items.length<6||parsed.items.length>MAX_SLIDERS||parsed.items.length%2)throw Error('Количество слотов должно быть чётным, от 6 до 128.');
    const ids=new Set();
    const items=parsed.items.map(item=>{
        if(typeof item.id!=='string'||!item.id||ids.has(item.id))throw Error('Неверный идентификатор слайдера.');ids.add(item.id);
        if(typeof item.lora!=='string'||!item.lora.trim())throw Error('Выбери файл LoRA или None.');
        for(const key of['min','max','value'])if(typeof item[key]!=='number'||!Number.isFinite(item[key])||Math.abs(item[key])>100)throw Error('Числа должны быть в пределах −100…100.');
        if(item.min>=item.max)throw Error('Начало диапазона должно быть меньше конца.');
        return {id:item.id,hint:String(item.hint||'').slice(0,1000),min:item.min,max:item.max,lora:item.lora,value:item.value,on:!!item.on};
    });
    return {owner:String(parsed.owner),items};
}
export function writeSliderBank(node,value,touch=()=>{}) {
    const target=sliderTarget(node),before=readSliderBank(node),next=normalizeSliderBank(value);
    if(!target||!before||next.owner!==before.owner)throw Error('Набор изменился. Открой слайдеры выбранного режима заново.');
    if(next.items.length<before.items.length||before.items.some((item,i)=>next.items[i]?.id!==item.id))throw Error('Порядок существующих слайдеров менять нельзя.');
    const current=rows(target),start=offset(target),needed=start+next.items.length;
    if(needed>current.length&&typeof target.addNewLoraWidget!=='function')throw Error('Загрузчик rgthree не поддерживает добавление слотов.');
    if(next.items.length>before.items.length&&current.length!==start+before.items.length)throw Error('Строки загрузчика изменены вручную. Проверь их перед добавлением ряда.');
    while(rows(target).length<needed) {
        const widget=target.addNewLoraWidget();
        widget.value={on:false,lora:'None',strength:0,strengthTwo:null};
    }
    const params=new Map(powerLoraParams(target,()=>{}).map(p=>[p.name,p]));
    next.items.forEach((item,i)=>{
        const prefix=`power_lora_${start+i+1}.`;
        for(const[field,v]of[['lora',item.lora],['on',item.on],['strength',item.value]])params.get(prefix+field).widget.setValue(v);
    });
    target.properties.nd_ui_slider_bank={version:1,items:next.items.map(({id,hint,min,max})=>({id,hint,min,max}))};
    if(current.length<needed&&target.computeSize&&target.size)target.size[1]=Math.max(target.size[1],target.computeSize()[1]);
    touch(target);return true;
}
export function sliderBankParams(node,touch=()=>{}) {
    if(!readSliderBank(node))return[];
    const proxy={name:'factory_slider_bank',node,type:'text',options:{},get value(){return JSON.stringify(readSliderBank(node));},setValue(value){return writeSliderBank(node,value,touch);}};
    return[{name:proxy.name,label:'LoRA sliders',ptype:'STRING',widget:proxy,node,multiline:false,virtual:true,control:false,seed:false}];
}
