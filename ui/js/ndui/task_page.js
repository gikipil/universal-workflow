// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-13.
import {adaptedUi} from './adapt.js';
export function taskPageUi(ui,page,scope=null){if(scope)return ui;const bar=ui.widgets?.find(w=>w.page===page&&w.type==='factorytaskbar_v0215'),height=Number(bar?.props?.canvasHeight);return height>=480&&height<=16000?{...ui,page:{...ui.page,h:height}}:ui;}

// Reserve the header before distributing extra viewport height. Native vertical
// adaptation also grows the gaps above navigation on short pages.
export function adaptTaskPageUi(ui,page,width,height){
    const wide=adaptedUi(ui,page,width);
    if(!(height>ui.page.h+.01))return wide;
    const roots=wide.widgets.filter(w=>w.page===page&&!w.parent&&!w.hidden);
    const bar=roots.find(w=>w.type==='factorytaskbar_v0215');
    if(!bar)return adaptedUi(ui,page,width,height);
    const body=roots.filter(w=>w.y>=bar.y+bar.h);
    if(!body.length)return wide;
    const top=Math.min(...body.map(w=>w.y));
    if(!(top>0&&ui.page.h>top))return wide;
    const header=new Set(roots.filter(w=>w.y<top).map(w=>w.id));
    const local={...wide,page:{...wide.page,h:wide.page.h-top},widgets:wide.widgets.filter(w=>!header.has(w.id)).map(w=>w.page===page&&!w.parent?{...w,y:w.y-top}:w)};
    const stretched=adaptedUi(local,page,local.page.w,height-top);
    const mapped=new Map(stretched.widgets.map(w=>[w.id,w]));
    return {...wide,widgets:wide.widgets.map(w=>{
        if(w.page!==page||header.has(w.id))return w;
        const next=mapped.get(w.id);
        return !next.parent?{...next,y:next.y+top}:next;
    })};
}
