// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
import {el} from './util.js';
import {modelpicker} from './special.js';
import {factoryDialog,gearIcon} from './factory_dialog.js';

const CSS=`
.acf-sliders-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.acf-slider-row-head{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:8px;color:#b7a1c8;font-size:12px}
.acf-slider-remove{padding:6px 10px;border:1px solid #92566f;border-radius:8px;background:#392332;color:#ffb8ce;font:inherit;font-size:12px;cursor:pointer}
.acf-slider-card{min-width:0;padding:16px;border:1px solid #65517e;border-radius:14px;background:linear-gradient(145deg,#292235,#201f2d)}
.acf-slider-controls{display:grid;grid-template-columns:76px minmax(0,1fr) 40px;gap:12px;align-items:center;min-width:0}
.acf-slider-number{width:100%;height:42px;min-width:0;border:1px solid #7a5f91;border-radius:9px;background:#1d1a27;color:#f8d8ff;text-align:center;font-size:15px;font-variant-numeric:tabular-nums;padding:0 4px;box-sizing:border-box;appearance:textfield}
.acf-slider-number::-webkit-inner-spin-button,.acf-slider-number::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.acf-slider-range-wrap{min-width:0}.acf-slider-range{display:block;appearance:none;-webkit-appearance:none;width:100%;min-width:0;height:32px;margin:0;background:transparent;cursor:pointer}
.acf-slider-range::-webkit-slider-runnable-track{height:8px;border-radius:999px;background:linear-gradient(90deg,#b268ed 0%,#eb82ce var(--acf-slider-progress,50%),#4b3d59 var(--acf-slider-progress,50%),#4b3d59 100%)}
.acf-slider-range::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:20px;height:20px;margin-top:-6px;background:#f8ccf6;border:2px solid #a65be2;border-radius:50%;box-shadow:0 0 12px #d16cce55}
.acf-slider-range::-moz-range-track{height:8px;border-radius:999px;background:#4b3d59}.acf-slider-range::-moz-range-progress{height:8px;border-radius:999px;background:#bc72df}.acf-slider-range::-moz-range-thumb{width:17px;height:17px;background:#f8ccf6;border:2px solid #a65be2;border-radius:50%}
.acf-slider-scale{display:flex;justify-content:space-between;gap:8px;color:#a99ab6;font-size:10px;line-height:1.2;font-variant-numeric:tabular-nums}.acf-slider-scale span{max-width:48%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acf-slider-gear{display:flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:1px solid #8c639f;border-radius:10px;background:#34263f;color:#edbaff;cursor:pointer}
.acf-slider-hint{margin-top:12px;color:#d3c3e0;font-size:14px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}.acf-slider-card[data-empty=true]{border-color:#453b57}.acf-slider-card[data-empty=true] .acf-slider-hint{color:#91869e}
.acf-slider-form{display:flex;flex-direction:column;gap:16px}.acf-slider-form label{display:flex;flex-direction:column;gap:7px;font-size:13px;color:#d8bfe8;min-width:0}
.acf-slider-form input,.acf-slider-form textarea{width:100%;padding:10px 12px;border:1px solid #6b507b;border-radius:10px;background:#22202d;color:#f3e8fb;font:inherit;box-sizing:border-box;min-width:0}.acf-slider-form textarea{min-height:90px;resize:vertical;line-height:1.45}
.acf-slider-bounds{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
.acf-slider-action{width:100%;min-height:44px;padding:10px 16px;border:1px solid #b47cdb;border-radius:11px;background:linear-gradient(110deg,#614085,#914b98);color:#ffeafd;font:inherit;font-weight:650;cursor:pointer}
.acf-slider-secondary{padding:7px 10px;border:1px solid #65516f;border-radius:8px;background:#2b2434;color:#c6aed5;font:inherit;cursor:pointer}.acf-slider-error{color:#ff9ca9;font-size:13px;margin:0 0 10px}.acf-slider-caption{color:#aa9ab8;font-size:12px;line-height:1.5;margin-bottom:16px}
.acf-slider-range:focus-visible,.acf-slider-number:focus-visible,.acf-slider-gear:focus-visible,.acf-slider-action:focus-visible{outline:2px solid #df9ff2;outline-offset:3px}
@media(max-width:760px){.acf-sliders-grid{grid-template-columns:minmax(0,1fr)}.acf-slider-card{padding:14px}.acf-slider-controls{grid-template-columns:70px minmax(0,1fr) 40px;gap:10px}}
`;
const clone=value=>JSON.parse(JSON.stringify(value));
const number=value=>Number(String(value).trim().replace(',','.'));
const format=value=>String(Number(Number(value).toFixed(6)));
const signature=bank=>JSON.stringify([bank.owner,bank.items.map(i=>[i.id,i.hint,i.min,i.max,i.lora,i.value,i.on])]);

