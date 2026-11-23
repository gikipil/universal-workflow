// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions by gikipil, 2026-11-24.
// Opt-in footer sizing after relative alignment, using the final display boxes.
export function fitTaskFooter(ui,page,rects,height){
    const bar=ui.widgets.find(w=>w.page===page&&w.type==='factorytaskbar_v0215'&&w.props?.footerWith);
    if(!bar)return null;
    const footer=rects.get(bar.props.footerWith),fill=rects.get(bar.props.footerFill);
    const footerWidget=ui.widgets.find(w=>w.id===bar.props.footerWith);
    if(!footer||!fill||footer.vis===false||fill.vis===false||footerWidget?.props?.afterWith!==bar.props.footerFill||footerWidget.props.afterExact!==true)return null;
    const gap=Math.max(0,Number(bar.props.footerGap)||24);
    const extra=Math.max(0,(Number(height)||0)-gap-footer.y-footer.h);
    // On tall windows let the full-width prompt use the available space.
    // On shorter windows retain its height and scroll to the actual button end.
    fill.h+=extra;footer.y+=extra;
    return Math.max(0,...[...rects.values()].filter(r=>r.vis!==false).map(r=>r.y+r.h));
}
export function taskFooterLength(ui,page,bottom,minimum){
    const bar=ui.widgets.find(w=>w.page===page&&w.type==='factorytaskbar_v0215'&&w.props?.footerWith);
    if(!bar)return null;
    const gap=Math.max(0,Number(bar.props.footerGap)||24);
    return Math.max(minimum,Math.ceil(bottom+gap));
}
