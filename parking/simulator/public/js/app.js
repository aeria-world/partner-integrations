'use strict';
/* Parking Partner Simulator — Phase 1 front end (vanilla JS). */

// ---------- tiny helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(msg, isErr) {
    const t = document.createElement('div');
    t.className = 'toast' + (isErr ? ' err' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
}
function fmtTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleString();
}

// ---------- state ----------
const state = {
    db: null,
    partnerId: localStorage.getItem('partnerId') || null,
    siteId: localStorage.getItem('siteId') || null,
    barrierId: localStorage.getItem('barrierId') || null,
    screen: 'partner',
    injection: 'none',
    lastResult: null,
    boomTimers: [],
    availSnaps: [], // last two category-availability snapshots for before/after deltas
};

const db = () => state.db;
const partner = () => db().partners.find((p) => p.id === state.partnerId) || null;
const site = () => db().sites.find((s) => s.id === state.siteId) || null;
const barrier = () => db().barriers.find((b) => b.id === state.barrierId) || null;
const bindingFor = (pid, sid) => db().siteBindings.find((b) => b.partnerId === pid && b.siteId === sid) || null;
const sitesForPartner = (pid) => db().sites.filter((s) => db().siteBindings.some((b) => b.partnerId === pid && b.siteId === s.id));
const barriersForSite = (sid) => db().barriers.filter((b) => b.siteId === sid);
const categoriesForSite = (sid) => db().categories.filter((c) => c.siteId === sid);
const whitelistForSite = (sid) => db().whitelist.filter((w) => w.siteId === sid);
const occupancyForSite = (sid) => db().occupancy.filter((o) => o.siteId === sid);
const perimetersForSite = (sid) => db().perimeters.filter((p) => p.siteId === sid);

function setSel(k, v) {
    state[k] = v;
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
}

async function refresh(silent) {
    state.db = await API.getState();
    // Drop selections that no longer exist.
    if (state.partnerId && !partner()) setSel('partnerId', null);
    if (state.siteId && !site()) setSel('siteId', null);
    if (state.barrierId && !barrier()) setSel('barrierId', null);
    if (!silent) render();
}

// ---------- render root ----------
function render() {
    renderContext();
    renderNav();
    const main = $('#app');
    const needsSite = ['barrier', 'console', 'tester', 'config', 'vehicles', 'occupancy', 'logs'];
    let screen = state.screen;
    // Pickers ('partner', 'site') render on demand; only deeper screens are force-redirected
    // when their prerequisites are missing. (Without this, selecting a partner traps you on
    // the site list and the partner breadcrumb can never return to the picker.)
    if (screen !== 'partner' && !state.partnerId) screen = 'partner';
    else if (needsSite.includes(screen) && !state.siteId) screen = 'site';
    main.innerHTML = SCREENS[screen] ? SCREENS[screen]() : SCREENS.partner();
    if (BINDERS[screen]) BINDERS[screen](main);
}

function go(screen) {
    state.screen = screen;
    render();
}

function renderContext() {
    const c = $('#context');
    if (!state.db) { c.innerHTML = ''; return; }
    const parts = [];
    if (partner()) parts.push(`<a data-nav="partner">${esc(partner().name)}</a>`);
    else { c.innerHTML = ''; return; }
    if (site()) parts.push(`<a data-nav="site">${esc(site().name)}</a>`);
    if (barrier()) parts.push(`<span>${esc(barrier().name)} <span class="badge ${barrier().direction}">${barrier().direction}</span></span>`);
    c.innerHTML = parts.join('<span class="crumb-sep">▸</span>');
    $$('[data-nav]', c).forEach((a) => a.addEventListener('click', () => {
        if (a.dataset.nav === 'partner') { setSel('siteId', null); setSel('barrierId', null); go('partner'); }
        if (a.dataset.nav === 'site') { setSel('barrierId', null); go('barrier'); }
    }));
}

const NAV = [
    ['barrier', 'Barriers'],
    ['console', 'Lane Console'],
    ['tester', 'API Tester'],
    ['config', 'Configuration'],
    ['vehicles', 'Vehicles & Whitelist'],
    ['occupancy', 'Occupancy'],
    ['logs', 'ms-parking Log'],
];
function renderNav() {
    const nav = $('#nav');
    if (!state.partnerId || !state.siteId) { nav.hidden = true; nav.innerHTML = ''; return; }
    nav.hidden = false;
    nav.innerHTML = NAV.map(([k, label]) => `<button data-screen="${k}" class="${state.screen === k ? 'active' : ''}">${label}</button>`).join('');
    $$('button', nav).forEach((b) => b.addEventListener('click', () => go(b.dataset.screen)));
}

// =====================================================================
// SCREENS
// =====================================================================
const SCREENS = {};
const BINDERS = {};

