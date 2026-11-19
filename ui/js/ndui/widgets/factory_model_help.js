// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow model download help, gikipil, 2026-11-20.
import {el} from './util.js';
import {factoryDialog} from './factory_dialog.js';
import {MODEL_DOWNLOADS} from '../factory_model_catalog.js';
import {translateInterface} from '../factory_locale.js';

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
.acf-model-help [hidden]{display:none!important}
@media(max-width:620px){.acf-model-help-tools{grid-template-columns:minmax(0,1fr)}.acf-model-help-file{grid-template-columns:minmax(0,1fr)}.acf-model-help-link{justify-self:start}}
`;
export function downloadLink(file){
    const url=new URL(file.url);
    if(url.protocol!=='https:'||!['huggingface.co','civitai.com'].includes(url.hostname))throw new Error('Invalid model download URL');
    const link=el('a','acf-model-help-link','Скачать файл');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Скачать файл · '+file.name);return link;
}
export function openModelDownloads(ctx,onClose=()=>{}){
    const dialog=factoryDialog(ctx,{title:'Help · Скачать модели',width:1080,onClose}),root=el('div','acf-model-help'),style=el('style');style.textContent=CSS;
    const intro=el('p','','Скачивай только комплекты для нужных режимов. Пути указаны относительно папки ComfyUI. После загрузки выбери файлы в настройках моделей.'),tools=el('div','acf-model-help-tools'),search=el('input'),select=el('select'),list=el('div','acf-model-help-list'),empty=el('p','','Ничего не найдено');
    search.type='search';search.placeholder='Найти модель или файл…';search.setAttribute('aria-label','Поиск моделей для скачивания');select.setAttribute('aria-label','Раздел моделей');
    for(const[id,label]of [['all','Все разделы'],...MODEL_DOWNLOADS.map(g=>[g.id,g.label])]){const option=el('option','',label);option.value=id;select.append(option);}
    tools.append(search,select);root.append(style,intro,tools,list,empty);dialog.body.append(root);
    const sections=[];
    for(const group of MODEL_DOWNLOADS){
        const section=el('section'),heading=el('h3','',group.label),items=[];section.append(heading);
        for(const model of group.models){
            const article=el('article','acf-model-help-item'),top=el('div','acf-model-help-heading'),title=el('h4','',model.label);
            if(model.optional)title.append(el('span','acf-model-help-optional','Необязательно'));top.append(title);
            if(model.files.length===1)top.append(downloadLink(model.files[0]));
            const folder=el('div','acf-model-help-folder'),path=el('code','',model.folder);path.setAttribute('data-no-translate','');folder.append(el('span','','Куда положить:'),path);article.append(top,folder);
            if(model.note)article.append(el('p','',model.note));
            if(model.files.length>1){
                const details=el('details'),summary=el('summary');summary.append(el('span','','Файлы комплекта'),el('small','',` (${model.files.length})`));details.append(summary);
                for(const file of model.files){const row=el('div','acf-model-help-file'),info=el('div'),name=el('code','',file.name),destination=el('small','',file.path);name.setAttribute('data-no-translate','');destination.setAttribute('data-no-translate','');info.append(name,destination);row.append(info,downloadLink(file));details.append(row);}
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
    search.addEventListener('input',filter);search.addEventListener('keydown',e=>e.stopPropagation());select.addEventListener('change',filter);select.value='all';filter();search.focus();return dialog;
}
