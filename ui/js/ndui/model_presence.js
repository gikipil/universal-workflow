// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-13.
import {api} from '../../../scripts/api.js';
const TTL=30000,cache=new Map();let revision=0;
export const modelPresenceVersion=()=>revision;
const normalize=v=>String(v??'').replace(/\\/g,'/').replace(/^\.\//,'');
const empty=v=>v==null||['','none','null'].includes(String(v).trim().toLowerCase());
export const shouldCheckModelPresence=(folder,required=false)=>folder!=='loras'||required===true;
export function clearModelPresence(){cache.clear();revision++;}
export async function checkSelectedBundle(kind,value,files,fresh=false){
 const key=JSON.stringify(['bundle',kind,value,files]),old=cache.get(key),now=Date.now();if(!fresh&&old&&now-old.at<TTL)return old.promise;
 const promise=(async()=>{try{const response=await api.fetchApi('/universal/models/selected',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,value,files})});if(!response.ok)return{missing:null};const result=await response.json();return{missing:typeof result.missing==='boolean'?result.missing:null,reason:'Не найден полный комплект выбранной модели: '+value};}catch{return{missing:null};}})();cache.set(key,{at:now,promise});return promise;
}
function list(folder,fresh=false){const now=Date.now(),old=cache.get(folder);if(!fresh&&old&&now-old.at<TTL)return old.promise;
 const promise=(async()=>{try{const response=await api.fetchApi('/models/'+encodeURIComponent(folder));if(response.status===404)return new Set();if(!response.ok)return null;const data=await response.json();return Array.isArray(data)&&data.every(x=>typeof x==='string')?new Set(data.map(normalize)):null;}catch{return null;}})();cache.set(folder,{at:now,promise});return promise;
}
export async function checkModelPresence(folder,value,state={},fresh=false,required=folder!=='loras'){
 if(state.lost)return{missing:true,reason:'Привязка к ноде или параметру потеряна.'};
 if(empty(value))return{missing:required===true,empty:true,reason:required?'Не выбран обязательный файл.':''};
 const node=state.p?.node||state.node,kind=node?.comfyClass||node?.type||'',key=state.p?.name||'',name=normalize(value);let target=folder;
 if(kind==='HiggsV3LoadModel')return checkSelectedBundle('higgs',value,undefined,fresh);
 if(kind==='HiggsV3WhisperTranscribe')return checkSelectedBundle('whisper',value,undefined,fresh);
 if(kind==='DWPreprocessor'&&['bbox_detector','pose_estimator'].includes(key)){
  const files=await list('custom_nodes',fresh);if(!files)return{missing:null};
  const repo=key==='bbox_detector'?(name==='yolox_l.onnx'?'yzd-v/DWPose':name.includes('yolox')?'hr16/yolox-onnx':'hr16/yolo-nas-fp16'):(name==='dw-ll_ucoco_384.onnx'?'yzd-v/DWPose':name.endsWith('.onnx')?'hr16/UnJIT-DWPose':'hr16/DWPose-TorchScript-BatchSize5');
  const suffix='/ckpts/'+repo+'/'+name,found=[...files].some(p=>p.endsWith(suffix));return{missing:!found,reason:'Файл детектора не установлен: '+value+'. DWPose может скачать его при запуске.'};
 }
 if(kind==='RMBG'){
  const requirements={'RMBG-2.0':['RMBG-2.0/config.json','RMBG-2.0/model.safetensors','RMBG-2.0/birefnet.py','RMBG-2.0/BiRefNet_config.py'],INSPYRENET:['INSPYRENET/inspyrenet.safetensors'],BEN:['BEN/model.py','BEN/BEN_Base.pth'],BEN2:['BEN2/BEN2.py','BEN2/BEN2_Base.pth']}[value];
  const files=await list('rmbg',fresh);return{missing:!requirements?true:files?!requirements.every(f=>files.has(normalize(f))):null,reason:'Не найдены файлы модели удаления фона: '+value+'. Нода может скачать их при запуске.'};
 }
 if(/^SeedVR2Load/.test(kind))target='seedvr2';
 if(kind==='UltralyticsDetectorProvider')target='ultralytics';
 if(target&&target!=='auto'){const files=await list(target,fresh);return{missing:files? !files.has(name):null,reason:files?'Файл модели не найден: '+value:'Не удалось проверить доступность модели.'};}
 const options=state.options;if(Array.isArray(options)&&!options.some(v=>normalize(v)===name))return{missing:true,reason:'Выбранная модель отсутствует в доступном списке: '+value};
 // A saved COMBO option is not proof that its file still exists.
 return{missing:null,reason:'Не удалось проверить доступность модели.'};
}
export async function requireModelPresence(folder,value,state={},fresh=true){const status=await checkModelPresence(folder,value,state,fresh,true);if(status.missing!==false)throw Error(status.reason||'Не удалось проверить доступность модели.');return status;}
export function lostModelBadge(el){const badge=el('span','','потеряно');badge.hidden=true;badge.setAttribute('role','status');Object.assign(badge.style,{display:'none',flex:'0 0 auto',alignSelf:'center',background:'#ff7078',color:'#26090d',fontSize:'11px',lineHeight:'16px',fontWeight:'700',borderRadius:'8px',padding:'0 6px',whiteSpace:'nowrap'});return badge;}
export function paintModelBadge(badge,status){
 const missing=status?.missing===true,unknown=status?.missing==null,visible=missing||unknown,kind=missing?'missing':unknown?'unknown':'hidden';
 if(badge._acfPresenceKind!==kind){badge._acfPresenceKind=kind;badge.textContent=unknown?'не проверено':'потеряно';}
 badge.hidden=!visible;badge.style.display=visible?'inline-flex':'none';badge.style.background=unknown?'#e8c56a':'#ff7078';badge.style.color=unknown?'#2b2109':'#26090d';
 badge.title=visible?status?.reason||(unknown?'Не удалось проверить доступность модели.':'Файл модели не найден.'):'';
}
