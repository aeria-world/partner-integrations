// Thin wrapper over the simulator backend. No secrets are ever returned here.
window.API = (() => {
    async function req(method, url, body) {
        const opts = { method, headers: {} };
        if (body !== undefined) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        }
        const res = await fetch(url, opts);
        const text = await res.text();
        let data;
        try { data = text ? JSON.parse(text) : null; } catch { data = text; }
        if (!res.ok) throw new Error((data && data.error) || `${res.status} ${res.statusText}`);
        return data;
    }
    return {
        getState: () => req('GET', '/api/state'),
        create: (collection, record) => req('POST', `/api/${collection}`, record),
        update: (collection, id, patch) => req('PUT', `/api/${collection}/${encodeURIComponent(id)}`, patch),
        remove: (collection, id) => req('DELETE', `/api/${collection}/${encodeURIComponent(id)}`),
        call: (payload) => req('POST', '/api/call', payload),
    };
})();
