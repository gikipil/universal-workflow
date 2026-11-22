// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {el} from './util.js';
import {checkModelPresence,lostModelBadge,paintModelBadge,modelPresenceVersion} from '../model_presence.js';
const K=['k_model','k_clip','k_vae','k_turbo'],Z=['z_model','z_clip','z_vae'],POSE=['pose_lora','pose_bbox','pose_estimator'];
const SCOPE={video:['vid_model','vid_clip','vid_video_vae','vid_audio_vae','vid_turbo','vid_latent_upscaler'],outpaint:['out_k_model','k_clip','k_vae','edit_model','edit_clip','edit_vae','edit_q21_model','edit_q21_clip','edit_q21_vae'],automask:['sam_model'],generation:[...K,'k_turbo_model',...POSE],refine:[...K,...Z],local:[...K,...Z,'sam_model','face_detector','hand_detector'],upscale:[...K,'up_simple_model','up_ultimate_model','up_seed_dit','up_seed_vae'],edit:[...K,'edit_model','edit_clip','edit_vae','edit_q21_model','edit_q21_clip','edit_q21_vae'],pose:POSE};
export function modeFileSlots(scope){return[...SCOPE[scope].map(key=>({id:'status_'+key,label:key,accepts:['COMBO'],required:false})),...(scope==='generation'?[{id:'status_pose',accepts:['STRING'],required:false}]:[])];}
function config(ctx){try{return JSON.parse(ctx.get('config')||'{}');}catch{return{};}}
export function modeModelKeys(ctx,scope){
 const c=['generation','refine'].includes(scope)?{}:config(ctx),mode=['generation','refine'].includes(scope)?Number(ctx.get('mode'))||0:0;
 if(scope==='video')return['vid_model','vid_clip','vid_video_vae','vid_audio_vae','vid_turbo','vid_latent_upscaler'];
 if(scope==='outpaint')return c.backend==='krea'?['out_k_model','k_clip','k_vae']:c.backend==='qwen21'?['edit_q21_model','edit_q21_clip','edit_q21_vae']:['edit_model','edit_clip','edit_vae'];
 if(scope==='automask')return['sam_model'];
 if(scope==='generation'){let pose=false;try{pose=!!ctx.w?.slots?.status_pose&&JSON.parse(ctx.get('status_pose')||'{}').enabled===true;}catch{}return[...(mode<2&&ctx.get('lightweight')===true?['k_turbo_model','k_clip','k_vae']:K),...(pose?POSE:[])];}
 if(scope==='refine')return mode===0?[]:mode<3?K:Z;
 if(scope==='local')return[...(c.model===1?K:Z),...(c.modes?.face?.enabled?['face_detector']:[]),...(c.modes?.hands?.enabled?['hand_detector']:[]),...(c.modes?.sam?.enabled?['sam_model']:[])];
 if(scope==='upscale')return c.mode===2?['up_seed_dit','up_seed_vae']:c.mode===1?[...K,'up_ultimate_model']:c.simple===1?[]:['up_simple_model'];
 if(scope==='edit')return c.backend==='qwen21'?['edit_q21_model','edit_q21_clip','edit_q21_vae']:c.backend==='krea'?K:['edit_model','edit_clip','edit_vae'];
 if(scope==='pose')return c.enabled?POSE:[];
 return[];
}
const folder=key=>key==='vid_latent_upscaler'?'latent_upscale_models':key==='k_turbo'||key==='pose_lora'||key==='vid_turbo'?'loras':key==='sam_model'?'checkpoints':key.startsWith('pose_')||key.endsWith('_detector')||key.startsWith('up_seed_')?'auto':key==='up_simple_model'||key==='up_ultimate_model'?'upscale_models':key.endsWith('_clip')?'text_encoders':key.endsWith('_vae')?'vae':'diffusion_models';
// Uses the same file bindings and cached catalogs as Settings. Never mutates a node.
export function mountModePresence(ctx,host,scope){
 const badge=lostModelBadge(el);host.append(badge);let alive=true,ticket=0,stamp='',at=0,pending=null;
 function update(){
  if(!alive)return Promise.resolve();
  const entries=modeModelKeys(ctx,scope).filter(key=>ctx.w?.slots?.['status_'+key]).map(key=>{const id='status_'+key;return{key,value:ctx.get(id),state:ctx.info(id)};});
  const signature=JSON.stringify([modelPresenceVersion(),entries.map(e=>[e.key,e.value,!!e.state?.lost])]),now=Date.now();
  if(signature===stamp&&now-at<30000)return pending||Promise.resolve();
  if(signature!==stamp)paintModelBadge(badge,{missing:false});stamp=signature;at=now;const version=++ticket;
  pending=Promise.all(entries.map(async e=>{const empty=e.value==null||['','none','null'].includes(String(e.value).trim().toLowerCase());const status=empty?{missing:true,reason:'Не выбран обязательный файл.'}:await checkModelPresence(folder(e.key),e.value,e.state||{});return{...e,status};})).then(results=>{
   if(!alive||version!==ticket)return;const missing=results.filter(e=>e.status.missing===true),reason=missing.map(e=>e.value?e.status.reason+' ('+e.value+')':e.status.reason).join('\n');paintModelBadge(badge,{missing:missing.length>0,reason});if(missing.length)badge.title=reason+'\nВыбери файлы в общих настройках.';badge.setAttribute('aria-label',missing.length?'Потеряны обязательные файлы: '+missing.map(e=>e.value||e.key).join(', '):'');
  }).catch(()=>{if(alive&&version===ticket)paintModelBadge(badge,{missing:false});});return pending;
 }
 update();return{update,destroy(){alive=false;ticket++;badge.remove();}};
}
export function modeLabel(host){Object.assign(host.style,{display:'flex',alignItems:'center',justifyContent:'center',flexWrap:'wrap',columnGap:'5px',rowGap:'0',minWidth:'0',lineHeight:'18px'});const text=el('span');Object.assign(text.style,{minWidth:'0',maxWidth:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'});host.append(text);return text;}
