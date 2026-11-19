// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow complete visual palettes, gikipil 2026.
// User-provided palette anchors are preserved; only UI paint is changed.
export const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
const make=(id,name,description,palette,bg,text,a,b,extra={})=>({id,name,description,palette,bg,text,s1:mix(bg,text,.045),s2:mix(bg,text,.09),s3:mix(bg,text,.16),border:mix(bg,a,.42),end:mix(bg,a,.07),a,b,...extra});
export const REFERENCE_PROFILES=[
 make('navy_gold','Нави и золото','Тёмный синий, тёплый бежевый и мягкое золото.',['#1F2A44','#E8DCC8','#C6A75E'],'#10151f','#efe7d8','#c6a75e','#e8dcc8',{s1:'#171f2c',s2:'#202a39',s3:'#2a3547',border:'#344155',end:'#161f30',preview:'#111823',runA:'#c6a75e',runB:'#e8dcc8',loraA:'#e8dcc8',loraB:'#c6a75e',positive:'#d8bb7b',positiveBg:'#252b36',negative:'#e6a6a0'}),
 make('dark_magic','Тёмная магия','Глубокий фиолетовый, лавандовый и пудровый розовый.',['#F5D5E0','#6667AB','#7B337E','#420D4B','#210635'],'#100f17','#f3eaf3','#b0a6e8','#b970b9',{s1:'#1a1725',s2:'#242033',s3:'#302940',border:'#443852',end:'#191422',preview:'#14121d',runA:'#d7c5ee',runB:'#b5acf0',loraA:'#6667ab',loraB:'#7b337e',onLora:'#fff4fa',positive:'#cbbce9',positiveBg:'#2a243c',negative:'#f0b0c9',negativeBg:'#342231'}),
 make('lagoon','Лагуна','Глубокие бирюзовые тона, светлый камень и тёмно-красные акценты.',['#0E2931','#12484C','#2B7574','#861211','#E2E2E0'],'#0b171c','#e2e2e0','#70c4bb','#2b7574',{s1:'#193138',s2:'#10242a',s3:'#29464d',border:'#42646a',end:'#10262a',preview:'#0c1c22',runA:'#861211',runB:'#b9342c',loraA:'#12484c',loraB:'#2b7574',onLora:'#ffffff',positive:'#8ed6c9',positiveBg:'#183b3c',negative:'#efb7b3',negativeBg:'#38272c',danger:'#861211'}),
 make('blue_coral','Синий и коралл','Глубокий синий, тёплый коралл и прохладный серо-голубой.',['#DB8084','#23314A','#8FA1B1'],'#101722','#edf1f5','#db8084','#8fa1b1',{s1:'#192333',s2:'#222f42',s3:'#2e3e51',border:'#3b4d62',end:'#172234',preview:'#121d2b',runA:'#db8084',runB:mix('#db8084','#ffffff',.2),loraA:'#8fa1b1',loraB:'#db8084',positive:'#b8d2db',positiveBg:'#26384b',negative:'#f1a5a9'}),
];

export const ADDITIONAL_PROFILES=[
 make('graphite','Графит','Нейтральные графитовые поверхности и серебристые акценты.',['#131519','#303844','#c0ccd7','#91aeb6'],'#131519','#eceff2','#c0ccd7','#91aeb6',{s1:'#20242b',s2:'#161b22',s3:'#303844',border:'#414c59',end:'#1c222a',preview:'#11161c',runA:'#c5d0db',runB:'#92afbb',loraA:'#3d4b5c',loraB:'#566d79',onLora:'#ffffff',positive:'#c2d0d7',positiveBg:'#293440',negative:'#edabb6'}),
 make('indigo','Индиго','Чернильный синий, светлая лаванда и прохладные голубые акценты.',['#111421','#303959','#aa9af3','#7fc9d5'],'#111421','#edf0fa','#aa9af3','#7fc9d5',{s1:'#1e2338',s2:'#151a2b',s3:'#303959',border:'#414c70',end:'#191e34',preview:'#121728',runA:'#ac9bf4',runB:'#7fbdde',loraA:'#63529e',loraB:'#325e82',onLora:'#ffffff',positive:'#b7bef4',positiveBg:'#272e49',negative:'#f3adb6'}),
 make('ocean','Морской','Тёмные морские поверхности, мятные и светло-голубые акценты.',['#0d191c','#2c4a52','#75d4c1','#87bbdd'],'#0d191c','#e5f2f2','#75d4c1','#87bbdd',{s1:'#1c3339',s2:'#12272d',s3:'#2c4a52',border:'#3d6068',end:'#142a30',preview:'#101f26',runA:'#9bdbcd',runB:'#87bbdd',loraA:'#23635e',loraB:'#2a5a72',onLora:'#ffffff',positive:'#99d9cd',positiveBg:'#254447',negative:'#f0aebb'}),
];
export const isFullPalette=id=>[...REFERENCE_PROFILES,...ADDITIONAL_PROFILES].some(p=>p.id===id);

