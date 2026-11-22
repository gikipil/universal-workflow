// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow model download help, gikipil, 2026-11-20.
import {el} from './util.js';
import {factoryDialog} from './factory_dialog.js';
import {MODEL_DOWNLOADS} from '../factory_model_catalog.js';
import {translateInterface} from '../factory_locale.js';
import {api} from '../../../../scripts/api.js';
import {modelDownloadStatus} from '../factory_model_download_status.js';
import {clearModelPresence} from '../model_presence.js';

const CSS=`
.acf-model-help{display:flex;flex-direction:column;gap:18px;color:var(--ndk-text)}
.acf-model-help p{margin:0;color:var(--ndk-muted);line-height:1.55}
.acf-model-help-tools{display:grid;grid-template-columns:minmax(0,1fr) minmax(180px,250px);gap:12px}
.acf-model-help-tools :is(input,select){width:100%;min-width:0;height:42px;padding:0 12px;border:1px solid var(--ndk-border);border-radius:10px;background:var(--ndk-s2);color:var(--ndk-text);font:inherit}
.acf-model-help-tools :is(input,select):focus-visible{outline:2px solid var(--ndk-accent);outline-offset:-2px}
.acf-model-help h3{margin:8px 0 12px;color:var(--ndk-label);font-size:17px}
.acf-model-help-list{display:flex;flex-direction:column;gap:12px}
.acf-model-help-item{padding:16px;border:1px solid var(--ndk-border);border-radius:12px;background:var(--ndk-s1);min-width:0}
.acf-model-help-item+.acf-model-help-item{margin-top:12px}
.acf-model-help-item h4{margin:0;font-size:15px;color:var(--ndk-text)}
.acf-model-help-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.acf-model-help-item p{font-size:12px;margin-top:8px}
.acf-model-help code{font-family:ui-monospace,Consolas,monospace;font-size:12px;overflow-wrap:anywhere;color:var(--ndk-text);white-space:normal}
.acf-model-help-folder{margin-top:9px;display:flex;flex-wrap:wrap;gap:6px;font-size:12px;color:var(--ndk-muted)}
.acf-model-help-link{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:6px 12px;border:1px solid var(--ndk-accent);border-radius:8px;color:var(--ndk-accent);text-decoration:none;font-weight:650;white-space:nowrap}
.acf-model-help-link:hover{background:var(--ndk-accent-soft)}
.acf-model-help-source{color:var(--ndk-muted);font-size:12px;text-decoration:underline;text-underline-offset:3px}
.acf-model-help details{margin-top:12px}.acf-model-help summary{cursor:pointer;color:var(--ndk-accent);font-weight:650;padding:4px 0}
.acf-model-help-file{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--ndk-border)}
.acf-model-help-file small{display:block;color:var(--ndk-muted);overflow-wrap:anywhere;font-size:11px;margin-top:4px}
.acf-model-help-optional{font-size:11px;color:var(--ndk-muted);margin-left:8px;font-weight:400}
.acf-model-help-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-left:auto;flex:0 0 auto;max-width:100%}
.acf-model-help-loaded{display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;min-height:34px;padding:6px 10px;border:1px solid #48bf7966;border-radius:8px;background:linear-gradient(135deg,#24533755,#16392766);color:#86efac;font-size:13px;line-height:20px;font-weight:800;white-space:nowrap;box-shadow:inset 0 1px 0 #a8ffc518}
.acf-model-help-loaded::before{content:'✓';font-size:14px;font-weight:900}
.acf-model-help button{font:inherit;background:var(--ndk-s2);cursor:pointer}
.acf-model-help [hidden]{display:none!important}
@media(max-width:620px){.acf-model-help-tools{grid-template-columns:minmax(0,1fr)}.acf-model-help-file{grid-template-columns:minmax(0,1fr)}.acf-model-help-link{justify-self:start}}
`;
export function downloadLink(file){
    const url=new URL(file.url);
    if(url.protocol!=='https:'||!['huggingface.co','civitai.com'].includes(url.hostname))throw new Error('Invalid model download URL');
    const link=el('a','acf-model-help-link','Скачать файл');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Скачать файл · '+file.name);return link;
}
export function openModelDownloads(ctx,onClose=()=>{}){
    let alive=true,timer=null;const dialog=factoryDialog(ctx,{title:'Help · Скачать модели',width:1080,onClose:()=>{alive=false;clearTimeout(timer);onClose();}}),root=el('div','acf-model-help'),style=el('style');style.textContent=CSS;
    const intro=el('p','','Это рекомендации автора, а не обязательный список. Кнопка скачивания сохраняет файлы прямо в ComfyUI. Можно использовать и другие совместимые модели; после загрузки выбери их в настройках.'),tools=el('div','acf-model-help-tools'),search=el('input'),select=el('select'),list=el('div','acf-model-help-list'),empty=el('p','','Ничего не найдено');
    search.type='search';search.placeholder='Найти модель или файл…';search.setAttribute('aria-label','Поиск моделей для скачивания');select.setAttribute('aria-label','Раздел моделей');
    for(const[id,label]of [['all','Все разделы'],...MODEL_DOWNLOADS.map(g=>[g.id,g.label])]){const option=el('option','',label);option.value=id;select.append(option);}
    const folderTools=el('div','acf-model-help-heading'),folderStatus=el('p');folderStatus.setAttribute('role','status');tools.append(search,select);root.append(style,intro,folderTools,folderStatus,tools,list,empty);dialog.body.append(root);
    const sections=[],checks=[],cards=new Map(),finished=new Set(),refresh=el('button','acf-model-help-link','Проверить модели');refresh.type='button';folderTools.append(refresh);
    refresh.addEventListener('click',async()=>{refresh.disabled=true;clearModelPresence();try{await Promise.all(checks.map(check=>check()));}finally{refresh.disabled=false;}});
    async function start(id,file){
        try{const response=await api.fetchApi('/universal/models/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...(file==null?{}:{file})})});if(response.status===404)throw Error('Перезапусти ComfyUI после обновления модуля Universal Memory.');const result=await response.json();if(!response.ok)throw Error(result.error||'Не удалось начать скачивание.');await poll(false);}
        catch(error){folderStatus.textContent=translateInterface(error.message,ctx.language?.()||'ru');}
    }
    async function poll(schedule=true){
        try{const response=await api.fetchApi('/universal/models/downloads');if(!response.ok)return;const data=await response.json();if(!alive)return;
            for(const[id,card]of cards){const jobs=(data.jobs||[]).filter(j=>j.model_id===id),job=jobs.find(j=>['queued','downloading'].includes(j.state))||jobs.at(-1);if(!job)continue;
                card.status.hidden=false;const language=ctx.language?.()||'ru',tr=s=>translateInterface(s,language),active=['queued','downloading'].includes(job.state);card.cancel.hidden=!active;card.cancel.onclick=()=>api.fetchApi('/universal/models/downloads/cancel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:job.id})});
                const amount=job.total_bytes?' · '+Math.round(job.bytes/job.total_bytes*100)+'%':'';
                card.status.textContent=tr(job.state==='done'?'Скачивание завершено':job.state==='error'?'Ошибка скачивания':job.state==='cancelled'?'Скачивание отменено':job.state==='queued'?'В очереди':'Скачивание')+' · '+job.completed+'/'+job.files+(active?' · '+job.file+amount:job.error?' · '+job.error:'');
                for(const button of card.buttons)button.disabled=active;
                if(job.state==='done'&&!finished.has(job.id)){finished.add(job.id);clearModelPresence();card.check();}
            }
        }catch{}finally{if(schedule&&alive)timer=setTimeout(poll,1500);}
    }
    for(const group of MODEL_DOWNLOADS){
        const section=el('section'),heading=el('h3','',group.label),items=[];section.append(heading);
        for(const [modelIndex,model] of group.models.entries()){
            const modelId=group.id+':'+modelIndex;
            const article=el('article','acf-model-help-item'),top=el('div','acf-model-help-heading'),title=el('h4','',model.label);
            if(model.optional)title.append(el('span','acf-model-help-optional','Необязательно'));top.append(title);
            const actions=el('div','acf-model-help-actions'),loaded=el('span','acf-model-help-loaded','Загружено');loaded.hidden=true;loaded.setAttribute('role','status');actions.append(loaded);top.append(actions);
            let checkTicket=0;const check=()=>{const ticket=++checkTicket;return modelDownloadStatus(ctx,model).then(status=>{if(ticket===checkTicket)loaded.hidden=status.missing!==false||status.empty===true;}).catch(()=>{if(ticket===checkTicket)loaded.hidden=true;});};checks.push(check);check();
            const buttons=[],download=el('button','acf-model-help-link',model.files.length===1?'Скачать файл':'Скачать комплект');download.type='button';download.addEventListener('click',()=>start(modelId));actions.append(download);buttons.push(download);
            if(model.files.length===1){const direct=downloadLink(model.files[0]);direct.textContent='↗';direct.title='Прямая ссылка';actions.append(direct);}
            const progressRow=el('div','acf-model-help-heading'),status=el('p'),cancel=el('button','acf-model-help-link','Отменить');status.hidden=true;status.style.cssText='overflow-wrap:anywhere;min-width:0;flex:1';status.setAttribute('role','status');cancel.type='button';cancel.hidden=true;progressRow.append(status,cancel);cards.set(modelId,{status,cancel,buttons,check});
            const folder=el('div','acf-model-help-folder'),path=el('code','',model.folder);path.setAttribute('data-no-translate','');folder.append(el('span','','Куда положить:'),path);article.append(top,folder,progressRow);
            if(model.note)article.append(el('p','',model.note));
            if(model.files.length>1){
                const details=el('details'),summary=el('summary');summary.append(el('span','','Файлы комплекта'),el('small','',` (${model.files.length})`));details.append(summary);
                details.open=true;
                for(const [fileIndex,file] of model.files.entries()){const row=el('div','acf-model-help-file'),info=el('div'),name=el('code','',file.name),destination=el('small','',file.path);name.setAttribute('data-no-translate','');destination.setAttribute('data-no-translate','');info.append(name,destination);const fileActions=el('div','acf-model-help-actions'),button=el('button','acf-model-help-link','Скачать файл');button.type='button';button.addEventListener('click',()=>start(modelId,fileIndex));buttons.push(button);const direct=downloadLink(file);direct.textContent='↗';direct.title='Прямая ссылка';fileActions.append(button,direct);row.append(info,fileActions);details.append(row);}
                article.append(details);
            }else{const name=el('code','',model.files[0].name);name.setAttribute('data-no-translate','');const p=el('p');p.append(name);article.append(p);}
            const source=el('a','acf-model-help-source','Страница источника');source.href=model.source;source.target='_blank';source.rel='noopener noreferrer';const sourceRow=el('p');sourceRow.append(source);article.append(sourceRow);section.append(article);items.push({article,model});
        }
        list.append(section);sections.push({section,group,items});
    }
    function filter(){
        const query=search.value.trim().toLocaleLowerCase(),language=ctx.language?.()||'ru';let total=0;
        for(const {section,group,items}of sections){let shown=0;for(const{article,model}of items){const text=[group.label,translateInterface(group.label,language),model.label,translateInterface(model.label,language),model.folder,model.note,...model.files.map(f=>f.name)].join(' ').toLocaleLowerCase();const visible=(select.value==='all'||select.value===group.id)&&(!query||text.includes(query));article.hidden=!visible;if(visible)shown++;}section.hidden=!shown;total+=shown;}
        empty.hidden=total>0;
    }
    search.addEventListener('input',filter);search.addEventListener('keydown',e=>e.stopPropagation());select.addEventListener('change',filter);select.value='all';filter();search.focus();poll();return dialog;
}
