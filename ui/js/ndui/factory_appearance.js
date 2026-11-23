import {REFERENCE_PROFILES,ADDITIONAL_PROFILES,isFullPalette,paletteVariables,PROFILE_CSS,mix} from './factory_palette.js';
import {INTERFACE_LANGUAGES,interfaceLanguage,setInterfaceLanguage} from './factory_locale.js';
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
const clone = value => JSON.parse(JSON.stringify(value));
export const APPEARANCE_PROFILES = [
    ...REFERENCE_PROFILES,
    ...ADDITIONAL_PROFILES,
    {id:'standard', name:'Стандартный', description:'Исходная тёмная палитра с бирюзовыми и зелёными акцентами.', bg:'#111318', s1:'#181c23', s2:'#20252d', s3:'#2c333e', border:'#303742', end:'#1b2429', a:'#36cfea', b:'#59e68d'},
];
export function appearanceProfile(ui) {
    const id=ui?.widgets?.find(w => w.id === 'taskbar')?.props?.visualProfile;return APPEARANCE_PROFILES.some(p=>p.id===id)?id:'standard';
}
export const activeAppearanceProfile=ui=>APPEARANCE_PROFILES.find(p=>p.id===appearanceProfile(ui))||APPEARANCE_PROFILES.find(p=>p.id==='standard');
export function applyAppearanceProfile(ui, id) {
    const selected = APPEARANCE_PROFILES.find(p => p.id === id);
    if (!selected) return false;
    const bar = ui.widgets.find(w => w.id === 'taskbar');
    if (!bar) return false;
    bar.props ||= {};
    if (!bar.props.appearanceOriginal) {
        bar.props.appearanceOriginal = clone({theme:ui.theme, bg:ui.page.bg,
            looks:ui.widgets.map(w => [w.id, w.look]), accentA:bar.props.accentA, accentB:bar.props.accentB});
    }
    const original = bar.props.appearanceOriginal;
    ui.theme = clone(original.theme);
    ui.page.bg = clone(original.bg);
    const looks = new Map(original.looks);
    for (const w of ui.widgets) if (looks.has(w.id)) w.look = clone(looks.get(w.id));
    bar.props.accentA = original.accentA;
    bar.props.accentB = original.accentB;
    if (id !== 'standard') {
        const substitutions = new Map([['#111318',selected.bg],['#181c23',selected.s1],['#20252d',selected.s2],['#2c333e',selected.s3],['#303742',selected.border]]);
        const overrides = ui.theme.overrides ||= {};
        Object.assign(overrides, {bg:selected.bg,s1:selected.s1,s2:selected.s2,s3:selected.s3,border:selected.border});
        Object.assign(ui.page.bg, {a:selected.bg,b:selected.end,color:selected.bg});
        for (const w of ui.widgets) for (const key of ['bg','field','border']) {
            const value = w.look?.[key];
            if (typeof value === 'string' && substitutions.has(value.toLowerCase())) w.look[key] = substitutions.get(value.toLowerCase());
        }
        bar.props.accentA = selected.a;
        bar.props.accentB = selected.b;
    }
    if(id!=='standard'){Object.assign(ui.theme.overrides||={}, {bg:selected.bg,s1:selected.s1,s2:selected.s2,s3:selected.s3,border:selected.border,text:selected.text||'#e8eaf0',accent:selected.a,accent2:selected.b});bar.props.accentA=selected.a;bar.props.accentB=selected.b;}
    bar.props.visualProfile = id;
    for(const other of ui.widgets.filter(w=>w.type==='factorytaskbar_v0215'&&w.id!==bar.id)){other.props ||= {};for(const key of ['accentA','accentB','visualProfile'])other.props[key]=bar.props[key];}
    return true;
}

