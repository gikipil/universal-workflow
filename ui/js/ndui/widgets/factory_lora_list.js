// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
import {el} from './util.js';
import {modelpicker} from './special.js';
import {toggle} from './inputs.js';
import {factoryDialog} from './factory_dialog.js';
const signature=bank=>JSON.stringify([bank.owner,bank.items.map(i=>[i.id,i.lora,i.on,i.strength])]);
export const factoryloralist_v0217={type:'factoryloralist_v0217',label:'Пользовательские LoRA',icon:'layers',group:'Inputs',live:true,noLabel:true,fill:true,
 slots:[{id:'bank',label:'User LoRA bank',accepts:['STRING'],required:true}],props:[],size:{w:336,h:504,minW:250,minH:200},
 mount(ctx){
    const root=el('div'),list=el('div'),error=el('div'),add=el('button','','＋ Добавить LoRA');let stamp='',instances=[],updates=[];
    Object.assign(root.style,{display:'flex',flexDirection:'column',gap:'12px',padding:'12px',width:'100%',boxSizing:'border-box'});Object.assign(list.style,{display:'flex',flexDirection:'column',gap:'16px'});Object.assign(error.style,{fontSize:'12px',color:'#ffa4b2'});error.hidden=true;
    add.type='button';Object.assign(add.style,{height:'44px',width:'100%',border:'1px solid #bc72cf',borderRadius:'10px',background:'linear-gradient(110deg,#573044,#643681)',color:'#ffd2f2',font:'inherit',fontWeight:'650',cursor:'pointer'});root.append(list,error,add);ctx.body.append(root);ctx.body.style.flex='1 1 auto';if(ctx.body.parentElement)ctx.body.parentElement.style.padding='0';
    const read=()=>{try{return JSON.parse(ctx.get('bank'));}catch{return null;}};
    function fail(err){error.hidden=false;error.textContent=err.message||String(err);update();}
    function write(bank){ctx.set('bank',JSON.stringify(bank));if(signature(read())!==signature(bank))throw Error('Не удалось сохранить список LoRA.');error.hidden=true;update();}
    function setField(owner,id,field,value){try{const bank=read();if(bank?.owner!==owner)throw Error('Набор LoRA изменился. Повтори действие.');const item=bank.items.find(i=>i.id===id);if(!item)throw Error('Слот больше недоступен.');item[field]=value;write(bank);}catch(err){fail(err);}}
    function remove(owner,id){
        const bank=read();if(bank?.owner!==owner)return;const item=bank.items.find(i=>i.id===id);if(!item)return;
        const perform=()=>{const current=read();if(current?.owner!==owner)throw Error('Набор LoRA изменился.');current.items=current.items.filter(i=>i.id!==id);write(current);};
        if(item.lora!=='None'||item.on||item.strength!==1){const dialog=factoryDialog(ctx,{title:'Удалить LoRA?',width:440}),cancel=el('button','ndk-chip','Отмена'),ok=el('button','ndk-chip','Удалить'),message=el('div');dialog.body.append(el('div','','Этот дополнительный слот будет удалён из выбранного набора.'));cancel.type='button';ok.type='button';ok.style.color='#ffafc8';dialog.footer.append(message,cancel,ok);cancel.addEventListener('click',dialog.close);ok.addEventListener('click',()=>{try{perform();dialog.close();}catch(err){message.textContent=err.message;}});}else try{perform();}catch(err){fail(err);}
    }
    function rebuild(bank){
        for(const instance of instances)instance.destroy?.();instances=[];updates=[];list.replaceChildren();
        bank.items.forEach((item,index)=>{
            const row=el('div'),onBody=el('div'),model=el('div'),label=el('span','',`${index+1} · LoRA`),file=el('div'),strength=el('div'),strengthLabel=el('span','','Сила'),field=el('div','ndk-field'),input=el('input','ndk-input');
            Object.assign(row.style,{display:'grid',gridTemplateColumns:index>=5?'44px minmax(0,1fr) 68px 28px':'44px minmax(0,1fr) 76px',gap:'8px',alignItems:'center',height:'72px',minHeight:'72px'});Object.assign(onBody.style,{display:'flex',alignItems:'center',justifyContent:'center',minWidth:'0',height:'100%'});
            for(const box of[model,strength])Object.assign(box.style,{display:'flex',flexDirection:'column',gap:'6px',minWidth:'0'});for(const caption of[label,strengthLabel])Object.assign(caption.style,{fontSize:'12px',color:'#e7b4d7'});
            Object.assign(file.style,{height:'42px',minWidth:'0',display:'flex',flexDirection:'column'});Object.assign(field.style,{height:'42px',minWidth:'0',padding:'0 8px'});input.type='number';input.step='0.05';input.min='-100';input.max='100';Object.assign(input.style,{width:'100%',minWidth:'0',fontSize:'13px',fontVariantNumeric:'tabular-nums'});input.setAttribute('aria-label',`Сила LoRA ${index+1}`);field.append(input);strength.append(strengthLabel,field);model.append(label,file);
            const value=key=>read()?.owner===bank.owner?read().items.find(i=>i.id===item.id)?.[key]:undefined;
            const sub=(body,key)=>({...ctx,body,w:{...ctx.w,props:{label:''},slots:{value:ctx.w.slots.bank}},get:k=>k==='value'?value(key):ctx.get(k),set:(k,v)=>setField(bank.owner,item.id,key,v),info:()=>ctx.info('bank'),prop:k=>k==='folder'?'loras':k==='pickerStyle'?'lora':k==='text'||k==='label'||k==='description'?'':ctx.prop(k)});
            instances.push(toggle.mount(sub(onBody,'on')),modelpicker.mount(sub(file,'lora')));
            const commit=()=>{const n=Number(input.value.replace(',','.'));if(input.value.trim()===''||!Number.isFinite(n)||Math.abs(n)>100){input.value=String(value('strength')??1);return;}setField(bank.owner,item.id,'strength',n);};input.addEventListener('change',commit);input.addEventListener('keydown',event=>event.stopPropagation());
            updates.push(()=>{if(document.activeElement!==input)input.value=String(value('strength')??1);});row.append(onBody,model,strength);
            if(index>=5){const erase=el('button','','×');erase.type='button';erase.setAttribute('aria-label',`Удалить LoRA ${index+1}`);Object.assign(erase.style,{width:'28px',height:'34px',padding:'0',border:'1px solid #97546d',borderRadius:'8px',background:'#3b2533',color:'#ffc0d5',fontSize:'20px',cursor:'pointer',marginTop:'18px'});erase.addEventListener('click',()=>remove(bank.owner,item.id));row.append(erase);}
            list.append(row);
        });
    }
    function update(){const bank=read();if(!bank)return;const next=JSON.stringify([bank.owner,bank.items.map(i=>i.id)]);if(next!==stamp){stamp=next;rebuild(bank);}for(const instance of instances)instance.update?.();for(const fn of updates)fn();add.disabled=bank.items.length>=128;ctx.setContentHeight?.(bank.items.length*88+64+(error.hidden?0:48),bank.items.length);}
    add.addEventListener('click',()=>{try{const bank=read();if(!bank||bank.items.length>=128)return;const ids=new Set(bank.items.map(i=>i.id));let n=bank.items.length+1;while(ids.has(`user_${n}`))n++;bank.items.push({id:`user_${n}`,lora:'None',on:false,strength:1});write(bank);}catch(err){fail(err);}});
    update();return{update,destroy(){for(const instance of instances)instance.destroy?.();}};
 }
};
