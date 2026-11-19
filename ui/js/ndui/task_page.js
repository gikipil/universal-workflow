// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-13.
export function taskPageUi(ui,page,scope=null){if(scope)return ui;const bar=ui.widgets?.find(w=>w.page===page&&w.type==='factorytaskbar_v0215'),height=Number(bar?.props?.canvasHeight);return height>=480&&height<=16000?{...ui,page:{...ui.page,h:height}}:ui;}