export const APPEARANCE_FONTS=[
 {id:'inter',name:'Inter',family:'"Inter ND", Inter, system-ui, sans-serif'},
 {id:'system',name:'Системный',family:'system-ui, sans-serif'},
 {id:'segoe',name:'Segoe UI · интерфейсный',family:'"Segoe UI", system-ui, sans-serif'},
 {id:'arial',name:'Arial · нейтральный',family:'Arial, Helvetica, sans-serif'},
 {id:'verdana',name:'Verdana · широкий',family:'Verdana, Geneva, sans-serif'},
 {id:'tahoma',name:'Tahoma · компактный',family:'Tahoma, Geneva, sans-serif'},
 {id:'trebuchet',name:'Trebuchet MS · мягкий',family:'"Trebuchet MS", Arial, sans-serif'},
 {id:'georgia',name:'Georgia · с засечками',family:'Georgia, "Times New Roman", serif'},
 {id:'cambria',name:'Cambria · книжный',family:'Cambria, Georgia, serif'},
 {id:'consolas',name:'Consolas · моноширинный',family:'Consolas, "Courier New", monospace'},
 {id:'courier',name:'Courier New · печатный',family:'"Courier New", Courier, monospace'},
];
export const PREVIEW_BACKGROUNDS=[
 {id:'standard',name:'Как в цветовом профиле',background:'#20252d'},
 {id:'dark',name:'Тёмный',background:'#12151b'},
 {id:'gray',name:'Нейтральный серый',background:'#777b82'},
 {id:'light',name:'Светлый',background:'#eceef2'},
 {id:'checker',name:'Шахматный · прозрачность',background:'repeating-conic-gradient(#a6abb3 0 25%,#d8dce2 0 50%)',size:'20px 20px'},
];
export const APPEARANCE_CONTROL_CSS=PROFILE_CSS+`
.acf-visual-font,.acf-visual-font :is(button,input,select,textarea,label){font-family:var(--ndk-font)!important}
.acf-visual-density :is(.ndk-field:not(.ndk-area):not(:has(textarea)),.ndk-chip:not(.acf-fixed-control),.acf-settings-select,.acf-video-input,select:not([multiple])){height:var(--ndk-ctl)!important;min-height:var(--ndk-ctl)!important;max-height:var(--ndk-ctl)!important;box-sizing:border-box}
.acf-visual-density .ndk-field:not(.ndk-area):not(:has(textarea)) .ndk-input{min-height:0!important}
.acf-visual-density .ndk-field .ndk-chip{height:100%!important;min-height:0!important;max-height:none!important}
.acf-visual-density .acf-settings-picker{min-height:var(--ndk-ctl)!important}
.acf-visual-style[data-field-style="soft"] :is(.ndk-field,.acf-settings-select,.acf-video-input,select:not([multiple])){background:var(--ndk-s2,#20252d)!important;border:1px solid var(--ndk-border,#3b4955)!important;box-shadow:inset 0 1px 0 #ffffff0d,0 1px 2px #0004!important;backdrop-filter:none!important}
.acf-visual-style[data-field-style="outline"] :is(.ndk-field,.acf-settings-select,.acf-video-input,select:not([multiple])){background:transparent!important;border:1px solid var(--ndk-border-strong,#67827e)!important;box-shadow:none!important;backdrop-filter:none!important}
.acf-visual-style[data-field-style="glass"] :is(.ndk-field,.acf-settings-select,.acf-video-input,select:not([multiple])){background:linear-gradient(135deg,#ffffff22,#ffffff08)!important;border:1px solid #c6eee84d!important;box-shadow:inset 0 1px 0 #ffffff38,0 4px 12px #0003!important;backdrop-filter:blur(12px) saturate(135%)!important;-webkit-backdrop-filter:blur(12px) saturate(135%)!important}
.acf-visual-style[data-field-style="minimal"] :is(.ndk-field,.acf-settings-select,.acf-video-input,select:not([multiple])){background:transparent!important;border:0!important;border-bottom:1px solid var(--ndk-border-strong,#67827e)!important;border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important}
.acf-themed.acf-visual-style[data-field-style="glass"] :is(.ndk-field,.acf-settings-select,.acf-video-input,select:not([multiple])){border-color:color-mix(in srgb,var(--acf-accent) 45%,transparent)!important}
.acf-themed.acf-visual-style[data-field-style="soft"] :is(.ndk-field,.acf-settings-select,.acf-video-input,select:not([multiple])){background:var(--ndk-field-bg,var(--ndk-s2))!important;border-color:var(--ndk-field-border,var(--ndk-border))!important}
.acf-visual-style .ndk-field .ndk-input{background:transparent!important}
.acf-preview-custom :is(.ndk-media-main,.ndk-cmp,.ndk-vw-side .cell,.ndk-pl.video .stage){background:var(--acf-preview-bg)!important;background-size:var(--acf-preview-size,auto)!important}
.acf-motion-fast *{transition-duration:75ms!important;transition-delay:0s!important}
.acf-motion-off *,.acf-motion-off *::before,.acf-motion-off *::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}

`;
export function syncAppearanceRoot(ui,root){const v=appearanceBar(ui)?.props?.visualControls||{};root.classList.toggle('acf-visual-font',!!v.font);root.classList.toggle('acf-visual-density',!!v.density||['compact','comfortable'].includes(ui.kit?.density));root.classList.toggle('acf-visual-style',!!v.style||ui.kit?.style!=='soft');root.setAttribute('data-field-style',v.style||ui.kit?.style||'soft');root.classList.toggle('acf-preview-custom',!!v.previewBackground&&v.previewBackground!=='standard');root.classList.toggle('acf-motion-fast',v.animations==='fast');root.classList.toggle('acf-motion-off',v.animations==='off');}
// Presentation preferences: processing nodes and model settings are never touched.
const appearanceBar=ui=>ui.widgets?.find(w=>w.id==='taskbar');
export function readAppearanceControls(ui){
 const bar=appearanceBar(ui),v=bar?.props?.visualControls||{},kit=ui.kit||{};
 return{language:interfaceLanguage(ui),columnWidth:v.columnWidth??0,previewBackground:v.previewBackground||'standard',animations:v.animations||'normal',font:v.font||kit.font||'inter',density:kit.density||'spacious',style:kit.style||'soft',fontSize:v.fontSize??({compact:12,comfortable:13,spacious:14}[kit.density]||14),radius:v.radius??'default',accentA:bar?.props?.accentA||'#36cfea',accentB:bar?.props?.accentB||'#59e68d'};
}
export function applyAppearanceControls(ui,patch){
 const bar=appearanceBar(ui);if(!bar||!patch||typeof patch!=='object'||Array.isArray(patch))return false;
 const enums={language:INTERFACE_LANGUAGES.map(l=>l.id),font:APPEARANCE_FONTS.map(f=>f.id),density:['compact','comfortable','spacious'],style:['soft','outline','glass','minimal'],previewBackground:PREVIEW_BACKGROUNDS.map(b=>b.id),animations:['normal','fast','off']};
 for(const[k,v]of Object.entries(patch)){
  if(k in enums){if(!enums[k].includes(v))return false;}
  else if(k==='columnWidth'){if(![0,24,28,32,36,40].includes(v))return false;}
  else if(k==='fontSize'){if(!Number.isInteger(v)||v<12||v>18)return false;}
  else if(k==='radius'){if(v!=='default'&&(!Number.isInteger(v)||v<0||v>24))return false;}
  else return false;
 }
 ui.kit||={};bar.props||={};bar.props.visualControls||={};
 for(const[k,v]of Object.entries(patch)){
  if(k==='language')setInterfaceLanguage(ui,v);
  else if(k==='font'){ui.kit.font=v==='inter'?'inter':'system';bar.props.visualControls.font=v;}
  else if(k==='density'){ui.kit.density=v;bar.props.visualControls.density=v;}
  else if(k==='style'){ui.kit.style=v;bar.props.visualControls.style=v;}
  else if(k==='previewBackground'||k==='animations')bar.props.visualControls[k]=v;
  else if(k in enums)ui.kit[k]=v;
  else if(k==='radius'&&v==='default')delete bar.props.visualControls.radius;
  else bar.props.visualControls[k]=v;
 }
 for(const other of ui.widgets.filter(w=>w.type==='factorytaskbar_v0215')){other.props||={};other.props.visualControls=clone(bar.props.visualControls);for(const k of['accentA','accentB'])other.props[k]=bar.props[k];}
 return true;
}
export function appearanceVars(ui,vars,widget=null){
 const p=APPEARANCE_PROFILES.find(p=>p.id===appearanceProfile(ui))||APPEARANCE_PROFILES.find(p=>p.id==='standard');
 if(ui.widgets?.some(w=>w.id==='taskbar')&&isFullPalette(p.id)){
  const transparentBackground=vars['--ndk-wbg']==='transparent',transparentBorder=vars['--ndk-cbd']==='transparent';const c=paletteVariables(p);Object.assign(vars,c);
  const role=appearanceRole(widget),accent=role==='positive'?c['--acf-positive']:role==='negative'?c['--acf-negative']:role==='lora'?c['--acf-lora-a']:p.a;
  Object.assign(vars,{'--ndk-bg':p.bg,'--ndk-s1':p.s1,'--ndk-s2':p.s2,'--ndk-s3':p.s3,'--ndk-border':p.border,'--ndk-border-strong':mix(p.border,p.a,.35),'--ndk-text':c['--acf-text'],'--ndk-value':c['--acf-text'],'--ndk-muted':c['--acf-muted'],'--ndk-faint':c['--acf-muted'],'--ndk-label':c['--acf-label'],'--ndk-accent':accent,'--ndk-accent2':p.b,'--ndk-on-accent':c['--acf-accent-text'],'--ndk-success':c['--acf-positive'],'--ndk-warning':c['--acf-run-a'],'--ndk-danger':c['--acf-negative'],'--ndk-shadow':c['--acf-shadow'],'--ndk-cbds':transparentBorder?'transparent':mix(p.border,p.a,.35),'--ndk-grad-btn':p.a,'--ndk-grad-sl':`linear-gradient(90deg,${p.a},${p.b})`,'--ndk-accent-hi':p.b,'--ndk-accent-soft':`color-mix(in srgb,${accent} 15%,transparent)`,'--ndk-accent-ring':`color-mix(in srgb,${accent} 35%,transparent)`,'--acf-preview-bg':c['--acf-preview'],'--ndk-pbg':p.s1,'--ndk-wbg':transparentBackground?'transparent':p.s1,'--ndk-cbd':transparentBorder?'transparent':p.border,'--ndk-ptitle':c['--acf-label'],'--ndk-field-bg':p.s2,'--ndk-field-border':p.border,'--ndk-grad':`linear-gradient(110deg,${p.a},${p.b})`});
  if(role==='positive'||role==='negative'){const bg=c['--acf-'+role+'-bg'];Object.assign(vars,{'--ndk-wbg':bg,'--ndk-field-bg':bg,'--ndk-field-border':accent,'--ndk-cbd':accent,'--ndk-label':accent});}
  if(role==='run')Object.assign(vars,{'--ndk-grad':`linear-gradient(110deg,${c['--acf-run-a']},${c['--acf-run-b']})`,'--ndk-on-accent':c['--acf-run-text']});
 }
const v=appearanceBar(ui)?.props?.visualControls;const font=APPEARANCE_FONTS.find(f=>f.id===(v?.font||ui.kit?.font));if(font)vars['--ndk-font']=font.family;vars['--ndk-ctl']=({compact:30,comfortable:36,spacious:44}[v?.density||ui.kit?.density]||44)+'px';const preview=PREVIEW_BACKGROUNDS.find(b=>b.id===v?.previewBackground);if(preview&&preview.id!=='standard'){vars['--acf-preview-bg']=preview.background;vars['--acf-preview-size']=preview.size||'auto';}if(v?.fontSize)vars['--ndk-fs']=v.fontSize+'px';if(Number.isInteger(v?.radius))for(const key of['--ndk-rs','--ndk-rm','--ndk-rl','--ndk-ra'])vars[key]=v.radius+'px';return vars;
}
export function appearanceRole(w){if(!w)return'general';const id=w.id||'';if(id.includes('lora_gradient'))return'lora-gradient';if(w.type==='prompt')return /negative/i.test(id)?'negative':'positive';if(/lora|slider/i.test(id))return'lora';if(w.type==='generate'||/run$/.test(id))return'run';return'general';}

