// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
const clone = value => JSON.parse(JSON.stringify(value));
export const APPEARANCE_PROFILES = [
    {id:'standard', name:'Стандартный', description:'Исходная тёмная палитра с бирюзовыми и зелёными акцентами.', bg:'#111318', s1:'#181c23', s2:'#20252d', s3:'#2c333e', border:'#303742', end:'#1b2429', a:'#36cfea', b:'#59e68d'},
    {id:'graphite', name:'Графит', description:'Нейтральный графит и спокойные серебристые акценты.', bg:'#121315', s1:'#1c1d20', s2:'#27292d', s3:'#35383e', border:'#44484f', end:'#24272c', a:'#a4c5da', b:'#b2d5c8'},
    {id:'indigo', name:'Индиго', description:'Глубокий синий фон и фиолетово-бирюзовая навигация.', bg:'#101322', s1:'#191e32', s2:'#242a43', s3:'#353d5c', border:'#3b4667', end:'#252038', a:'#9b8aff', b:'#55dce4'},
    {id:'ocean', name:'Морской', description:'Тёмный сине-зелёный фон и свежие мятные акценты.', bg:'#0d191c', s1:'#14262a', s2:'#1e343a', s3:'#2a4950', border:'#33565e', end:'#163235', a:'#32d3df', b:'#7ae5b2'},
];
export function appearanceProfile(ui) {
    return ui?.widgets?.find(w => w.id === 'taskbar')?.props?.visualProfile || 'standard';
}
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
export const APPEARANCE_CONTROL_CSS=`
.acf-visual-font,.acf-visual-font :is(button,input,select,textarea,label){font-family:var(--ndk-font)!important}
.acf-visual-density :is(.ndk-field,.ndk-chip,.acf-settings-select,select:not([multiple])){height:var(--ndk-ctl)!important;min-height:var(--ndk-ctl)!important;max-height:var(--ndk-ctl)!important;box-sizing:border-box}
.acf-visual-density .ndk-field .ndk-input{min-height:0!important}
.acf-visual-density .ndk-field .ndk-chip{height:100%!important;min-height:0!important;max-height:none!important}
.acf-visual-density .acf-settings-picker{min-height:var(--ndk-ctl)!important}
.acf-visual-style[data-field-style="soft"] :is(.ndk-field,.acf-settings-select,select:not([multiple])){background:var(--ndk-s2,#20252d)!important;border:1px solid var(--ndk-border,#3b4955)!important;box-shadow:inset 0 1px 0 #ffffff0d,0 1px 2px #0004!important;backdrop-filter:none!important}
.acf-visual-style[data-field-style="outline"] :is(.ndk-field,.acf-settings-select,select:not([multiple])){background:transparent!important;border:1px solid var(--ndk-border-strong,#67827e)!important;box-shadow:none!important;backdrop-filter:none!important}
.acf-visual-style[data-field-style="glass"] :is(.ndk-field,.acf-settings-select,select:not([multiple])){background:linear-gradient(135deg,#ffffff22,#ffffff08)!important;border:1px solid #c6eee84d!important;box-shadow:inset 0 1px 0 #ffffff38,0 4px 12px #0003!important;backdrop-filter:blur(12px) saturate(135%)!important;-webkit-backdrop-filter:blur(12px) saturate(135%)!important}
.acf-visual-style[data-field-style="minimal"] :is(.ndk-field,.acf-settings-select,select:not([multiple])){background:transparent!important;border:0!important;border-bottom:1px solid var(--ndk-border-strong,#67827e)!important;border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important}
.acf-visual-style .ndk-field .ndk-input{background:transparent!important}

`;
export function syncAppearanceRoot(ui,root){const v=appearanceBar(ui)?.props?.visualControls||{};root.classList.toggle('acf-visual-font',!!v.font);root.classList.toggle('acf-visual-density',!!v.density||['compact','comfortable'].includes(ui.kit?.density));root.classList.toggle('acf-visual-style',!!v.style||ui.kit?.style!=='soft');root.setAttribute('data-field-style',v.style||ui.kit?.style||'soft');}
// Presentation preferences: processing nodes and model settings are never touched.
const appearanceBar=ui=>ui.widgets?.find(w=>w.id==='taskbar');
export function readAppearanceControls(ui){
 const bar=appearanceBar(ui),v=bar?.props?.visualControls||{},kit=ui.kit||{};
 return{font:v.font||kit.font||'inter',density:kit.density||'spacious',style:kit.style||'soft',fontSize:v.fontSize??({compact:12,comfortable:13,spacious:14}[kit.density]||14),radius:v.radius??'default',accentA:bar?.props?.accentA||'#36cfea',accentB:bar?.props?.accentB||'#59e68d'};
}
export function applyAppearanceControls(ui,patch){
 const bar=appearanceBar(ui);if(!bar||!patch||typeof patch!=='object'||Array.isArray(patch))return false;
 const enums={font:APPEARANCE_FONTS.map(f=>f.id),density:['compact','comfortable','spacious'],style:['soft','outline','glass','minimal']};
 for(const[k,v]of Object.entries(patch)){
  if(k in enums){if(!enums[k].includes(v))return false;}
  else if(k==='fontSize'){if(!Number.isInteger(v)||v<12||v>18)return false;}
  else if(k==='radius'){if(v!=='default'&&(!Number.isInteger(v)||v<0||v>24))return false;}
  else return false;
 }
 ui.kit||={};bar.props||={};bar.props.visualControls||={};
 for(const[k,v]of Object.entries(patch)){
  if(k==='font'){ui.kit.font=v==='inter'?'inter':'system';bar.props.visualControls.font=v;}
  else if(k==='density'){ui.kit.density=v;bar.props.visualControls.density=v;}
  else if(k==='style'){ui.kit.style=v;bar.props.visualControls.style=v;}
  else if(k in enums)ui.kit[k]=v;
  else if(k==='radius'&&v==='default')delete bar.props.visualControls.radius;
  else bar.props.visualControls[k]=v;
 }
 for(const other of ui.widgets.filter(w=>w.type==='factorytaskbar_v0215')){other.props||={};other.props.visualControls=clone(bar.props.visualControls);for(const k of['accentA','accentB'])other.props[k]=bar.props[k];}
 return true;
}
export function appearanceVars(ui,vars){const v=appearanceBar(ui)?.props?.visualControls;const font=APPEARANCE_FONTS.find(f=>f.id===(v?.font||ui.kit?.font));if(font)vars['--ndk-font']=font.family;vars['--ndk-ctl']=({compact:30,comfortable:36,spacious:44}[v?.density||ui.kit?.density]||44)+'px';if(v?.fontSize)vars['--ndk-fs']=v.fontSize+'px';if(Number.isInteger(v?.radius))for(const key of['--ndk-rs','--ndk-rm','--ndk-rl','--ndk-ra'])vars[key]=v.radius+'px';return vars;}
export function resetAppearanceControls(ui){
 if(!applyAppearanceProfile(ui,'standard'))return false;
 Object.assign(ui.kit,{font:'inter',density:'spacious',style:'soft'});
 for(const bar of ui.widgets.filter(w=>w.type==='factorytaskbar_v0215')){delete bar.props.visualControls;bar.props.glow='soft';}
 return true;
}
