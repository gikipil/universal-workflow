// SPDX-License-Identifier: AGPL-3.0-only
// Selected-model checks use actual loader values, never catalog destination paths.
import {checkModelPresence,checkSelectedBundle} from './model_presence.js';
const norm=v=>String(v??'').replace(/\\/g,'/').toLowerCase();
const base=v=>norm(v).split('/').pop();
export async function modelDownloadStatus(ctx,model){
 const names=new Set(model.files.map(f=>base(f.name))),destination=norm(model.folder).replace(/\/$/,''),expected=base(destination);
 const requiredFiles=model.files.map(f=>f.path.startsWith(model.folder)?f.path.slice(model.folder.length):f.name).filter(f=>!/(^|\/)(license|llama_license|llama_use_policy\.md|readme\.md)$/i.test(f));
 const folder=destination.startsWith('models/')?destination.split('/')[1]:'auto';
 const slots=model.slots?.length?model.slots:Object.keys(ctx.w?.slots||{});
 for(const slot of slots){
  let value,state;try{value=ctx.get(slot);state=ctx.info(slot);}catch{continue;}
  if(state?.lost||value==null||['','none','null'].includes(norm(value)))continue;
  if(slot==='caption_config'){
   let config;try{config=JSON.parse(value);}catch{continue;}
   const kind=destination.includes('/joycaption/')?'joy':destination.includes('/qwen/')?'qwen':'florence',chosen=config.models?.[kind];
   if(base(chosen)!==expected)continue;
   return checkSelectedBundle(kind,chosen,requiredFiles);
  }
  if(model.files.length===1&&names.has(base(value)))return checkModelPresence(folder,value,state||{});
  const kind=slot==='aud_model'?'higgs':slot==='aud_whisper'?'whisper':null;
  if(kind){
   const alias=kind==='higgs'&&value==='Higgs Audio v3 TTS 4B - bosonai (auto-download)'||kind==='whisper'&&norm(value).replace(' (auto-download)','')===expected.replace('openai_','');
   if(!alias&&base(value)!==expected&&!(kind==='higgs'&&value==='local root: ComfyUI/models/higgsv3tts'))continue;
   return checkSelectedBundle(kind,value,requiredFiles);
  }
  if(base(value)===expected){const status=await checkModelPresence(folder,value,state||{});if(status.missing===false&&!status.empty)return status;}
 }
 // This backend has a fixed model rather than a file selector.
 if(destination.includes('/tts/qwen3-tts/'))return checkSelectedBundle('tts','VoiceDesign',requiredFiles);
 return{missing:null};
}
