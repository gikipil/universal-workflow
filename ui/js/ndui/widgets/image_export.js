// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-17: remove graph metadata without re-encoding pixels.
import {fileUrl,downloadRef,downloadUrl} from '../media/io.js';
export function withoutWorkflowPng(buffer){
 const bytes=new Uint8Array(buffer),signature=[137,80,78,71,13,10,26,10];
 if(!signature.every((v,i)=>bytes[i]===v))return null;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),parts=[bytes.subarray(0,8)];let offset=8,ended=false;
 while(offset+12<=bytes.length){
  const length=view.getUint32(offset),end=offset+12+length;if(end>bytes.length)throw Error('Повреждённый PNG: неверная длина блока.');
  const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));let drop=false;
  if(['tEXt','zTXt','iTXt'].includes(type)){
   const payload=bytes.subarray(offset+8,offset+8+length),zero=payload.indexOf(0);
   if(zero>=0){const key=String.fromCharCode(...payload.subarray(0,Math.min(zero,80))).toLowerCase();drop=key==='workflow'||key==='prompt';}
  }
  if(!drop)parts.push(bytes.subarray(offset,end));offset=end;if(type==='IEND'){ended=true;break;}
 }
 if(!ended)throw Error('Повреждённый PNG: отсутствует конец изображения.');
 return new Blob(parts,{type:'image/png'});
}
export async function downloadWithoutWorkflow(ref){
 const response=await fetch(fileUrl(ref));if(!response.ok)throw Error('Не удалось получить изображение для скачивания.');
 const original=await response.arrayBuffer(),clean=withoutWorkflowPng(original);
 if(!clean){downloadRef(ref);return;}
 const url=URL.createObjectURL(clean);downloadUrl(url,ref.filename);setTimeout(()=>URL.revokeObjectURL(url),60000);
}