// ---------- Partner picker ----------
SCREENS.partner = () => `
    <h1>Integration-partner</h1>
    <p class="sub">Pick the ms-parking deployment to work against, or add a new one. The <b>baseUrl</b> lives here.</p>
    <div class="grid">
        ${db().partners.map((p) => `
            <button class="card pick" data-pick="${p.id}">
                <div class="title">${esc(p.name)}</div>
                <div class="meta">${esc(p.baseUrl)}</div>
                <div style="margin-top:8px"><span class="badge">payments: ${esc(p.paymentHandledBy || 'aeria')}</span></div>
            </button>`).join('')}
    </div>
    <div class="card" style="margin-top:18px">
        <h2 style="margin-top:0">Add integration-partner</h2>
        <div class="row">
            <div><label>Name</label><input id="np-name" placeholder="aeria-staging" /></div>
            <div><label>Base URL</label><input id="np-url" placeholder="https://staging-parking.aeria.world" /></div>
            <div><label>Payments handled by</label><select id="np-pay"><option value="aeria">aeria</option><option value="partner">partner</option></select></div>
        </div>
        <div class="btnbar"><button class="btn primary" id="np-add">Add partner</button></div>
    </div>`;
BINDERS.partner = (root) => {
    $$('[data-pick]', root).forEach((b) => b.addEventListener('click', () => {
        setSel('partnerId', b.dataset.pick); setSel('siteId', null); setSel('barrierId', null); go('site');
    }));
    $('#np-add', root).addEventListener('click', async () => {
        const name = $('#np-name').value.trim(), baseUrl = $('#np-url').value.trim();
        if (!name || !baseUrl) return toast('Name and Base URL required', true);
        await API.create('partners', { id: 'ptn_' + uuid().slice(0, 8), name, baseUrl, paymentHandledBy: $('#np-pay').value, createdAt: new Date().toISOString() });
        await refresh(); toast('Partner added');
    });
};

// ---------- Site picker ----------
SCREENS.site = () => {
    const sites = sitesForPartner(state.partnerId);
    return `
    <h1>Sites under ${esc(partner().name)}</h1>
    <p class="sub">Sites bound to this partner. Creating a site also creates the <b>(partner, site)</b> credential binding.</p>
    <div class="grid">
        ${sites.length ? sites.map((s) => {
        const bnd = bindingFor(state.partnerId, s.id);
        return `<button class="card pick" data-pick="${s.id}">
                <div class="title">${esc(s.name)}</div>
                <div class="meta">integrationId: ${esc(bnd ? bnd.integrationId : '—')}</div>
                <div style="margin-top:8px"><span class="badge">${barriersForSite(s.id).length} barriers</span> <span class="badge">${bnd && bnd.hasSecret ? 'secret set' : 'no secret'}</span></div>
            </button>`;
    }).join('') : '<div class="empty">No sites bound to this partner yet.</div>'}
    </div>
    <div class="card" style="margin-top:18px">
        <h2 style="margin-top:0">Add site + binding</h2>
        <div class="row">
            <div><label>Site name</label><input id="ns-name" placeholder="Prestige Tech Park" /></div>
            <div><label>integrationId (UUID)</label><input id="ns-int" placeholder="97b36430-..." /></div>
            <div><label>secretKey</label><input id="ns-sec" placeholder="shared secret" /></div>
        </div>
        <div class="btnbar"><button class="btn primary" id="ns-add">Add site</button></div>
    </div>`;
};
BINDERS.site = (root) => {
    $$('[data-pick]', root).forEach((b) => b.addEventListener('click', () => { setSel('siteId', b.dataset.pick); setSel('barrierId', null); go('barrier'); }));
    $('#ns-add', root).addEventListener('click', async () => {
        const name = $('#ns-name').value.trim(), integrationId = $('#ns-int').value.trim(), secretKey = $('#ns-sec').value.trim();
        if (!name || !integrationId || !secretKey) return toast('All fields required', true);
        const s = await API.create('sites', { name, locations: [] });
        await API.create('siteBindings', { partnerId: state.partnerId, siteId: s.id, integrationId, secretKey });
        await refresh(); toast('Site added');
    });
};

// ---------- Barrier picker ----------
SCREENS.barrier = () => {
    const bars = barriersForSite(state.siteId);
    return `
    <h1>Barriers · ${esc(site().name)}</h1>
    <p class="sub">Select a barrier to operate its lane. Add/edit barriers in <a data-goto="config" style="color:var(--accent);cursor:pointer">Configuration</a>.</p>
    <div class="grid">
        ${bars.length ? bars.map((b) => `
            <button class="card pick" data-pick="${b.id}">
                <div class="title">${esc(b.name)} <span class="badge ${b.direction}">${b.direction}</span></div>
                <div class="meta">codes: ${esc((b.barrierCodes || []).join(', ') || '—')}</div>
                <div style="margin-top:8px"><span class="badge">state: ${esc(b.state || 'CLOSED')}</span></div>
            </button>`).join('') : '<div class="empty">No barriers yet — add one in Configuration.</div>'}
    </div>`;
};
BINDERS.barrier = (root) => {
    $$('[data-pick]', root).forEach((b) => b.addEventListener('click', () => { setSel('barrierId', b.dataset.pick); go('console'); }));
    const g = $('[data-goto]', root); if (g) g.addEventListener('click', () => go('config'));
};

