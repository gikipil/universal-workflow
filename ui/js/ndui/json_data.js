// SPDX-License-Identifier: AGPL-3.0-only
// Universal Workflow: snapshots of JSON data may be reactive browser proxies.
// Use the same serialization boundary as the ComfyUI API instead of the
// structured-clone algorithm, which rejects Proxy objects.
export function cloneJsonData(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}
