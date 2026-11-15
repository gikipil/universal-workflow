// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-15: local image dataset captions.
import {api} from '../../../scripts/api.js';
import {app} from '../../../scripts/app.js';
import {events} from './events.js';
export const captionState={rows:[],session:'',running:false,status:'Готово',selected:0,error:''};
let currentNode='',promptId='';
export async function captionRequest(path,data){const r=await api.fetchApi('/universal-caption/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});let out;try{out=await r.json();}catch{throw Error('Модуль датасета недоступен. Установи ComfyUI-Universal-Caption и перезапусти ComfyUI.');}if(!r.ok)throw Error(out.error||'Не удалось выполнить действие.');return out;}
export function readCaption(node){return JSON.parse(node.widgets.find(w=>w.name==='settings').value);}
export function captionFiles(node){const c=readCaption(node),photo=node.graph.getNodeById(node.properties.acf_caption.photo);return{...c,image_name:photo.widgets.find(w=>w.name==='image').value};}
export function acceptCaptions(result){captionState.rows=result.rows||[];captionState.session=result.session||'';captionState.selected=0;captionState.error='';events.version++;}
export async function scanCaptions(node){acceptCaptions(await captionRequest('scan',captionFiles(node)));captionState.status='Файлов: '+captionState.rows.length;}
export async function saveCaption(row){const result=await captionRequest('save',{session:captionState.session,index:row.index,caption:row.caption});if(result.ok)row.status='saved';events.version++;}
export async function queueCaption(node){
 if(captionState.running)throw Error('Дождись завершения captioning.');
 const c=captionFiles(node);if(c.source==='folder'&&!c.folder.trim())throw Error('Укажи папку на ПК с ComfyUI.');if(c.source==='single'&&(!c.image_name||c.image_name==='universal-local-empty-mask.png'))throw Error('Загрузи фото.');
 const check=await api.fetchApi('/object_info/UniversalCaptionTask');const meta=await check.json();if(!meta.UniversalCaptionTask)throw Error('Нужен перезапуск ComfyUI после установки модуля датасета.');
 currentNode=String(node.id);captionState.running=true;captionState.error='';captionState.status='Загрузка модели и подготовка';events.version++;
 try{const data={output:{[node.id]:{class_type:'UniversalCaptionTask',inputs:{settings:JSON.stringify(c)}}},workflow:node.graph.serialize()};const r=await api.queuePrompt(0,data,{partialExecutionTargets:[String(node.id)]});if(r.node_errors&&Object.keys(r.node_errors).length)throw Error(JSON.stringify(r.node_errors));promptId=r.prompt_id;}catch(e){captionState.running=false;captionState.error=e.message;throw e;}
}
api.addEventListener('universal-caption-progress',e=>{const d=e.detail;if(String(d.node)!==currentNode)return;if(d.rows)acceptCaptions(d);else if(d.row)captionState.rows[d.row.index]=d.row;captionState.status=`Обработано ${d.value}/${d.max}`;events.version++;});
api.addEventListener('executed',e=>{if(String(e.detail.node)!==currentNode)return;const text=e.detail.output?.text?.[0];if(text){try{acceptCaptions(JSON.parse(text));captionState.status='Готово · '+captionState.rows.length+' фото';}catch{captionState.error='Не удалось прочитать подписи.';}}captionState.running=false;});
for(const type of ['execution_error','execution_interrupted'])api.addEventListener(type,e=>{if(e.detail.prompt_id!==promptId&&String(e.detail.node_id)!==currentNode)return;captionState.running=false;captionState.error=e.detail.exception_message||'Обработка остановлена.';});
