import {interfaceLanguage,translateInterface} from './factory_locale.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow by gikipil, 2026-11-24.
import {clearModelPresence,requireModelPresence} from './model_presence.js';
const FIELDS={
    UNETLoader:[['unet_name','diffusion_models']],
    UniversalMiniMaxGGUF:[['unet_name','universal_minimax_gguf']],
    UnetLoaderGGUF:[['unet_name','diffusion_models']],
    CLIPLoader:[['clip_name','text_encoders']],
    DualCLIPLoader:[['clip_name1','text_encoders'],['clip_name2','text_encoders']],
    TripleCLIPLoader:[['clip_name1','text_encoders'],['clip_name2','text_encoders'],['clip_name3','text_encoders']],
    VAELoader:[['vae_name','vae']],
    CheckpointLoaderSimple:[['ckpt_name','checkpoints']],
    UpscaleModelLoader:[['model_name','upscale_models']],
    SeedVR2LoadDiTModel:[['model','seedvr2']],
    SeedVR2LoadVAEModel:[['model','seedvr2']],
    UltralyticsDetectorProvider:[['model_name','ultralytics']],
    SelfLiftAvatarH3Sampler:[['upscaler_model','latent_upscale_models']],
};
const empty=value=>value==null||['','none','null'].includes(String(value).trim().toLowerCase());
export async function validatePromptModels(data,targets){
    // Inspect the compiled active branch only. Unused tabs and bypassed stages
    // must not demand models. No model is loaded or path silently substituted.
    clearModelPresence();
    const nodes=new Map((data.workflow?.nodes||[]).map(n=>[String(n.id),n]));
    const checks=[],seen=new Set(),editAdapters=new Set((data.workflow?.nodes||[]).map(n=>n.properties?.acf_edit?.kreaAdapter).filter(id=>id!=null).map(String));
    function add(id,node,key,folder,value){
        if(Array.isArray(value))return; // Runtime-provided filename: native validation handles it.
        const signature=JSON.stringify([folder,value]);if(seen.has(signature))return;seen.add(signature);
        checks.push(()=>requireModelPresence(folder,value,{p:{node:nodes.get(id)||{type:node.class_type},name:key}},false));
    }
    const output=data.output||{},active=new Set();
    function scalar(value,seen=new Set()){
        if(!Array.isArray(value))return value;
        const id=String(value[0]);if(seen.has(id))return undefined;seen.add(id);
        const node=output[id];return /^Primitive/.test(node?.class_type||'')?scalar(node.inputs?.value,seen):undefined;
    }
    function visit(id){
        id=String(id);if(active.has(id)||!output[id])return;active.add(id);
        const node=output[id],inputs=node.inputs||{};let chosen=null;
        if(node.class_type==='easy anythingIndexSwitch'||node.class_type==='ComfySwitchNode'){
            const index=scalar(inputs.index),toggle=scalar(inputs.switch);
            if(Number.isInteger(index))chosen='value'+index;
            else if(typeof toggle==='boolean')chosen=toggle?'on_true':'on_false';
        }
        for(const[key,value]of Object.entries(inputs)){
            if(chosen&&(/^(?:value\d+|on_true|on_false)$/.test(key))&&key!==chosen)continue;
            if(Array.isArray(value)&&value.length===2&&typeof value[1]==='number')visit(value[0]);
        }
    }
    if(Array.isArray(targets)&&targets.length)for(const id of targets)visit(id);else for(const id of Object.keys(output))visit(id);
    for(const[id,node]of Object.entries(output)){
        if(!active.has(id))continue;
        for(const[key,folder]of FIELDS[node.class_type]||[])add(id,node,key,folder,node.inputs?.[key]);
        if(['LoraLoader','LoraLoaderModelOnly','LoraLoaderBypassModelOnly'].includes(node.class_type)&&node.inputs?.strength_model!==0&&(node.class_type==='LoraLoaderBypassModelOnly'||!empty(node.inputs?.lora_name))){
            add(id,node,'lora_name','loras',node.inputs?.lora_name);
        }
        if(node.class_type==='Power Lora Loader (rgthree)'){
            const required=editAdapters.has(id)||/turbo|pose-lora/.test(nodes.get(id)?.properties?.nd_ui_src?.tag||'');
            const rows=Object.entries(node.inputs||{}).filter(([key,row])=>/^lora_\d+$/.test(key)&&row&&typeof row==='object'&&'lora' in row);
            if(required&&!rows.some(([,row])=>row.on!==false&&!empty(row.lora)))add(id,node,'lora','loras',null);
            for(const[key,row]of rows)if(row.on!==false&&row.strength!==0&&!empty(row.lora))add(id,node,key,'loras',row.lora);
        }
    }
    // Shared folder inventories are cached within this validation pass.
    try{for(const check of checks)await check();}catch(error){const ui=data.workflow?.extra?.nd_ui||data.workflow?.nodes?.find(n=>n.properties?.nd_ui)?.properties.nd_ui;throw Error(translateInterface(error.message,interfaceLanguage(ui)));}
}
