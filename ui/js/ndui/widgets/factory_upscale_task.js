// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-14.
import {el} from './util.js';
import {generate} from './run.js';
import {factoryprogress_v037} from './factory_progress.js';
import {factoryDialog} from './factory_dialog.js';
import {queueUpscale,upscaleProgress} from '../factory_upscale_run.js';
export const factoryupprogress_v080={...factoryprogress_v037,type:'factoryupprogress_v080',mount:ctx=>factoryprogress_v037.mount({...ctx,progress:upscaleProgress})};
export const factoryuprun_v080={...generate,type:'factoryuprun_v080',slots:[{id:'config',accepts:['STRING'],required:true}],mount(ctx){let dialog,alive=true;const inst=generate.mount({...ctx,queue:async batch=>{const st=ctx.info('config');try{await queueUpscale(st.p?.node||st.node,batch);}catch(e){if(!alive)return;dialog?.close();dialog=factoryDialog(ctx,{title:'Апскейл',width:520});dialog.body.append(el('p','',e.message||String(e)));}}});return{...inst,destroy(){alive=false;inst.destroy?.();dialog?.close();}};}};
