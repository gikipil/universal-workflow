// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
import {el} from './util.js';
const CSS=`
.ndk.acf-slider-model-picker{padding:0!important;max-width:calc(100vw - 24px);border:1px solid #a06ac9!important;border-radius:16px!important;background:linear-gradient(155deg,#251d31,#171e29)!important;color:#f4e7ff;font-family:Inter,system-ui,sans-serif;font-size:14px;box-shadow:0 20px 65px #000b,0 0 24px #a459ce20!important;overflow:hidden;--ndk-accent:#e18ecf;--ndk-text:#f4e7ff;--ndk-muted:#b7a1c8;--ndk-faint:#a18bad;--ndk-border:#654b7b;--ndk-s2:#2c2337;--ndk-s3:#35283f}
.acf-slider-model-picker .acf-picker-title{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:16px 18px 12px;border-bottom:1px solid #67457466;background:linear-gradient(110deg,#6d365b33,#7545ad2e)}
.acf-slider-model-picker .acf-picker-title strong{font-size:16px;font-weight:700;color:#f2c4f3;line-height:1.4}
.acf-slider-model-picker .acf-picker-close{display:flex;align-items:center;justify-content:center;flex:0 0 32px;width:32px;height:32px;padding:0;background:#412b40;border:1px solid #97627c;border-radius:9px;color:#ffd5e6;font-size:23px;cursor:pointer}
.acf-slider-model-picker .ndk-mp-head{padding:14px 16px 6px;gap:9px;flex:0 0 auto}
.acf-slider-model-picker .ndk-pop-search{min-width:0;display:flex;align-items:center;gap:10px;height:42px;padding:0 12px;background:#191722;border:1px solid #76528f;border-radius:11px;color:#c7a4db;box-sizing:border-box;overflow:hidden;transition:border-color .13s,box-shadow .13s}
.acf-slider-model-picker .ndk-pop-search:focus-within{border-color:#d598e5;box-shadow:inset 0 0 0 1px #d598e544;background:#211a2b}
.acf-slider-model-picker .ndk-pop-search input,.acf-slider-model-picker .ndk-pop-search input:focus,.acf-slider-model-picker .ndk-pop-search input:focus-visible{min-width:0;width:100%;height:100%;margin:0;padding:0;background:transparent;color:#f5e9ff;font:inherit;font-size:14px;outline:none!important;outline-offset:0!important;border:0!important;box-shadow:none!important;box-sizing:border-box}
.acf-slider-model-picker .ndk-pop-search input::placeholder{color:#ad96bb}
.acf-slider-model-picker .ndk-mp-head .ndk-iconbtn{width:40px;height:40px;flex:0 0 40px;border:1px solid #725087;border-radius:10px;background:#30233b;color:#e5b8f7;cursor:pointer}
.acf-slider-model-picker .acf-picker-nav{padding:8px 16px 12px!important;gap:7px!important;border-bottom:1px solid #654b7b55;flex:0 0 auto}
.acf-slider-model-picker .ndk-btn{min-height:32px!important;padding:5px 10px!important;border:1px solid #6c4f83;border-radius:9px;background:#2b2236;color:#e9c5f5;font:inherit;font-size:12px;cursor:pointer;white-space:normal;overflow-wrap:anywhere}
.acf-slider-model-picker .ndk-btn:hover{border-color:#ca8cdd;background:#3c2948}
.acf-slider-model-picker .ndk-mp-grid{padding:12px 16px 16px;gap:10px;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));min-height:0;overflow-y:auto;scrollbar-color:#795090 #191722}
.acf-slider-model-picker .ndk-mp-card{border:1px solid #60476f;border-radius:12px;background:#272132;color:#f2e3fa;min-width:0;box-shadow:none;transition:background .13s,border-color .13s,box-shadow .13s}
.acf-slider-model-picker .ndk-mp-card:hover{background:#35263f;border-color:#ce88df;box-shadow:0 0 12px #b75ee622;transform:none}
.acf-slider-model-picker .ndk-mp-card.on{border-color:#f2a3db;box-shadow:inset 0 0 0 1px #e98bd455;background:#3b2945}
.acf-slider-model-picker .ndk-mp-card .pic{aspect-ratio:auto;height:74px;background:linear-gradient(145deg,#35263f,#211d2c);color:#ba8fce}
.acf-slider-model-picker .ndk-mp-card .nm{padding:10px 11px;font-size:13px;line-height:1.4;-webkit-line-clamp:3;overflow-wrap:anywhere}
.acf-slider-model-picker .ndk-mp-card .nm small{color:#b7a1c8;font-size:10.5px;margin-top:4px}
.acf-slider-model-picker .acf-picker-folder{display:grid;grid-template-columns:32px minmax(0,1fr);align-items:center;gap:9px;padding:12px;min-height:60px}
.acf-slider-model-picker .acf-picker-folder .pic{height:34px;background:none;font-size:26px!important}
.acf-slider-model-picker .acf-picker-folder .nm{padding:0;font-size:14px;line-height:1.35;-webkit-line-clamp:2}
.acf-slider-model-picker .ndk-pop-empty{grid-column:1/-1;padding:24px 12px;text-align:center;color:#c5acd3;font-size:14px}
.acf-slider-model-picker button:focus-visible{outline:2px solid #eda6e2;outline-offset:-3px}
@media(max-width:500px){.acf-slider-model-picker .ndk-mp-grid{grid-template-columns:repeat(2,minmax(0,1fr));padding:10px}.acf-slider-model-picker .acf-picker-folder{grid-template-columns:26px minmax(0,1fr);padding:9px;gap:6px}}
`;
export function decorateSliderPicker(box,close,kind='slider'){
    const slider=kind==='slider';box.classList.add('acf-slider-model-picker');box.setAttribute('role','dialog');box.setAttribute('aria-label',slider?'Выбор LoRA слайдера':'Выбор LoRA');
    const style=el('style'),head=el('div','acf-picker-title'),title=el('strong','',slider?'🎚️ LoRA слайдера':'🧩 Выбор LoRA'),x=el('button','acf-picker-close','×');style.textContent=CSS;x.type='button';x.setAttribute('aria-label','Закрыть выбор LoRA');x.addEventListener('click',close);head.append(title,x);box.append(style,head);
}
