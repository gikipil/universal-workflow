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
    return true;
}
