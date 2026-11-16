// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-17.
// Zoom is relative to the existing contain/fit view, never to the saved image.
export function zoomAt(state, next, point={x:0,y:0}) {
    const scale=Math.max(.25,Math.min(8,next)), ratio=scale/state.scale;
    return {scale,x:point.x-(point.x-state.x)*ratio,y:point.y-(point.y-state.y)*ratio};
}
export function clampPan(state,width,height,imageWidth,imageHeight) {
    const fit=Math.min(width/imageWidth,height/imageHeight);
    const x=Math.max(0,(imageWidth*fit*state.scale-width)/2),y=Math.max(0,(imageHeight*fit*state.scale-height)/2);
    return {...state,x:Math.max(-x,Math.min(x,state.x)),y:Math.max(-y,Math.min(y,state.y))};
}
export function installResultZoom(stage) {
    const tools=document.createElement('div');tools.className='ndk-result-zoom';
    tools.style.cssText='position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:5;display:none;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;max-width:calc(100% - 16px);padding:6px;border:1px solid #397b87;border-radius:10px;background:#151d25eF;color:#e8eaf0;box-shadow:0 3px 12px #0005';
    tools.setAttribute('role','group');tools.setAttribute('aria-label','Масштаб результата');
    const button=(text,label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.title=label;b.style.cssText='height:28px;min-width:28px;padding:0 7px;border:1px solid #39636b;border-radius:6px;background:#202a33;color:#e8eaf0;font:inherit;cursor:pointer';b.addEventListener('click',e=>{e.stopPropagation();fn();});return b;};
    const percent=document.createElement('span');percent.style.cssText='min-width:42px;text-align:center;font:600 12px/28px sans-serif;font-variant-numeric:tabular-nums';
    percent.setAttribute('aria-live','polite');
    const minus=button('−','Отдалить результат',()=>change(state.scale/1.25)),plus=button('+','Приблизить результат',()=>change(state.scale*1.25)),fit=button('Вписать','Вписать результат в рамку',()=>{state={scale:1,x:0,y:0};paint();});
    tools.append(minus,percent,plus,fit);stage.append(tools);
    let image=null,active=false,state={scale:1,x:0,y:0},drag=null,suppressUntil=0,originalDraggable=true;
    const oldTabIndex=stage.getAttribute('tabindex');stage.tabIndex=0;
    const bounds=()=>({width:stage.clientWidth||1,height:stage.clientHeight||1});
    const point=e=>{const r=stage.getBoundingClientRect(),b=bounds();return{x:(e.clientX-r.left)*b.width/(r.width||1)-b.width/2,y:(e.clientY-r.top)*b.height/(r.height||1)-b.height/2};};
    function paint(){
        const b=bounds();if(image?.naturalWidth&&image?.naturalHeight)state=clampPan(state,b.width,b.height,image.naturalWidth,image.naturalHeight);
        percent.textContent=Math.round(state.scale*100)+'%';minus.disabled=state.scale<=.25;plus.disabled=state.scale>=8;
        if(image){image.style.transformOrigin='50% 50%';image.style.transform=`translate(${state.x}px,${state.y}px) scale(${state.scale})`;image.style.cursor=state.scale>1?(drag?'grabbing':'grab'):'zoom-in';image.style.touchAction='none';image.draggable=state.scale>1?false:originalDraggable;}
        tools.style.display=active&&image?'flex':'none';
    }
    function change(scale,p){state=zoomAt(state,scale,p);paint();}
    const wheel=e=>{if(!active||!image||tools.contains(e.target))return;e.preventDefault();e.stopPropagation();const unit=e.deltaMode===1?16:e.deltaMode===2?bounds().height:1;change(state.scale*Math.exp(-Math.max(-300,Math.min(300,e.deltaY*unit))*.002),point(e));};
    const down=e=>{if(!active||!image||state.scale<=1||e.button!==0||tools.contains(e.target))return;e.preventDefault();e.stopPropagation();const p=point(e);drag={id:e.pointerId,point:p,x:state.x,y:state.y,moved:false};stage.setPointerCapture?.(e.pointerId);paint();};
    const move=e=>{if(!drag||e.pointerId!==drag.id)return;const p=point(e),dx=p.x-drag.point.x,dy=p.y-drag.point.y;if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;state.x=drag.x+dx;state.y=drag.y+dy;e.preventDefault();paint();};
    const up=e=>{if(!drag||e.pointerId!==drag.id)return;if(drag.moved)suppressUntil=Date.now()+300;try{stage.releasePointerCapture?.(e.pointerId);}catch{}drag=null;paint();};
    const click=e=>{if(active&&image&&!tools.contains(e.target)&&(state.scale>1||Date.now()<suppressUntil)){e.preventDefault();e.stopImmediatePropagation();}};
    const key=e=>{if(!active||!image||e.target!==stage)return;if(['+','=','-','0'].includes(e.key)){e.preventDefault();e.stopPropagation();if(e.key==='0'){state={scale:1,x:0,y:0};paint();}else change(state.scale*(e.key==='-' ? .8 : 1.25));}};
    stage.addEventListener('wheel',wheel,{passive:false});stage.addEventListener('pointerdown',down);stage.addEventListener('pointermove',move);stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);stage.addEventListener('click',click,true);stage.addEventListener('keydown',key);
    const observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>paint()):null;observer?.observe(stage);
    function setImage(next){if(image===next)return;if(image){image.removeEventListener('load',paint);image.style.transform='';image.style.transformOrigin='';image.style.touchAction='';image.draggable=originalDraggable;}image=next;drag=null;state={scale:1,x:0,y:0};originalDraggable=image?.draggable??true;image?.addEventListener('load',paint);paint();}
    return {setImage,setActive(value){active=!!value;paint();},destroy(){setImage(null);observer?.disconnect();tools.remove();stage.removeEventListener('wheel',wheel);stage.removeEventListener('pointerdown',down);stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerup',up);stage.removeEventListener('pointercancel',up);stage.removeEventListener('click',click,true);stage.removeEventListener('keydown',key);if(oldTabIndex===null)stage.removeAttribute('tabindex');else stage.setAttribute('tabindex',oldTabIndex);}};
}
