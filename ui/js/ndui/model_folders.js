// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow additions/modifications by gikipil, 2026-11-12.
// Based on ND UI Builder by Ivan Ovchinnikov (Neural Dreamer).
// Folder navigation is display-only: preserve the exact source value when selecting a file.
const normalize = (value) => String(value).replace(/\\/g, "/");
const order = (a, b) => a.localeCompare(b, "ru", { numeric: true, sensitivity: "base" });
export function modelFolderEntries(options, directory = "", query = "") {
    const dir = normalize(directory).replace(/^\/+|\/+$/g, "");
    const q = normalize(query.trim()).toLowerCase();
    const folders = new Map(), files = [];
    for (const original of new Set(options)) {
        if (typeof original !== "string" || !original.trim()) continue;
        const path = normalize(original);
        if (q) { if (path.toLowerCase().includes(q)) files.push(original); continue; }
        const prefix = dir ? dir + "/" : "";
        if (!path.startsWith(prefix)) continue;
        const rest = path.slice(prefix.length), slash = rest.indexOf("/");
        if (slash >= 0) {
            const name = rest.slice(0, slash);
            if (name) folders.set(prefix + name, name);
        } else files.push(original);
    }
    return {
        folders: [...folders].map(([path, name]) => ({ path, name })).sort((a, b) => order(a.name, b.name)),
        files: files.sort((a, b) => order(normalize(a), normalize(b))),
    };
}