// ---------- Lane console ----------
SCREENS.console = () => {
    if (!state.barrierId) {
        return `<h1>Lane Console</h1><div class="empty">Pick a barrier first.</div>
            <div class="btnbar"><button class="btn primary" onclick="go('barrier')">Choose barrier</button></div>`;
    }
    const b = barrier();
    const dir = b.direction;
    const showEntry = dir === 'entry' || dir === 'both';
    const showExit = dir === 'exit' || dir === 'both';
    const cats = categoriesForSite(state.siteId);
    const pay = (bindingFor(state.partnerId, state.siteId) || {}).paymentHandledBy || (partner().paymentHandledBy || 'aeria');
    return `
    <h1>Lane Console · ${esc(b.name)} <span class="badge ${dir}">${dir}</span></h1>
    <p class="sub">Payments: <b>${esc(pay)}</b> — ${pay === 'partner' ? 'collect at gate (Phase 2 flow)' : 'ms-parking collects online'}</p>
    <div class="console">
        <div>
            <div id="display" class="display idle">
                <div class="verdict">READY</div>
                <div class="line">Enter a registration number and trigger the lane.</div>
            </div>
            <div id="boom" class="card boom-CLOSED" style="margin-top:14px">
                <div class="boom-wrap">
                    <div class="boom-base"></div>
                    <div class="boom-arm-track"><div class="boom-arm"></div></div>
                    <div class="boom-state" id="boom-state">CLOSED</div>
                </div>
            </div>
            <div class="card">
                <div class="inline"><h2 style="margin:0">Availability</h2><span class="spacer"></span><button class="btn sm" id="lc-avail-snap">Snapshot</button></div>
                <div id="lc-avail" style="margin-top:10px"><div class="empty">No snapshot yet — click Snapshot before and after an entry/exit to see the bay count change.</div></div>
            </div>
            <div class="card">
                <h2 style="margin-top:0">Raw response</h2>
                <pre class="json" id="rawout">—</pre>
            </div>
        </div>
        <div class="side">
            <div class="card">
                <label>Registration number (reader)</label>
                <input id="lc-reg" placeholder="KA01AB1234" value="KA01AB1234" />
                <label>Barrier code</label>
                <select id="lc-code">${(b.barrierCodes || []).map((c) => `<option>${esc(c)}</option>`).join('') || '<option value="">(none set)</option>'}</select>
                ${cats.length ? `<label>Category (for movement-log)</label><select id="lc-cat">${cats.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>` : ''}
                <label>Error injection (FR-9)</label>
                <select id="lc-inj">
                    <option value="none">none</option>
                    <option value="bad">bad signature</option>
                    <option value="expired">expired timestamp</option>
                </select>
            </div>
            <div class="card">
                <div class="btnbar" style="margin-top:0">
                    ${showEntry ? `<button class="btn primary" data-act="request-entry">Request Entry</button>` : ''}
                    ${showExit ? `<button class="btn primary" data-act="request-exit">Request Exit</button>` : ''}
                    ${showEntry ? `<button class="btn" data-act="mlog-entry">Log Entry</button>` : ''}
                    ${showExit ? `<button class="btn" data-act="mlog-exit">Log Exit</button>` : ''}
                    <button class="btn ghost" data-act="force-open">Force open</button>
                </div>
            </div>
        </div>
    </div>`;
};
BINDERS.console = (root) => {
    if (!state.barrierId) return;
    $$('[data-act]', root).forEach((btn) => btn.addEventListener('click', () => onLaneAction(btn.dataset.act, root)));
    const snap = $('#lc-avail-snap', root);
    if (snap) snap.addEventListener('click', () => snapAvailability(snap));
    renderAvail();
};

// Fetch category-availability and render current counts with a delta vs the previous snapshot.
async function snapAvailability(btn) {
    if (btn) btn.disabled = true;
    try {
        const res = await API.call({ partnerId: state.partnerId, siteId: state.siteId, action: 'category-availability' });
        if (res.error || res.status >= 400) { toast('Availability failed: ' + (errorMessage(res) || res.error || res.status), true); }
        const payload = getPayload(res.response);
        const categories = (payload && payload.categories) || [];
        state.availSnaps.push({ ts: new Date().toISOString(), categories });
        if (state.availSnaps.length > 2) state.availSnaps.shift();
        renderAvail();
        await refresh(true);
    } catch (e) { toast(e.message, true); } finally { if (btn) btn.disabled = false; }
}
function renderAvail() {
    const el = $('#lc-avail');
    if (!el) return;
    const snaps = state.availSnaps;
    if (!snaps.length) { el.innerHTML = '<div class="empty">No snapshot yet.</div>'; return; }
    const cur = snaps[snaps.length - 1];
    const prev = snaps.length > 1 ? snaps[snaps.length - 2] : null;
    const cell = (c, size) => {
        const a = (c[size] && c[size].available) ?? 0, t = (c[size] && c[size].total) ?? 0;
        let delta = '';
        if (prev) {
            const p = prev.categories.find((x) => x.id === c.id);
            const d = a - ((p && p[size] && p[size].available) ?? a);
            if (d !== 0) delta = ` <span class="pill" style="color:${d < 0 ? 'var(--err)' : 'var(--ok)'}">${d > 0 ? '+' : ''}${d}</span>`;
        }
        return `${a}/${t}${delta}`;
    };
    const rows = cur.categories.map((c) => `<tr><td>${esc(c.name || c.id)}</td><td>${cell(c, '2w')}</td><td>${cell(c, '4w')}</td></tr>`).join('');
    el.innerHTML = `<table><thead><tr><th>Category</th><th>2W avail/total</th><th>4W avail/total</th></tr></thead><tbody>${rows || '<tr><td colspan="3" class="empty">No categories returned</td></tr>'}</tbody></table>
        <div class="sub" style="margin-top:6px">${prev ? `Δ shown vs snapshot at ${fmtTime(prev.ts)} · ` : 'first snapshot · '}latest ${fmtTime(cur.ts)}</div>`;
}

function driveBoom(result) {
    state.boomTimers.forEach(clearTimeout);
    state.boomTimers = [];
    const boom = $('#boom'), lbl = $('#boom-state');
    if (!boom) return;
    const set = (s) => { boom.className = 'card boom-' + s; if (lbl) lbl.textContent = s; };
    const allow = result === 'ALLOWED';
    if (allow) {
        set('OPENING');
        state.boomTimers.push(setTimeout(() => set('OPENED'), 250));
        state.boomTimers.push(setTimeout(() => set('CLOSING'), 6250));
        state.boomTimers.push(setTimeout(() => set('CLOSED'), 6900));
    } else if (result === 'ALREADY_REPORTED') {
        set('OPENING');
        state.boomTimers.push(setTimeout(() => set('OPENED'), 250));
        state.boomTimers.push(setTimeout(() => set('CLOSED'), 3000));
    } else {
        set('BLOCKED');
        state.boomTimers.push(setTimeout(() => set('CLOSED'), 3000));
    }
}

const VERDICT = {
    ALLOWED: 'ALLOWED', DENIED: 'DENIED', PAYMENT_DUE: 'PAYMENT DUE',
    ALREADY_REPORTED: 'ALREADY REPORTED', NETWORK_ERROR: 'NO RESPONSE',
};

// ms-parking success envelope: { statusCode, response: { message, code, data: <payload> } }.
// Tolerates a bare { data } or a raw value too.
function getPayload(body) {
    if (body && typeof body === 'object') {
        if (body.response && body.response.data !== undefined) return body.response.data;
        if (body.data !== undefined) return body.data;
    }
    return body;
}

// Pull the payload out of a stored log's response body.
function latestLogPayload(action, plate) {
    const l = [...db().barrierLogs].reverse().find((x) => x.action === action && x.registrationNumber === plate && x.response && x.response.body);
    if (!l) return null;
    return getPayload(l.response.body);
}

// ms-parking errors serialize as { statusCode, response: { message, code, error } }.
function errorMessage(res) {
    const b = res.response;
    if (!b) return '';
    if (b.response && b.response.message) return b.response.message + (b.response.code ? ` (code ${b.response.code})` : '');
    if (typeof b === 'string') return b;
    return b.message || '';
}
function updateDisplay(action, res) {
    const d = $('#display');
    if (!d) return;
    const outcome = res.result;
    const payload = getPayload(res.response);
    d.className = 'display ' + outcome;
    const lines = [];
    const reg = $('#lc-reg') ? $('#lc-reg').value : '';
    if (payload && typeof payload === 'object') {
        if (payload.bay && (payload.bay.name || payload.bay.location)) lines.push(`Bay: ${esc(payload.bay.name || '')} ${esc(payload.bay.location || '')}`);
        if (payload.category && payload.category.name) lines.push(`Category: ${esc(payload.category.name)}`);
        if (typeof payload.pendingCollectionAmount === 'number') lines.push(`Pending: ₹${payload.pendingCollectionAmount}`);
        if (typeof payload.totalFare === 'number') lines.push(`Fare: ₹${payload.totalFare} (pre-collected ₹${payload.preCollectedFare ?? 0})`);
        if (typeof payload.amountToPay === 'number') lines.push(`Amount to pay: ₹${payload.amountToPay}`);
        if (payload.entryTime) lines.push(`Entry: ${fmtTime(payload.entryTime)}`);
        if (payload.exitTime) lines.push(`Exit: ${fmtTime(payload.exitTime)}`);
    }
    if (res.error) lines.push('Error: ' + esc(res.error));
    else if (res.status >= 400) {
        const em = errorMessage(res);
        if (em) lines.push('Message: ' + esc(em));
    }
    d.innerHTML = `
        <div class="plate">${esc(reg || '—')}</div>
        <div class="verdict">${VERDICT[outcome] || outcome}</div>
        ${lines.map((l) => `<div class="line">${l}</div>`).join('')}
        <div class="line" style="opacity:.6">HTTP ${res.status ?? '—'} · ${res.latencyMs}ms · <span class="result-tag tag-${outcome}">${outcome}</span></div>`;
    $('#rawout').textContent = JSON.stringify(res.response ?? res.error, null, 2);
}

async function onLaneAction(act, root) {
    const b = barrier();
    const reg = ($('#lc-reg', root).value || '').trim();
    const code = $('#lc-code', root) ? $('#lc-code', root).value : '';
    const injection = $('#lc-inj', root).value;
    const overrides = injection === 'none' ? {} : { signatureMode: injection };

    if (act === 'force-open') {
        driveBoom('ALLOWED');
        const d = $('#display'); d.className = 'display ALLOWED';
        d.innerHTML = `<div class="plate">${esc(reg || '—')}</div><div class="verdict">FORCE OPENED</div><div class="line">Manual guard override (not sent to ms-parking).</div>`;
        return;
    }

    let action = act, body;
    if (act === 'request-entry') {
        if (!reg) return toast('Enter a registration number', true);
        const v = db().vehicles.find((x) => x.registrationNumber === reg);
        body = { vehicle: { registrationNumber: reg, ...(v && v.type ? { type: v.type } : {}) }, barrierId: code };
    } else if (act === 'request-exit') {
        if (!reg) return toast('Enter a registration number', true);
        body = { vehicleNo: reg, barrierId: code };
    } else if (act === 'mlog-entry' || act === 'mlog-exit') {
        action = 'movement-logs';
        if (!reg) return toast('Enter a registration number', true);
        const catEl = $('#lc-cat', root);
        const categoryId = catEl ? catEl.value : uuid(); // required by DTO but unused server-side
        if (act === 'mlog-entry') {
            // id must be the utilization id from the prior request-entry (ms-parking does getUtilizationById).
            const occ = occupancyForSite(state.siteId).find((o) => o.registrationNumber === reg);
            const utilId = (occ && occ.utilizationId) || (latestLogPayload('request-entry', reg) || {}).id;
            if (!utilId) return toast('No active entry for this vehicle — run Request Entry first', true);
            body = [{ id: utilId, vehicleNo: reg, time: new Date().toISOString(), type: 'entry', categoryId, barrierId: code }];
        } else {
            // id must be the vehicle-log id from the prior request-exit (getVehicleLogUsingId).
            const exitPayload = latestLogPayload('request-exit', reg);
            const vLogId = exitPayload && exitPayload.id;
            if (!vLogId) return toast('No request-exit found for this vehicle — run Request Exit first', true);
            // logExitMovement destructures collection unconditionally → must send one to avoid a 500.
            const amount = typeof exitPayload.amountToPay === 'number' ? exitPayload.amountToPay : 0;
            body = [{ id: vLogId, vehicleNo: reg, time: new Date().toISOString(), type: 'exit', categoryId, barrierId: code, collection: { amount, mode: 'cash' } }];
        }
    } else if (act === 'category-availability') {
        action = 'category-availability'; body = undefined;
    }

    setBusy(root, true);
    try {
        const res = await API.call({ partnerId: state.partnerId, siteId: state.siteId, barrierId: state.barrierId, action, body, overrides });
        updateDisplay(action, res);
        driveBoom(res.result);
        await refresh(true); // pick up occupancy/log changes in the background
    } catch (e) {
        toast(e.message, true);
    } finally {
        setBusy(root, false);
    }
}
function setBusy(root, busy) { $$('[data-act]', root).forEach((b) => (b.disabled = busy)); }

// ---------- API Tester ----------
const TESTER_SAMPLES = {
    'category-availability': null,
    'request-entry': { vehicle: { registrationNumber: 'KA01AB1234', type: '4w' }, barrierId: 'GATE-A-IN' },
    'request-exit': { vehicleNo: 'KA01AB1234', barrierId: 'GATE-A-OUT' },
    'movement-logs': [{ id: '00000000-0000-0000-0000-000000000001', vehicleNo: 'KA01AB1234', time: new Date().toISOString(), type: 'entry', categoryId: '00000000-0000-0000-0000-000000000002', barrierId: 'GATE-A-IN' }],
    'manual-exit': { vehicleNo: 'KA01AB1234', entryTime: new Date(Date.now() - 3600000).toISOString(), exitTime: new Date().toISOString(), remark: 'manual', barrierId: 'GATE-A-OUT' },
};
SCREENS.tester = () => `
    <h1>API Tester</h1>
    <p class="sub">Fire any of the 5 partner APIs with a custom body. Request is signed server-side for the current (partner, site).</p>
    ${Object.keys(TESTER_SAMPLES).map((a) => `
        <div class="card">
            <div class="inline"><b>${a}</b><span class="spacer"></span><span class="pill">${a === 'category-availability' ? 'GET' : 'POST'}</span></div>
            ${a === 'category-availability' ? '' : `<label>Body (JSON)</label><textarea id="t-${a}">${esc(JSON.stringify(TESTER_SAMPLES[a], null, 2))}</textarea>`}
            <div class="btnbar"><button class="btn primary" data-test="${a}">Send</button></div>
            <pre class="json" id="tr-${a}" hidden></pre>
        </div>`).join('')}`;
BINDERS.tester = (root) => {
    $$('[data-test]', root).forEach((btn) => btn.addEventListener('click', async () => {
        const a = btn.dataset.test;
        let body;
        if (a !== 'category-availability') {
            try { body = JSON.parse($('#t-' + a, root).value); } catch (e) { return toast('Invalid JSON: ' + e.message, true); }
        }
        btn.disabled = true;
        try {
            const res = await API.call({ partnerId: state.partnerId, siteId: state.siteId, action: a, body });
            const out = $('#tr-' + a, root); out.hidden = false;
            out.textContent = `HTTP ${res.status} · ${res.latencyMs}ms · ${res.result}\nx-signature: ${res.signature}\n\n` + JSON.stringify(res.response ?? res.error, null, 2);
            await refresh(true);
        } catch (e) { toast(e.message, true); } finally { btn.disabled = false; }
    }));
};

// ---------- Configuration ----------
SCREENS.config = () => {
    const p = partner(), s = site(), bnd = bindingFor(state.partnerId, state.siteId);
    return `
    <h1>Configuration</h1>
    <p class="sub">Author the topology for <b>${esc(s.name)}</b> under <b>${esc(p.name)}</b>.</p>

    <div class="card">
        <h2 style="margin-top:0">Partner</h2>
        <div class="row">
            <div><label>Name</label><input id="cf-pname" value="${esc(p.name)}" /></div>
            <div><label>Base URL</label><input id="cf-purl" value="${esc(p.baseUrl)}" /></div>
            <div><label>Payments handled by</label><select id="cf-ppay">
                <option value="aeria" ${p.paymentHandledBy === 'aeria' ? 'selected' : ''}>aeria</option>
                <option value="partner" ${p.paymentHandledBy === 'partner' ? 'selected' : ''}>partner</option>
            </select></div>
        </div>
        <div class="btnbar"><button class="btn primary" id="cf-psave">Save partner</button></div>
    </div>

    <div class="card">
        <h2 style="margin-top:0">Binding (this partner + site)</h2>
        <div class="row">
            <div><label>integrationId</label><input id="cf-bint" value="${esc(bnd ? bnd.integrationId : '')}" /></div>
            <div><label>secretKey ${bnd && bnd.hasSecret ? '(set — leave blank to keep)' : ''}</label><input id="cf-bsec" placeholder="${bnd && bnd.hasSecret ? '•••••••• stored' : 'secret'}" /></div>
            <div><label>Payments override</label><select id="cf-bpay">
                <option value="">(inherit partner)</option>
                <option value="aeria" ${bnd && bnd.paymentHandledBy === 'aeria' ? 'selected' : ''}>aeria</option>
                <option value="partner" ${bnd && bnd.paymentHandledBy === 'partner' ? 'selected' : ''}>partner</option>
            </select></div>
        </div>
        <div class="btnbar"><button class="btn primary" id="cf-bsave">Save binding</button></div>
    </div>

    ${genericSection('perimeters', 'Perimeters', [
        { key: 'name', label: 'Name' },
    ], (r) => r.siteId === state.siteId, () => ({ siteId: state.siteId, parentPerimeterId: null }))}

    <div class="card">
        <h2 style="margin-top:0">Barriers</h2>
        <table><thead><tr><th>Name</th><th>Direction</th><th>Codes</th><th>Perimeter</th><th></th></tr></thead>
        <tbody>
        ${barriersForSite(state.siteId).map((b) => `<tr>
            <td>${esc(b.name)}</td><td><span class="badge ${b.direction}">${b.direction}</span></td>
            <td class="mono">${esc((b.barrierCodes || []).join(', '))}</td>
            <td>${esc((perimetersForSite(state.siteId).find((p) => p.id === b.perimeterId) || {}).name || '—')}</td>
            <td><button class="btn sm danger" data-del-barrier="${b.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">None</td></tr>'}
        </tbody></table>
        <div class="row" style="margin-top:12px">
            <div><label>Name</label><input id="cb-name" placeholder="B1 Entry Boom" /></div>
            <div><label>Direction</label><select id="cb-dir"><option>entry</option><option>exit</option><option>both</option></select></div>
            <div><label>Barrier codes (comma-sep)</label><input id="cb-codes" placeholder="GATE-A-IN" /></div>
            <div><label>Perimeter</label><select id="cb-per">${perimetersForSite(state.siteId).map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('') || '<option value="">(none)</option>'}</select></div>
        </div>
        <div class="btnbar"><button class="btn primary" id="cb-add">Add barrier</button></div>
    </div>

    ${genericSection('categories', 'Categories', [
        { key: 'name', label: 'Name' },
        { key: 'workflow', label: 'Workflow', type: 'select', options: ['visitor', 'employee', 'tenant_sold', 'staff'] },
    ], (r) => r.siteId === state.siteId, () => ({ siteId: state.siteId }))}

    ${genericSection('parkings', 'Parkings', [{ key: 'name', label: 'Name' }, { key: 'parkingType', label: 'Type' }], (r) => r.siteId === state.siteId, () => ({ siteId: state.siteId }))}
    ${genericSection('bays', 'Bays', [{ key: 'name', label: 'Name' }, { key: 'parallelCount', label: 'Parallel', type: 'number' }], (r) => true, () => ({}))}
    `;
};
BINDERS.config = (root) => {
    $('#cf-psave', root).addEventListener('click', async () => {
        await API.update('partners', state.partnerId, { name: $('#cf-pname').value.trim(), baseUrl: $('#cf-purl').value.trim(), paymentHandledBy: $('#cf-ppay').value });
        await refresh(true); toast('Partner saved');
    });
    $('#cf-bsave', root).addEventListener('click', async () => {
        const bnd = bindingFor(state.partnerId, state.siteId);
        const patch = { integrationId: $('#cf-bint').value.trim(), paymentHandledBy: $('#cf-bpay').value || undefined };
        const sec = $('#cf-bsec').value.trim();
        if (sec) patch.secretKey = sec;
        if (bnd) await API.update('siteBindings', bnd.id, patch);
        else await API.create('siteBindings', { partnerId: state.partnerId, siteId: state.siteId, ...patch, secretKey: sec });
        await refresh(); toast('Binding saved');
    });
    $('#cb-add', root).addEventListener('click', async () => {
        const name = $('#cb-name').value.trim();
        if (!name) return toast('Barrier name required', true);
        const codes = $('#cb-codes').value.split(',').map((c) => c.trim()).filter(Boolean);
        await API.create('barriers', { siteId: state.siteId, perimeterId: $('#cb-per').value || null, name, direction: $('#cb-dir').value, barrierCodes: codes, state: 'CLOSED' });
        await refresh(); toast('Barrier added');
    });
    $$('[data-del-barrier]', root).forEach((b) => b.addEventListener('click', async () => { await API.remove('barriers', b.dataset.delBarrier); await refresh(); }));
    bindGenericSections(root);
};

// Reusable list+add+delete section for simple collections.
const _genericSpecs = {};
function genericSection(collection, title, fields, filterFn, defaultsFn) {
    _genericSpecs[collection] = { fields, filterFn, defaultsFn };
    const rows = db()[collection].filter(filterFn);
    return `
    <div class="card" data-generic="${collection}">
        <h2 style="margin-top:0">${title}</h2>
        <table><thead><tr>${fields.map((f) => `<th>${f.label}</th>`).join('')}<th></th></tr></thead>
        <tbody>
        ${rows.map((r) => `<tr>${fields.map((f) => `<td>${esc(r[f.key] ?? '')}</td>`).join('')}<td><button class="btn sm danger" data-gdel="${r.id}">Delete</button></td></tr>`).join('') || `<tr><td colspan="${fields.length + 1}" class="empty">None</td></tr>`}
        </tbody></table>
        <div class="row" style="margin-top:12px">
            ${fields.map((f) => `<div><label>${f.label}</label>${f.type === 'select'
        ? `<select data-gf="${f.key}">${f.options.map((o) => `<option>${o}</option>`).join('')}</select>`
        : `<input data-gf="${f.key}" type="${f.type || 'text'}" />`}</div>`).join('')}
        </div>
        <div class="btnbar"><button class="btn primary" data-gadd>Add</button></div>
    </div>`;
}
function bindGenericSections(root) {
    $$('[data-generic]', root).forEach((card) => {
        const collection = card.dataset.generic;
        const spec = _genericSpecs[collection];
        $('[data-gadd]', card).addEventListener('click', async () => {
            const rec = { ...(spec.defaultsFn ? spec.defaultsFn() : {}) };
            spec.fields.forEach((f) => {
                const el = $(`[data-gf="${f.key}"]`, card);
                let v = el.value.trim();
                if (f.type === 'number') v = v === '' ? null : Number(v);
                rec[f.key] = v;
            });
            if (!rec[spec.fields[0].key]) return toast(spec.fields[0].label + ' required', true);
            await API.create(collection, rec);
            await refresh(); toast('Added');
        });
        $$('[data-gdel]', card).forEach((b) => b.addEventListener('click', async () => { await API.remove(collection, b.dataset.gdel); await refresh(); }));
    });
}

// ---------- Vehicles & Whitelist ----------
SCREENS.vehicles = () => `
    <h1>Vehicles & Whitelist</h1>
    <p class="sub">Vehicles are a global registry. Whitelisting is <b>per site</b> — added to <b>${esc(site().name)}</b>.</p>
    <div class="card">
        <h2 style="margin-top:0">Vehicle registry</h2>
        <table><thead><tr><th>Reg. no</th><th>Type</th><th>Model</th><th>Colour</th><th></th></tr></thead><tbody>
        ${db().vehicles.map((v) => `<tr><td class="mono">${esc(v.registrationNumber)}</td><td>${esc(v.type || '')}</td><td>${esc(v.model || '')}</td><td>${esc(v.color || '')}</td>
            <td><button class="btn sm" data-wl="${esc(v.registrationNumber)}">Whitelist here</button> <button class="btn sm danger" data-dv="${esc(v.registrationNumber)}">Delete</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">None</td></tr>'}
        </tbody></table>
        <div class="row" style="margin-top:12px">
            <div><label>Reg. no</label><input id="v-reg" placeholder="KA01AB1234" /></div>
            <div><label>Type</label><select id="v-type"><option value="4w">4w</option><option value="2w">2w</option></select></div>
            <div><label>Model</label><input id="v-model" /></div>
            <div><label>Colour</label><input id="v-color" /></div>
        </div>
        <div class="btnbar"><button class="btn primary" id="v-add">Add vehicle</button></div>
    </div>
    <div class="card">
        <h2 style="margin-top:0">Whitelist · ${esc(site().name)}</h2>
        <table><thead><tr><th>Reg. no</th><th>Category</th><th>Valid till</th><th></th></tr></thead><tbody>
        ${whitelistForSite(state.siteId).map((w) => `<tr><td class="mono">${esc(w.registrationNumber)}</td>
            <td>${esc((categoriesForSite(state.siteId).find((c) => c.id === w.categoryId) || {}).name || '—')}</td>
            <td>${fmtTime(w.validTill)}</td>
            <td><button class="btn sm danger" data-dw="${w.id}">Remove</button></td></tr>`).join('') || '<tr><td colspan="4" class="empty">None</td></tr>'}
        </tbody></table>
    </div>`;
BINDERS.vehicles = (root) => {
    $('#v-add', root).addEventListener('click', async () => {
        const reg = $('#v-reg').value.trim();
        if (!reg) return toast('Reg. no required', true);
        try {
            await API.create('vehicles', { registrationNumber: reg, type: $('#v-type').value, model: $('#v-model').value.trim(), color: $('#v-color').value.trim() });
            await refresh(); toast('Vehicle added');
        } catch (e) { toast(e.message, true); }
    });
    $$('[data-dv]', root).forEach((b) => b.addEventListener('click', async () => { await API.remove('vehicles', b.dataset.dv); await refresh(); }));
    $$('[data-wl]', root).forEach((b) => b.addEventListener('click', async () => {
        const cat = categoriesForSite(state.siteId)[0];
        await API.create('whitelist', { registrationNumber: b.dataset.wl, siteId: state.siteId, categoryId: cat ? cat.id : null, validFrom: new Date().toISOString(), validTill: new Date(Date.now() + 365 * 864e5).toISOString(), source: 'manual' });
        await refresh(); toast('Whitelisted for this site');
    }));
    $$('[data-dw]', root).forEach((b) => b.addEventListener('click', async () => { await API.remove('whitelist', b.dataset.dw); await refresh(); }));
};

// ---------- Occupancy ----------
SCREENS.occupancy = () => {
    const occ = occupancyForSite(state.siteId);
    return `
    <h1>Occupancy · ${esc(site().name)}</h1>
    <p class="sub">Vehicles the simulator believes are currently inside (derived from entry/exit calls).</p>
    <div class="card">
        <table><thead><tr><th>Reg. no</th><th>Entry</th><th>Duration</th><th>Bay</th><th>Category</th><th></th></tr></thead><tbody>
        ${occ.length ? occ.map((o) => `<tr>
            <td class="mono">${esc(o.registrationNumber)}</td>
            <td>${fmtTime(o.entryTime)}</td>
            <td>${duration(o.entryTime)}</td>
            <td>${esc((o.bay && o.bay.name) || '—')}</td>
            <td>${esc((o.category && o.category.name) || '—')}</td>
            <td><button class="btn sm" data-mexit="${o.id}">Manual exit</button></td></tr>`).join('') : '<tr><td colspan="6" class="empty">Nobody inside</td></tr>'}
        </tbody></table>
    </div>`;
};
function duration(iso) {
    if (!iso) return '—';
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    const h = Math.floor(mins / 60), m = mins % 60;
    return (h ? h + 'h ' : '') + m + 'm';
}
BINDERS.occupancy = (root) => {
    $$('[data-mexit]', root).forEach((b) => b.addEventListener('click', async () => {
        const o = occupancyForSite(state.siteId).find((x) => x.id === b.dataset.mexit);
        if (!o) return;
        const body = { vehicleNo: o.registrationNumber, entryTime: o.entryTime, exitTime: new Date().toISOString(), remark: 'reconcile missed exit', barrierId: (barriersForSite(state.siteId).find((x) => x.direction !== 'entry') || {}).barrierCodes?.[0] || '' };
        try {
            const res = await API.call({ partnerId: state.partnerId, siteId: state.siteId, action: 'manual-exit', body });
            toast('manual-exit: ' + res.result);
            await refresh();
        } catch (e) { toast(e.message, true); }
    }));
};

// ---------- Logs ----------
SCREENS.logs = () => {
    const logs = [...db().barrierLogs].reverse(); // newest first
    return `
    <h1>ms-parking Log</h1>
    <p class="sub">Every call is stored in db.json and listed newest-first. Includes the signed x-signature and full response.</p>
    <div class="card">
        <div class="btnbar" style="margin-top:0">
            <button class="btn sm" id="log-export">Export JSON</button>
            <span class="pill">${logs.length} entries</span>
        </div>
    </div>
    ${logs.length ? logs.map((l) => `
        <div class="card">
            <div class="inline">
                <span class="result-tag tag-${l.result}">${l.result}</span>
                <b>${esc(l.action)}</b>
                <span class="pill">${esc(l.registrationNumber || '')}</span>
                <span class="spacer"></span>
                <span class="pill">HTTP ${l.response ? l.response.status ?? '—' : '—'}</span>
                <span class="pill">${l.latencyMs}ms</span>
                ${l.injected ? `<span class="pill" style="color:var(--warn)">injected: ${esc(l.injected)}</span>` : ''}
                <span class="pill">${fmtTime(l.ts)}</span>
                <button class="btn sm" data-copy="${l.id}">Copy</button>
            </div>
            <details style="margin-top:8px"><summary>request / response</summary>
                <pre class="json">${esc(JSON.stringify({ request: l.request, response: l.response, error: l.error }, null, 2))}</pre>
            </details>
        </div>`).join('') : '<div class="empty">No calls yet.</div>'}`;
};
BINDERS.logs = (root) => {
    const b = $('#log-export', root);
    if (b) b.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(db().barrierLogs, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'barrier-logs.json'; a.click();
    });
    $$('[data-copy]', root).forEach((btn) => btn.addEventListener('click', async () => {
        const l = db().barrierLogs.find((x) => x.id === btn.dataset.copy);
        if (!l) return;
        const text = JSON.stringify({ request: l.request, response: l.response, error: l.error }, null, 2);
        try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
        catch (e) { toast('Copy failed: ' + e.message, true); }
    }));
};

// expose go() for inline handlers
window.go = go;

// ---------- boot ----------
(async function boot() {
    try {
        await refresh();
    } catch (e) {
        $('#app').innerHTML = `<div class="empty">Failed to load: ${esc(e.message)}</div>`;
    }
})();
