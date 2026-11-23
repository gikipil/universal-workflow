// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-24.
// PageView uses absolute frames inside a scaled, scrolling page. Compensate
// that scroll in page coordinates without changing its layout or widget data.
export function mountPinnedNavigation(view) {
    const background=document.createElement('div');
    background.className='acf-pinned-navigation-bg';
    background.setAttribute('aria-hidden','true');
    Object.assign(background.style,{position:'absolute',left:'0',top:'0',width:'100%',pointerEvents:'none',display:'none',zIndex:'990000',background:'var(--acf-bg,var(--ndk-bg,#151a20))',borderBottom:'1px solid var(--acf-border,var(--ndk-border,#35545c))',boxSizing:'border-box'});
    view.pageEl.append(background);
    const pinned=new Map();
    const originalPadding=view.root.style.scrollPaddingTop;
    let closed=false;
    function clear(){
        for(const[f,saved]of pinned){f.frame.style.transform=saved.transform;f.frame.style.zIndex=saved.zIndex;}
        pinned.clear();background.style.display='none';view.root.style.scrollPaddingTop=originalPadding;
    }
    function update(){
        if(closed)return;
        const frames=[...view.frames.values()];
        const bar=frames.find(f=>f.w.type==='factorytaskbar_v0215'&&!f.w.parent&&!f.w.hidden&&view.rectOf(f.w).vis!==false);
        if(view.mode!=='run'||view.scope||!bar){clear();return;}
        const rect=view.rectOf(bar.w),bottom=rect.y+rect.h;
        const selected=frames.filter(f=>{const r=view.rectOf(f.w);return !f.w.parent&&!f.w.hidden&&r.vis!==false&&r.y>=0&&r.y+r.h<=bottom+.5;});
        const scale=view.adaptive()||view.fit!=='fill'?view.geo.s:1;
        const offset=view.root.scrollTop/(scale||1);
        for(const[f,saved]of pinned)if(!selected.includes(f)){f.frame.style.transform=saved.transform;f.frame.style.zIndex=saved.zIndex;pinned.delete(f);}
        for(const f of selected){
            if(!pinned.has(f))pinned.set(f,{transform:f.frame.style.transform||'',zIndex:f.frame.style.zIndex||''});
            f.frame.style.transform=`translateY(${offset}px)`;
            f.frame.style.zIndex=String(990001+Math.max(0,Number(f.w.z)||0));
        }
        background.style.display='';background.style.height=`${bottom*view.geo.py}px`;background.style.transform=`translateY(${offset}px)`;
        view.root.style.scrollPaddingTop=`${bottom*view.geo.py*scale+(view.padTop||0)}px`;
    }
    view.root.addEventListener('scroll',update,{passive:true});
    return {update,destroy(){closed=true;view.root.removeEventListener('scroll',update);clear();background.remove();}};
}
