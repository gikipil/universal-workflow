import {themeInterface} from '../factory_palette.js';
import {localizeInterface} from '../factory_locale.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
import {el,closePopup} from './util.js';
import {applyVars} from '../kit.js';
import {APPEARANCE_CONTROL_CSS} from '../factory_appearance.js';
const stack=[];
export function gearIcon() {
    const gear=el('span');gear.style.display='inline-flex';
    gear.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 3-1 2 3 3-1 1-3 3-1 2-3-2-2 1-3-3-2-3 1-2-3Z"/><circle cx="12" cy="12" r="3.2"/></svg>';return gear;
}
export function factoryDialog(ctx,{title,width=1060,onClose=()=>{}}) {
    closePopup();
    const root=el('div','ndk acf-dialog-root'),windowBox=el('section','acf-dialog-window'),head=el('header','acf-dialog-head'),heading=el('strong','',title),x=el('button','acf-dialog-close','×'),body=el('div','acf-dialog-body'),footer=el('footer','acf-dialog-footer');
    Object.assign(root.style,{position:'fixed',inset:'0',zIndex:String(1100000+stack.length*1000),display:'grid',placeItems:'center',background:'#050810b8',backdropFilter:'blur(6px)',padding:'16px',boxSizing:'border-box'});
    Object.assign(windowBox.style,{width:`min(${width}px,calc(100vw - 32px))`,maxHeight:'calc(100dvh - 32px)',minHeight:'0',display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto',background:'#191d28',border:'1px solid #6c5597',borderRadius:'18px',boxShadow:'0 24px 90px #000b',color:'#eee7f7',fontFamily:'Inter,system-ui,sans-serif',fontSize:'14px',boxSizing:'border-box'});
    Object.assign(head.style,{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',padding:'18px 20px',borderBottom:'1px solid #453451'});heading.style.fontSize='19px';
    x.type='button';x.setAttribute('aria-label','Закрыть окно');Object.assign(x.style,{width:'36px',height:'36px',border:'1px solid #715166',borderRadius:'10px',background:'#302332',color:'#f5c4d2',fontSize:'24px',cursor:'pointer'});
    Object.assign(body.style,{padding:'20px',overflowY:'auto',minHeight:'0'});Object.assign(footer.style,{padding:'0 20px 20px'});
    root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',title);root.tabIndex=-1;head.append(heading,x);windowBox.append(head,body,footer);root.append(windowBox);applyVars(root,ctx.vars());
    const visual=ctx.appearanceControls?.()||{};root.classList.toggle('acf-visual-font',!!visual.font);root.classList.toggle('acf-visual-density',!!visual.density);root.classList.toggle('acf-visual-style',!!visual.style);root.classList.toggle('acf-motion-fast',visual.animations==='fast');root.classList.toggle('acf-motion-off',visual.animations==='off');root.setAttribute('data-field-style',visual.style||'soft');windowBox.style.fontFamily='var(--ndk-font,Inter,system-ui,sans-serif)';windowBox.style.fontSize='var(--ndk-fs,14px)';const visualStyle=el('style');visualStyle.textContent=APPEARANCE_CONTROL_CSS;root.append(visualStyle);
    const palette=typeof ctx.colorProfile==='function'?themeInterface(root,()=>ctx.colorProfile()):null;
    const localization=localizeInterface(root,()=>ctx.language?.()||ctx.appearanceControls?.().language||'ru');
    const previous=document.activeElement,overflow=document.body.style.overflow;let closed=false;
    const dialog={root,body,footer,heading,close(){
        if(closed)return;const index=stack.indexOf(dialog);for(const child of stack.slice(index+1).reverse())child.close();
        closed=true;localization.destroy();palette?.destroy();if(root.querySelector('.ndk-pop'))closePopup();stack.splice(stack.indexOf(dialog),1);window.removeEventListener('keydown',key,true);root.remove();document.body.style.overflow=overflow;if(previous?.isConnected!==false)previous?.focus?.();onClose();
    }};
    function key(event) {
        if(stack.at(-1)!==dialog||root.querySelector('.ndk-pop'))return;
        if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();}
        if(event.key==='Tab'){
            const controls=[...root.querySelectorAll('button,input,textarea,select,a[href],summary,[tabindex="0"]')].filter(e=>!e.disabled&&e.getClientRects().length);const first=controls[0],last=controls.at(-1);if(!first)return;
            if(event.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){event.preventDefault();last.focus();}
            else if(!event.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){event.preventDefault();first.focus();}
        }
    }
    stack.push(dialog);x.addEventListener('click',dialog.close);root.addEventListener('pointerdown',event=>{if(event.target===root&&stack.at(-1)===dialog)dialog.close();});window.addEventListener('keydown',key,true);document.body.append(root);document.body.style.overflow='hidden';x.focus();return dialog;
}