const luminance=hex=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
export const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
const onGradient=(a,b,light,dark)=>Math.min(contrast(a,light),contrast(b,light))>=Math.min(contrast(a,dark),contrast(b,dark))?light:dark;
export function paletteVariables(p){
 const text=p.text||'#e8eaf0',ink=mix(p.bg,'#000000',.4),positive=p.positive||'#8eefb4',negative=p.negative||'#ff9ca9',runA=p.runA||'#e7ff35',runB=p.runB||'#ff941f',loraA=p.loraA||'#ff6b86',loraB=p.loraB||'#b84dff';
 const values={bg:p.bg,block:p.s1,field:p.s2,surface:p.s2,raised:p.s3,border:p.border,text,muted:mix(p.bg,text,.65),label:mix(p.a,text,.6),accent:p.a,accent2:p.b,'accent-text':onGradient(p.a,p.a,text,ink),ink,shadow:mix(p.bg,'#000000',.7),positive,negative,'positive-bg':p.positiveBg||mix(p.bg,positive,.12),'negative-bg':p.negativeBg||mix(p.bg,negative,.13),preview:p.preview||p.s2,danger:p.danger||mix(p.bg,negative,.32),'run-a':runA,'run-b':runB,'run-text':onGradient(runA,runB,text,ink),'lora-a':loraA,'lora-b':loraB,'lora-bg':mix(p.bg,loraB,.13),'lora-border':mix(p.bg,loraA,.5),'lora-label':mix(loraB,text,.72),'lora-text':p.onLora||onGradient(loraA,loraB,text,ink),'active-bg':mix(p.s1,p.a,.23)};
 return Object.fromEntries(Object.entries(values).map(([k,v])=>['--acf-'+k,v]));
}
export const PROFILE_CSS=`
.acf-themed{color:var(--acf-text)}
.acf-themed :is(.ndk-media-main,.ndk-cmp,.ndk-vw-side .cell,.ndk-pl.video .stage){background:var(--acf-preview-bg,var(--acf-preview))!important;background-size:var(--acf-preview-size,auto)!important}
.acf-themed :is(.acf-settings-card,.acf-settings-profile,.acf-dialog-window,.acf-slider-card){background:var(--acf-block)!important;border-color:var(--acf-border)!important;color:var(--acf-text)!important}
.acf-themed :is(.acf-settings-head,.acf-settings-tabs,.acf-dialog-head,.ndk-panel-box,.ndk-sp-box,.ndk-tabbox,.ndk-cmp){border-color:var(--acf-border)!important}
.acf-themed :is(.acf-settings-profile[aria-pressed=true],.acf-settings-category[aria-pressed=true]){border-color:var(--acf-accent)!important;background:var(--acf-active-bg)!important;color:var(--acf-text)!important}
.acf-themed .ndk-gen .run{background:linear-gradient(110deg,var(--acf-run-a),var(--acf-run-b))!important;color:var(--acf-run-text)!important;border-color:var(--acf-run-a)!important;box-shadow:0 0 16px color-mix(in srgb,var(--acf-run-a) 30%,transparent)!important}
.acf-themed [data-acf-role=lora] .ndk-sp-head{background:linear-gradient(110deg,var(--acf-lora-a),var(--acf-lora-b))!important;color:var(--acf-lora-text)!important}
.acf-themed [data-acf-role=lora] .ndk-sp-head :is(.ndk-sp-ic,.ndk-sp-chev){color:inherit!important}
.acf-themed [data-acf-role=lora] .ndk-sp-box{background:var(--acf-lora-bg)!important;border-color:var(--acf-lora-border)!important}
.acf-themed [data-acf-role=lora-gradient]{visibility:hidden}
.acf-themed .ndk-tg.on .ndk-tg-sw{background:linear-gradient(110deg,var(--acf-accent),var(--acf-accent2))!important}
.acf-themed :is(.acf-dialog-close,.acf-settings-close,.ndk-btn.danger,.acf-slider-remove){background:var(--acf-danger)!important;color:var(--acf-text)!important;border-color:var(--acf-negative)!important}
.acf-themed :is(.ndk-btn,.ndk-chip,.acf-slider-gear):hover{border-color:var(--acf-accent)!important}
.acf-themed .acf-slider-open{background:var(--acf-field)!important;border-color:var(--acf-border)!important;color:var(--acf-text)!important;text-shadow:none!important}
.acf-themed .acf-slider-open:hover{border-color:var(--acf-accent)!important}
.acf-themed button:disabled{opacity:.45}
`;
const LEGACY_HEX=["#000", "#0005", "#0008", "#000a", "#000b", "#050810b8", "#080c10", "#0e1014", "#10131c", "#101820", "#11151d", "#111820", "#12363a", "#142126", "#151d25ef", "#161d23", "#171a33", "#171d24", "#171e29", "#172129", "#17212b", "#181c23", "#181f24", "#181f26", "#18232a", "#191722", "#191d28", "#191e28", "#192b22", "#192b2a", "#192d31", "#19343d", "#1a1d27", "#1a2429", "#1a252d", "#1a2823", "#1b3032", "#1b474f", "#1c2530", "#1c262c", "#1c3c3d", "#1d1a27", "#1d2630", "#201f2d", "#20252d", "#20282f", "#202a2e", "#202a32", "#202a33", "#202b31", "#203e48", "#211a2b", "#211d2c", "#214338", "#22202d", "#222b33", "#23362d", "#235b46", "#242934", "#244137", "#24513e", "#24584c", "#251d31", "#26090d", "#272132", "#28212f", "#28333d", "#28513f", "#287e91", "#292235", "#292334", "#29283e", "#29353e", "#293841", "#2b2236", "#2b2434", "#2c2337", "#2c333e", "#2e2026", "#301f27", "#302126", "#302332", "#30233b", "#30252e", "#302739", "#303b44", "#34263f", "#34414b", "#344b51", "#35263f", "#35283f", "#35484b", "#35554b", "#357184", "#365a45", "#365a53", "#36cfea", "#392332", "#39635b", "#39636b", "#397b87", "#39ddc51a", "#3a2745", "#3a2a48", "#3b2533", "#3b2945", "#3b4955", "#3b9e66", "#3c2948", "#3d5962", "#3d6555", "#3d726c", "#3f505a", "#40263f", "#412b40", "#41675e", "#416e59", "#453451", "#453b57", "#47636c", "#47776b", "#486570", "#4b3d59", "#50c5a1", "#51405f", "#53776e", "#56205e33", "#573044", "#59cfaa", "#59e68d", "#59e68d22", "#5b3b70", "#5bdcb3", "#60476f", "#614085", "#643681", "#654b7b", "#654b7b55", "#65516f", "#65517e", "#65e3f4", "#67457466", "#6ae7a4", "#6b507b", "#6c4f83", "#6c5597", "#6d365b33", "#704a77", "#715166", "#725087", "#72edba", "#754452", "#7545ad2e", "#75e4df", "#76528f", "#76e5b6", "#7757fa", "#78e4cd", "#795090", "#79628f", "#7a5f91", "#7d596b", "#80f2a9", "#82948f", "#8b94a7", "#8c5262", "#8c639f", "#8c6bb2", "#8e4655", "#8e69a2", "#8ee3cf", "#8eefb4", "#914b98", "#91869e", "#91dfdb", "#92566f", "#97546d", "#97627c", "#9a638980", "#9aefd3", "#9b6072", "#9c76b5", "#9cb4bd", "#9ce5cb", "#9f43e7", "#a06ac9", "#a18bad", "#a1eacb", "#a459ce20", "#a4adbf", "#a4b7bd", "#a4bcb9", "#a4d3ba", "#a4edcf", "#a55b9c20", "#a5ffd2", "#a65be2", "#a7c8bd", "#a86bcc24", "#a92e43", "#a99ab6", "#a9d9bc", "#a9f4c6", "#aa9ab8", "#aaa0b0", "#ad96bb", "#b17683", "#b268ed", "#b47cdb", "#b5c3d1", "#b6f9d6", "#b75ee622", "#b7a1c8", "#b7c7d1", "#b84dff", "#b8d6df", "#b8ffe0", "#b9a8c5", "#ba8fce", "#bba9c8", "#bc72cf", "#bc72df", "#c5acd3", "#c5d0d5", "#c5ffeb", "#c6aed5", "#c6ffdd", "#c7a4db", "#c7b5d2", "#c8b5d7", "#c8d3dc", "#c8e9d8", "#c8ffe7", "#ca8cdd", "#cc3b52", "#ce88df", "#d0bedc", "#d16cce55", "#d3c3e0", "#d598e5", "#d598e544", "#d8bfe8", "#d8e5e8", "#d9ede4", "#da8cff", "#dbe6ef", "#ddc8f1", "#def4ec", "#df80c944", "#df9ff2", "#dfb8f5", "#e0c6f5", "#e18ecf", "#e5b8f7", "#e5f0ed", "#e680d1", "#e7b4d7", "#e8588b", "#e8eaf0", "#e98bd455", "#e9c5f5", "#e9fff7", "#eb82ce", "#eda6e2", "#edbaff", "#eed1ff", "#eee", "#eee7f7", "#f0637a", "#f0c5f7", "#f2a3db", "#f2c4f3", "#f2d8f7", "#f2d9e4", "#f2d9ff", "#f2dce2", "#f2e3fa", "#f3e8fb", "#f4e7ff", "#f5c4d2", "#f5e9ff", "#f8ccf6", "#f8d8ff", "#ff6b86", "#ff7078", "#ff9aa8", "#ff9ca9", "#ffa0a8", "#ffa4b2", "#ffa7b9", "#ffa7bf", "#ffadba", "#ffafc8", "#ffb8ce", "#ffc0d5", "#ffd2f2", "#ffd5e6", "#ffd7df", "#ffeafd", "#fff", "#ffffff", "#ffffff0d", "#ffffff33"];
function rgba(token){
 if(token[0]==='#'){let h=token.slice(1);if(h.length===3||h.length===4)h=h.split('').map(c=>c+c).join('');return[h.slice(0,6).toLowerCase(),h.length===8?parseInt(h.slice(6,8),16)/255:1];}
 const v=token.match(/[\d.]+/g)||[];if(v.length<3)return null;return[v.slice(0,3).map(n=>Math.round(Number(n)).toString(16).padStart(2,'0')).join(''),v[3]===undefined?1:Number(v[3])];
}
const legacy=new Set(LEGACY_HEX.map(x=>rgba(x)?.[0]));
function legacyRole(hex,property){
 const [r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,s=max?d/max:0;let h=!d?0:max===r?60*((g-b)/d%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4);h=(h+360)%360;
 if(/shadow/i.test(property))return max<.45?'shadow':'text';
 if(/border|outline/i.test(property))return s>.25&&(h<20||h>345)?'negative':s>.2&&h>260&&h<345?'lora-border':'border';
 const background=/background/i.test(property);
 if(background&&max<.42)return s>.3&&(h<15||h>345)?'negative-bg':s>.25&&h>270&&h<345?'lora-bg':max<.12?'bg':max<.22?'block':'field';
 if(s<.18)return max<.22?(background?'bg':'ink'):max>.78?'text':'muted';
 if(h<20||h>345)return background?'lora-a':'negative';
 if(h<45)return 'run-b';if(h<90)return 'run-a';
 if(h<265)return background?(h<175?'accent2':'accent'):'label';
 return background?(h<305?'lora-b':'lora-a'):'lora-label';
}
export function themePaint(value,property,preserve=[]){
 if(typeof value!=='string'||/url\(/i.test(value))return value;
 const keep=new Set(preserve.filter(x=>typeof x==='string'&&/^#[0-9a-f]{6}$/i.test(x)).map(x=>x.slice(1).toLowerCase()));
 return value.replace(/#[0-9a-f]{3,8}\b|rgba?\(\s*[^)]+\)/gi,token=>{const parsed=rgba(token);if(!parsed)return token;const[hex,alpha]=parsed;if(!legacy.has(hex)||keep.has(hex))return token;const variable='var(--acf-'+legacyRole(hex,property)+')';return alpha>=.999?variable:alpha<=0?'transparent':`color-mix(in srgb,${variable} ${+(alpha*100).toFixed(2)}%,transparent)`;});
}
const PAINT_PROPERTIES=['color','background','background-color','background-image','border','border-color','border-top','border-bottom','border-left','border-right','box-shadow','text-shadow','outline','outline-color','accent-color'];
export function themeInterface(root,getProfile){
 const originals=new WeakMap();let closed=false,cachedProfile=null,cachedVars={},preserve=[];
 root.setAttribute('data-acf-themed','');
 const paints=new WeakMap();let enabled=false;
 const profile=()=>getProfile?.();
 function context(){const p=profile();if(p!==cachedProfile){cachedProfile=p;enabled=isFullPalette(p?.id);root.classList.toggle('acf-themed',enabled);cachedVars=p?paletteVariables(p):{};preserve=[...Object.values(cachedVars),...(p?.palette||[])];return true;}return false;}
 function walk(node){
  if(!node||closed)return;if(node!==root&&node.hasAttribute?.('data-acf-themed'))return;
  if(node.nodeType===1){
   context();if(!cachedProfile)return;
   if(node.tagName==='STYLE'){
    let cached=originals.get(node);if(!cached||node.textContent!==cached.shown)cached={source:node.textContent};
    const next=enabled?cached.source.replace(/([a-z-]+)\s*:\s*([^;{}]+)/gi,(all,property,value)=>PAINT_PROPERTIES.includes(property.toLowerCase())?property+':'+themePaint(value,property,preserve):all):cached.source;
    cached.shown=next;originals.set(node,cached);if(node.textContent!==next)node.textContent=next;return;
   }
   if(!node.closest?.('.acf-settings-preview,.acf-settings-swatches,[data-theme-preserve]')&&!['CANVAS','IMG','VIDEO'].includes(node.tagName))for(const property of PAINT_PROPERTIES){const old=node.style?.getPropertyValue?.(property);if(!old)continue;let cache=paints.get(node);if(!cache){cache=new Map();paints.set(node,cache);}let entry=cache.get(property);if(!entry||entry.shown!==old)entry={source:old};const next=enabled?themePaint(entry.source,property,preserve):entry.source;entry.shown=next;cache.set(property,entry);if(next!==old)node.style.setProperty(property,next);entry.shown=node.style.getPropertyValue(property);}
  }
  for(const child of node.childNodes||[])walk(child);
 }
 function update(){if(closed)return;const changed=context();if(!cachedProfile)return;for(const[k,v]of Object.entries(cachedVars))if(root.style.getPropertyValue?.(k)!==v)root.style.setProperty(k,v);if(changed)walk(root);}
 const observer=typeof MutationObserver==='undefined'?null:new MutationObserver(records=>{const changed=new Set();for(const r of records){if(r.type==='childList'){for(const node of r.addedNodes)changed.add(node);}else if(r.target!==root||r.type!=='attributes')changed.add(r.target);}for(const node of changed)walk(node);});
 observer?.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['style'],characterData:true});update();return{update,destroy(){closed=true;observer?.disconnect();}};
}
