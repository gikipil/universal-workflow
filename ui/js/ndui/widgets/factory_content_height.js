// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-18: fit native panels to their content.
export function fitFactoryContent(ctx,root,{min=256}={}){
 root.style.flex='0 0 auto';ctx.body.style.justifyContent='flex-start';
 let alive=true,frame=null,fallback=min;
 const measure=()=>{frame=null;if(!alive)return;const measured=Number(root.offsetHeight)||0;if(measured>0){const scale=Number(ctx.ks?.())||1,unit=Number(ctx.unitPx?.())||1;ctx.setContentHeight?.(Math.max(min,Math.ceil((Math.max(measured,Number(root.scrollHeight)||0)+2)*scale/unit)));}else if(root.offsetHeight==null)ctx.setContentHeight?.(Math.max(min,fallback));};
 const update=value=>{if(Number.isFinite(value))fallback=value;if(frame!=null)return;if(typeof requestAnimationFrame==='function')frame=requestAnimationFrame(measure);else measure();};
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(()=>update()):null;observer?.observe(root);
 return{update,destroy(){alive=false;observer?.disconnect();if(frame!=null&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(frame);frame=null;}};
}