export function resetAppearanceControls(ui){
 if(!applyAppearanceProfile(ui,'standard'))return false;
 Object.assign(ui.kit,{font:'inter',density:'spacious',style:'soft'});
 for(const bar of ui.widgets.filter(w=>w.type==='factorytaskbar_v0215')){delete bar.props.visualControls;bar.props.glow='soft';}
 return true;
}

// Reflow display rectangles only: saved widget geometry and graph inputs stay intact.
export function appearanceColumns(ui,page,rects){
 const percent=readAppearanceControls(ui).columnWidth;if(!percent)return rects;
 const widgets=ui.widgets.filter(w=>w.page===page),byId=new Map(widgets.map(w=>[w.id,w]));
 const leftWidget=widgets.find(w=>!w.parent&&w.x===24&&w.w===336&&rects.has(w.id));
 const rightWidget=widgets.find(w=>!w.parent&&w.x===384&&w.w===792&&rects.has(w.id));
 if(!leftWidget||!rightWidget)return rects;
 const left=rects.get(leftWidget.id),right=rects.get(rightWidget.id),leftX=left.x,oldLeftEnd=left.x+left.w,rightEnd=right.x+right.w,gap=Math.max(12,right.x-oldLeftEnd),available=rightEnd-leftX-gap;
 if(available<600||left.w<=0||right.w<=0)return rects;
 const leftWidth=Math.max(280,Math.min(available*.45,available*percent/100)),newRight=leftX+leftWidth+gap;
 const region=w=>{let n=w;while(n.parent&&byId.has(n.parent))n=byId.get(n.parent);return n.x+n.w<=361?'left':n.x>=384?'right':null;};
 const move=(box,side)=>{const scale=side==='left'?leftWidth/left.w:(rightEnd-newRight)/right.w,origin=side==='left'?leftX:right.x,start=side==='left'?leftX:newRight;return{...box,x:start+(box.x-origin)*scale,w:box.w*scale};};
 return new Map([...rects].map(([id,box])=>{const w=byId.get(id),side=w&&region(w);if(!side)return[id,box];const next=move(box,side);if(box.clip)next.clip=move(box.clip,side);return[id,next];}));
}

// Keep native paint variables exact when a full palette stops overriding them.
const appliedAppearanceKeys=new WeakMap();
export function applyAppearanceVars(element,vars,apply){
 const previous=appliedAppearanceKeys.get(element);
 if(previous)for(const key of previous)if(!Object.hasOwn(vars,key))element.style.removeProperty(key);
 apply(element,vars);appliedAppearanceKeys.set(element,new Set(Object.keys(vars)));
}
