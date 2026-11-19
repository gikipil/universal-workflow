// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow language registry and scoped UI translation, gikipil 2026.
import english,{patterns as englishPatterns} from './locales/en.js';
// Add a dictionary and registry entry here to expose another language in the UI.
export const INTERFACE_LANGUAGES=[{id:'ru',name:'Русский',dictionary:{}},{id:'en',name:'English',dictionary:english,patterns:englishPatterns}];
export const isUniversalInterface=ui=>!!ui?.widgets?.some(w=>w.id==='taskbar'&&w.type==='factorytaskbar_v0215');
const barOf=ui=>ui?.widgets?.find(w=>w.id==='taskbar');
export const interfaceLanguage=ui=>INTERFACE_LANGUAGES.some(l=>l.id===barOf(ui)?.props?.language)?barOf(ui).props.language:'ru';
export function setInterfaceLanguage(ui,id){if(!INTERFACE_LANGUAGES.some(l=>l.id===id))return false;for(const bar of ui.widgets.filter(w=>w.type==='factorytaskbar_v0215')){bar.props||={};bar.props.language=id;}return true;}
const lowerDictionaries=new WeakMap();
const insensitive=d=>{if(!lowerDictionaries.has(d))lowerDictionaries.set(d,new Map(Object.entries(d).map(([k,v])=>[k.toLocaleLowerCase(),v])));return lowerDictionaries.get(d);};
const reverse=new Map(Object.entries(english).map(([ru,en])=>[en,ru]));
export function translateInterface(text,language='ru'){
 if(typeof text!=='string'||!text)return text;
 const dict=INTERFACE_LANGUAGES.find(l=>l.id===language)?.dictionary||{};
 function line(value,depth=0){
  const lead=value.match(/^\s*/)[0],trail=value.match(/\s*$/)[0],trim=value.trim();if(!trim)return value;
  let result=language==='ru'?reverse.get(trim):dict[trim]||dict[reverse.get(trim)]||insensitive(dict).get(trim.toLocaleLowerCase());if(result&&language!=='ru'&&/^[а-яё]/u.test(trim))result=result[0].toLowerCase()+result.slice(1);
  if(result)return lead+result+trail;
  for(const[pattern,replacement]of INTERFACE_LANGUAGES.find(l=>l.id===language)?.patterns||[])if(pattern.test(trim))return lead+trim.replace(pattern,replacement)+trail;
  if(depth>3)return value;
  const decoration=trim.match(/^([^\p{L}\p{N}]+)(.+)$/u);
  if(decoration){const translated=line(decoration[2],depth+1);if(translated!==decoration[2])return lead+decoration[1]+translated+trail;}
  const numbered=trim.match(/^(\d+\s*[·:]\s*)(.+)$/);
  if(numbered)return lead+numbered[1]+line(numbered[2],depth+1)+trail;
  if(trim.endsWith(' ·'))return lead+line(trim.slice(0,-2),depth+1)+' ·'+trail;
  const count=trim.match(/^(\d+\s+)([А-Яа-яЁё].*)$/);if(count)return lead+count[1]+line(count[2],depth+1)+trail;
  if(trim.includes(' · '))return lead+trim.split(' · ').map(s=>line(s,depth+1)).join(' · ')+trail;
  const dynamic=trim.match(/^(.*?)(\s+(?:[0-9]+(?:[.,][0-9]+)?(?:\s*(?:%|px|МП|MP))?|v[0-9.]+|✓))$/);
  if(dynamic){const translated=line(dynamic[1],depth+1);if(translated!==dynamic[1])return lead+translated+dynamic[2]+trail;}
  if(trim.endsWith(':')){const translated=line(trim.slice(0,-1),depth+1);if(translated!==trim.slice(0,-1))return lead+translated+':'+trail;}
  return value;
 }
 return text.split('\n').map(s=>line(s)).join('\n');
}
const protectedSelector='pre,code,[contenteditable="true"],[data-no-translate],.ndk-mp-name,.ndk-mp-card,.ndk-media-strip,.ndk-textout';
const isFile=value=>/^(?:https?:|[a-z]:[\\/])/i.test(value)||/\.(?:safetensors|ckpt|pt|pth|gguf|png|jpe?g|webp|mp4|wav|mp3|flac|json)(?:$|[?#])/i.test(value);
export function localizeInterface(root,getLanguage){
 const memory=new WeakMap();let current=getLanguage?.()||'ru',closed=false;
 root.setAttribute?.('data-acf-localized','');
 function translated(target,key,value){let props=memory.get(target);if(!props){props=new Map();memory.set(target,props);}let record=props.get(key);if(!record||value!==record.shown)record={source:value,shown:value};const next=isFile(record.source)?record.source:translateInterface(record.source,current);record.shown=next;props.set(key,record);return next;}
 function blocked(node){const el=node.nodeType===3?node.parentElement:node;return !!el?.closest?.(protectedSelector);}
 function walk(node){
  if(!node||closed||blocked(node))return;
  if(node.nodeType===3){const next=translated(node,'text',node.nodeValue);if(next!==node.nodeValue){const parent=node.parentElement;if(parent?.tagName==='OPTION'&&!parent.hasAttribute('value'))parent.setAttribute('value',parent.value);node.nodeValue=next;}return;}
  if(node.nodeType!==1&&node.nodeType!==11)return;
  if(node!==root&&node.hasAttribute?.('data-acf-localized'))return;
  for(const key of['title','aria-label','placeholder','data-ndtip'])if(node.hasAttribute?.(key)){const value=node.getAttribute(key),next=translated(node,key,value);if(next!==value)node.setAttribute(key,next);}
  if(['INPUT','TEXTAREA','SCRIPT','STYLE'].includes(node.tagName))return;
  for(const child of node.childNodes||[])walk(child);
 }
 const update=()=>{if(closed)return;current=getLanguage?.()||'ru';root.setAttribute?.('lang',current);walk(root);};
 const observer=typeof MutationObserver==='undefined'?null:new MutationObserver(records=>{const lang=getLanguage?.()||'ru';if(lang!==current){update();return;}for(const r of records){if(r.type==='childList'){for(const node of r.addedNodes)walk(node);}else walk(r.target);}});
 observer?.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','data-ndtip']});update();
 return{update,destroy(){closed=true;observer?.disconnect();}};
}
