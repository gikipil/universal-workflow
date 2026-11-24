// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (c) 2026 gikipil
import {fileUrl,refFromName} from './media/io.js';
import {readVideoMedia} from './factory_video_params.js';

export function firstVideoFrame(node){return readVideoMedia(node).first[0]?.file?.trim()||'';}
export function videoFrameDimensions(width,height){
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>4096||height>4096)throw Error('Размер первого кадра должен быть не больше 4096 px по каждой стороне.');
    return{width:Math.max(32,Math.round(width/32)*32),height:Math.max(32,Math.round(height/32)*32),sourceWidth:width,sourceHeight:height};
}
export async function readFirstVideoFrameSize(node){
    const file=firstVideoFrame(node);if(!file)return null;
    const ref=refFromName(file);if(!ref)throw Error('Не удалось прочитать размер первого кадра.');
    return new Promise((resolve,reject)=>{
        const image=new Image();
        const finish=(error,value)=>{clearTimeout(timer);image.onload=null;image.onerror=null;image.src='';error?reject(error):resolve(value);};
        const timer=setTimeout(()=>finish(Error('Не удалось прочитать размер первого кадра.')),20000);
        image.onload=()=>{try{const size=videoFrameDimensions(image.naturalWidth,image.naturalHeight);finish(null,{...size,file});}catch(error){finish(error);}};
        image.onerror=()=>finish(Error('Не удалось прочитать размер первого кадра.'));
        const url=fileUrl(ref);image.src=url+(url.includes('?')?'&':'?')+'frameSize='+Date.now();
    });
}