export const factorysliders_v0216={type:'factorysliders_v0216',label:'Слайдеры LoRA',icon:'sliders',group:'Run',live:true,noLabel:true,fill:true,
    slots:[{id:'bank',label:'Slider bank',accepts:['STRING'],required:true}],props:[],size:{w:336,h:44,minW:240,minH:44},
    mount(ctx){
        const button=el('button'),caption=el('span','','Слайдеры'),badge=el('span');let dialog=null,grid=null,error=null,add=null,stamp='',cards=[];
        button.type='button';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
        Object.assign(button.style,{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',width:'100%',height:'44px',padding:'0 16px',border:'1px solid #8c6bb2',borderRadius:'11px',background:'linear-gradient(110deg,#29283e,#3a2745)',color:'#e0c6f5',font:'inherit',fontWeight:'650',fontSize:'15px',cursor:'pointer',boxSizing:'border-box'});
        const icon=el('span');icon.style.display='inline-flex';icon.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h7m4 0h7M3 12h2m4 0h12M3 18h11m4 0h3"/><circle cx="12" cy="6" r="2"/><circle cx="7" cy="12" r="2"/><circle cx="16" cy="18" r="2"/></svg>';
        const text=el('span');Object.assign(text.style,{display:'flex',alignItems:'center',gap:'9px'});text.append(icon,caption);Object.assign(badge.style,{fontSize:'12px',padding:'1px 7px',borderRadius:'8px',background:'#a86bcc24'});button.append(text,badge);ctx.body.append(button);ctx.body.style.flex='1 1 auto';if(ctx.body.parentElement)ctx.body.parentElement.style.padding='0';
        function read(){try{const bank=JSON.parse(ctx.get('bank'));return bank&&Array.isArray(bank.items)?bank:null;}catch{return null;}}
        function write(bank){ctx.set('bank',JSON.stringify(bank));const actual=read();if(!actual||signature(actual)!==signature(bank))throw Error('Не удалось сохранить слайдеры. Проверь загрузчик LoRA.');return actual;}
        function showError(err){if(error){error.textContent=err?.message||String(err);error.hidden=false;}}
        function clearError(){if(error){error.textContent='';error.hidden=true;}}
        function editValue(id,value){const bank=read(),item=bank?.items.find(i=>i.id===id);if(!item)return;if(!Number.isFinite(value)||Math.abs(value)>100)throw Error('Укажи значение от −100 до 100.');const on=item.lora!=='None';if(item.value===value&&item.on===on)return;item.value=value;item.on=on;write(bank);}
        function removeRow(ids,owner){
            const remove=()=>{const bank=read();if(bank?.owner!==owner)throw Error('Набор изменился. Открой слайдеры заново.');bank.items=bank.items.filter(item=>!ids.includes(item.id));write(bank);clearError();update();};
            const bank=read(),items=bank?.items.filter(item=>ids.includes(item.id))||[];
            if(items.some(item=>item.lora!=='None'||item.value!==0||item.hint||item.min!==-1||item.max!==1)){
                const confirmation=factoryDialog(ctx,{title:'Удалить ряд?',width:440});confirmation.body.append(el('div','','Настройки двух слайдеров этого ряда будут удалены.'));
                const cancel=el('button','acf-slider-secondary','Отмена'),removeButton=el('button','acf-slider-remove','Удалить ряд'),message=el('div','acf-slider-error');cancel.type='button';removeButton.type='button';
                Object.assign(confirmation.footer.style,{display:'flex',gap:'10px',justifyContent:'flex-end',flexWrap:'wrap'});confirmation.footer.append(message,cancel,removeButton);cancel.addEventListener('click',confirmation.close);removeButton.addEventListener('click',()=>{try{remove();confirmation.close();}catch(err){message.textContent=err.message;}});
            }else try{remove();}catch(err){showError(err);}
        }
        function configure(id){
            const pack=read(),item=pack?.items.find(i=>i.id===id);if(!item)return;let picker=null;const draft=clone(item),mini=factoryDialog(ctx,{title:'Настройки слайдера',width:560,onClose(){picker?.destroy?.();}});
            const form=el('div','acf-slider-form'),fileLabel=el('label','','LoRA слайдера'),fileBody=el('div'),hintLabel=el('label','','Подсказка под линией'),hint=el('textarea'),bounds=el('div','acf-slider-bounds'),minLabel=el('label','','От'),maxLabel=el('label','','До'),min=el('input'),max=el('input'),validation=el('div','acf-slider-error'),save=el('button','acf-slider-action','Сохранить'),clear=el('button','acf-slider-secondary','Убрать LoRA');
            Object.assign(fileBody.style,{display:'flex',flexDirection:'column',minHeight:'44px'});fileLabel.append(fileBody);hint.value=draft.hint;hint.maxLength=1000;hint.setAttribute('aria-label','Подсказка слайдера');hint.placeholder='Например: делает освещение мягче';hintLabel.append(hint);
            for(const input of[min,max]){input.type='number';input.step='any';input.min='-100';input.max='100';}min.value=String(draft.min);max.value=String(draft.max);min.setAttribute('aria-label','Начало рекомендуемого диапазона');max.setAttribute('aria-label','Конец рекомендуемого диапазона');minLabel.append(min);maxLabel.append(max);bounds.append(minLabel,maxLabel);
            form.append(fileLabel,clear,hintLabel,el('span','','Рекомендуемый диапазон'),bounds,el('div','acf-slider-caption','Границы ограничивают бегунок. Длина линии остаётся одинаковой. Текущее значение не меняется при настройке диапазона; вручную можно указать значение вне него.'));
            mini.body.append(form);validation.hidden=true;save.type='button';clear.type='button';mini.footer.append(validation,save);
            const pickerContext={...ctx,body:fileBody,w:{...ctx.w,slots:{value:ctx.w.slots.bank}},popupHost:()=>mini.root,
                get:key=>key==='value'?draft.lora:ctx.get(key),set(key,value){if(key==='value')draft.lora=value;},info:()=>ctx.info('bank'),prop:key=>key==='folder'?'loras':ctx.prop(key)};
            picker=modelpicker.mount(pickerContext);
            clear.addEventListener('click',()=>{draft.lora='None';picker.update?.();});
            save.addEventListener('click',()=>{
                try{
                    const lo=number(min.value),hi=number(max.value);if(min.value.trim()===''||max.value.trim()===''||!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi||Math.abs(lo)>100||Math.abs(hi)>100)throw Error('Укажи диапазон от −100 до 100: начало должно быть меньше конца.');
                    const next=read();if(next?.owner!==pack.owner)throw Error('Набор изменился. Открой настройки слайдера заново.');const current=next.items.find(i=>i.id===id);if(!current)throw Error('Слайдер больше недоступен.');
                    Object.assign(current,{lora:draft.lora,hint:hint.value.slice(0,1000),min:lo,max:hi,on:draft.lora==='None'?false:draft.lora!==item.lora?true:current.on});write(next);clearError();update();mini.close();
                }catch(err){validation.textContent=err.message;validation.hidden=false;}
            });
        }
        function makeCard(item){
            const box=el('div','acf-slider-card'),controls=el('div','acf-slider-controls'),numeric=el('input','acf-slider-number'),wrap=el('div','acf-slider-range-wrap'),range=el('input','acf-slider-range'),scale=el('div','acf-slider-scale'),low=el('span'),high=el('span'),gear=el('button','acf-slider-gear'),hint=el('div','acf-slider-hint');
            numeric.type='number';numeric.step='any';numeric.min='-100';numeric.max='100';range.type='range';gear.type='button';gear.append(gearIcon());gear.setAttribute('aria-label','Настройки слайдера');gear.addEventListener('click',()=>configure(item.id));
            range.setAttribute('aria-label','Сила слайдера');numeric.setAttribute('aria-label','Значение силы слайдера');hint.id=`acf-slider-${read()?.owner}-${item.id}`;range.setAttribute('aria-describedby',hint.id);
            const commit=()=>{try{if(numeric.value.trim()==='')throw Error('Введи числовое значение.');editValue(item.id,number(numeric.value));clearError();}catch(err){showError(err);}update();};
            numeric.addEventListener('change',commit);numeric.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Enter'){event.preventDefault();commit();numeric.blur();}});
            range.addEventListener('input',()=>{try{editValue(item.id,number(range.value));clearError();update();}catch(err){showError(err);}});
            scale.append(low,high);wrap.append(range,scale);controls.append(numeric,wrap,gear);box.append(controls,hint);grid.append(box);
            return current=>{
                if(document.activeElement!==numeric)numeric.value=format(current.value);range.min=String(current.min);range.max=String(current.max);range.step=String(Math.min(.01,(current.max-current.min)/100));
                const clamped=Math.min(current.max,Math.max(current.min,current.value));if(document.activeElement!==range)range.value=String(clamped);
                range.style.setProperty('--acf-slider-progress',`${(clamped-current.min)/(current.max-current.min)*100}%`);low.textContent=format(current.min);high.textContent=format(current.max);
                hint.textContent=current.hint||'Выбери LoRA и добавь подсказку через шестерёнку.';box.dataset.empty=String(current.lora==='None');gear.title=current.lora==='None'?'Выбрать LoRA и описание':current.lora;range.title=current.lora==='None'?'LoRA пока не выбрана':current.value<current.min||current.value>current.max?'Значение вне рекомендуемого диапазона':current.lora;
            };
        }
        function update(){
            const bank=read();button.disabled=!bank;badge.textContent=bank?String(bank.items.length):'—';button.title=bank?`Слайдеры · ${bank.label}`:'Слайдеры недоступны';
            if(!dialog||!bank)return;dialog.heading.textContent=`Слайдеры · ${bank.label}`;const next=JSON.stringify([bank.owner,bank.items.map(i=>i.id)]);
            if(stamp!==next){stamp=next;grid.replaceChildren();cards=[];bank.items.forEach((item,i)=>{
                if(i>=6&&i%2===0){const row=el('div','acf-slider-row-head'),remove=el('button','acf-slider-remove','Удалить ряд');remove.type='button';remove.setAttribute('aria-label',`Удалить ряд ${i/2+1}`);const ids=bank.items.slice(i,i+2).map(x=>x.id);remove.addEventListener('click',()=>removeRow(ids,bank.owner));row.append(el('span','',`Ряд ${i/2+1}`),remove);grid.append(row);}
                cards.push(makeCard(item));
            });}
            bank.items.forEach((item,i)=>cards[i](item));add.disabled=bank.items.length>=128;
        }
        button.addEventListener('click',()=>{
            if(dialog){dialog.close();return;}if(!read())return;button.setAttribute('aria-expanded','true');
            dialog=factoryDialog(ctx,{title:'Слайдеры',width:1080,onClose(){dialog=null;grid=null;cards=[];stamp='';button.setAttribute('aria-expanded','false');}});
            const style=el('style');style.textContent=CSS;dialog.root.append(style);dialog.body.append(el('div','acf-slider-caption','Настраивай силу бегунком или числом слева. Шестерёнка открывает выбор LoRA, подсказку и границы диапазона.'));
            grid=el('div','acf-sliders-grid');dialog.body.append(grid);error=el('div','acf-slider-error');error.hidden=true;add=el('button','acf-slider-action','＋ Добавить ряд');add.type='button';dialog.footer.append(error,add);
            add.addEventListener('click',()=>{try{const bank=read();if(bank.items.length>=128)return;const ids=new Set(bank.items.map(i=>i.id));let i=bank.items.length+1;for(let j=0;j<2;j++){while(ids.has(`slider_${i}`))i++;const id=`slider_${i++}`;ids.add(id);bank.items.push({id,hint:'',min:-1,max:1,lora:'None',value:0,on:false});}write(bank);clearError();update();grid.lastElementChild?.scrollIntoView?.({block:'nearest',behavior:'smooth'});}catch(err){showError(err);}});
            update();
        });
        update();return{update,destroy(){dialog?.close();}};
    }
};
