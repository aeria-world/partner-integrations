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
    barrierCode: localStorage.getItem('barrierCode') || null,
    screen: 'partner',
    injection: 'none',
    lastResult: null,
    boomTimers: {}, // per-barrier boom animation timers, keyed by barrierId
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
    const needsSite = ['console', 'config', 'occupancy', 'logs'];
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
        if (a.dataset.nav === 'partner') { go('partner'); }
        if (a.dataset.nav === 'site') { go('site'); }
    }));
}

const NAV = [
    ['console', 'Lane Console'],
    ['config', 'Configuration'],
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
    $$('[data-pick]', root).forEach((b) => b.addEventListener('click', () => { setSel('siteId', b.dataset.pick); setSel('barrierId', null); go('console'); }));
    $('#ns-add', root).addEventListener('click', async () => {
        const name = $('#ns-name').value.trim(), integrationId = $('#ns-int').value.trim(), secretKey = $('#ns-sec').value.trim();
        if (!name || !integrationId || !secretKey) return toast('All fields required', true);
        const s = await API.create('sites', { name, locations: [] });
        await API.create('siteBindings', { partnerId: state.partnerId, siteId: s.id, integrationId, secretKey });
        await refresh(); toast('Site added');
    });
};

// ---------- Lane Console (request builder) ----------
// Each request type declares which input fields to render.
const REQUESTS = {
    'category-availability': { label: 'Category availability', fields: [] },
    'request-entry': { label: 'Request entry', fields: ['reg', 'vtype'] },
    'request-exit': { label: 'Request exit', fields: ['reg'] },
    'mlog-entry': { label: 'Movement log — entry', fields: ['reg', 'catinfo', 'time', 'collection'] },
    'mlog-exit': { label: 'Movement log — exit', fields: ['reg', 'catinfo', 'time', 'collection'] },
    'manual-exit': { label: 'Manual exit', fields: ['reg', 'remark'] },
};

SCREENS.console = () => {
    const bars = barriersForSite(state.siteId);
    // One lane per (barrier, code).
    const lanes = [];
    bars.forEach((b) => (b.barrierCodes || []).forEach((code) => lanes.push({ b, code })));
    if (!lanes.length) {
        return `<h1>Lane Console</h1>
            <div class="empty">No barrier codes for this site yet. Add a barrier (with codes) in <a data-goto="config" style="color:var(--accent);cursor:pointer">Configuration</a>.</div>`;
    }
    // Keep a valid selected lane (barrier + code).
    let cur = lanes.find((l) => l.b.id === state.barrierId && l.code === state.barrierCode);
    if (!cur) { cur = lanes[0]; setSel('barrierId', cur.b.id); setSel('barrierCode', cur.code); }
    const pay = (bindingFor(state.partnerId, state.siteId) || {}).paymentHandledBy || (partner().paymentHandledBy || 'aeria');
    return `
    <h1>Lane Console</h1>
    <p class="sub">Payments: <b>${esc(pay)}</b> — ${pay === 'partner' ? 'collect at gate (Phase 2 flow)' : 'ms-parking collects online'}. Each box is a lane (barrier code) — select one, pick a request type, fill the fields, and Send.</p>
    <div class="console">
        <div>
            <div class="barrier-grid">${lanes.map((l) => laneBoxHtml(l.b, l.code)).join('')}</div>
        </div>
        <div class="side">
            <div class="card">
                <label>Barrier code — from the selected lane (read-only)</label>
                <div class="inline"><input id="lc-code-display" readonly value="${esc(cur.code)}" style="opacity:.85;cursor:not-allowed;flex:1;min-width:0" /><span class="badge" id="lc-code-barrier">${esc(cur.b.name)}</span></div>
                <label>Request type</label>
                <select id="lc-req">${Object.entries(REQUESTS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}</select>
                <div id="lc-fields" style="margin-top:4px"></div>
                <div class="btnbar"><button class="btn primary" id="lc-send">Send request</button><button class="btn ghost" id="lc-force">Force open</button></div>
            </div>
            <div class="card">
                <div class="inline"><h2 style="margin:0">Availability</h2><span class="spacer"></span><button class="btn sm" id="lc-avail-snap">Snapshot</button></div>
                <div id="lc-avail" style="margin-top:10px"><div class="empty">No snapshot yet — click Snapshot.</div></div>
            </div>
        </div>
    </div>`;
};

// Stable DOM-id key for a lane (getElementById tolerates any string).
function laneKey(bid, code) { return bid + '__' + code; }

// One live lane box per barrier code — a mini black lane screen.
function laneBoxHtml(b, code) {
    const key = laneKey(b.id, code);
    const selected = state.barrierId === b.id && state.barrierCode === code;
    const last = lastLogForLane(b.id, code);
    const verdict = last
        ? `<span class="result-tag tag-${last.result}">${VERDICT[last.result] || last.result}</span> <span style="opacity:.7">${esc(barrierDetailFromRes(logToRes(last)))}</span>`
        : '<span style="opacity:.55">no calls yet</span>';
    return `
    <div class="lane-box ${selected ? 'selected' : ''}" data-key="${esc(key)}">
        <div class="lane-head">
            <input type="radio" name="lc-lane" data-bid="${esc(b.id)}" data-code="${esc(code)}" value="${esc(key)}" ${selected ? 'checked' : ''} />
            <b>${esc(b.name)}</b>
            <span class="badge ${b.direction}">${b.direction}</span>
            <span class="spacer"></span>
            <button class="binfo" data-bid="${esc(b.id)}" data-code="${esc(code)}" title="Last raw response">ⓘ</button>
        </div>
        <div class="lane-code">${esc(code)}</div>
        <div class="mini-boom boom-CLOSED" id="boom-${esc(key)}">
            <div class="boom-arm-track"><div class="boom-arm"></div></div>
            <span class="boom-state" id="bs-${esc(key)}">CLOSED</span>
        </div>
        <div class="lane-verdict" id="verdict-${esc(key)}">${verdict}</div>
    </div>`;
}
BINDERS.console = (root) => {
    const g = $('[data-goto]', root);
    if (g) { g.addEventListener('click', () => go('config')); return; } // no-lanes empty state
    // Radios pick the active lane (barrier + code).
    $$('input[name="lc-lane"]', root).forEach((r) => r.addEventListener('change', () => {
        setSel('barrierId', r.dataset.bid); setSel('barrierCode', r.dataset.code);
        $$('.lane-box', root).forEach((box) => box.classList.toggle('selected', box.dataset.key === r.value));
        // Mirror the selected lane's code into the read-only request-builder display.
        const disp = $('#lc-code-display', root); if (disp) disp.value = r.dataset.code;
        const bn = $('#lc-code-barrier', root); if (bn) { const bb = db().barriers.find((x) => x.id === r.dataset.bid); bn.textContent = bb ? bb.name : ''; }
    }));
    // Info icon → modal with that lane's last request/response.
    $$('.binfo', root).forEach((b) => b.addEventListener('click', () => showLaneModal(b.dataset.bid, b.dataset.code)));
    $('#lc-req', root).addEventListener('change', () => renderReqFields(root));
    renderReqFields(root);
    $('#lc-send', root).addEventListener('click', () => onSend(root));
    $('#lc-force', root).addEventListener('click', () => forceOpen());
    const snap = $('#lc-avail-snap', root);
    if (snap) snap.addEventListener('click', () => snapAvailability(snap));
    renderAvail();
};

// One input group per field key.
function reqFieldHtml(key, b) {
    const codes = b.barrierCodes || [];
    switch (key) {
        case 'reg': {
            const plates = [...new Set(occupancyForSite(state.siteId).map((o) => o.registrationNumber))];
            return `<label>Registration number</label><input id="f-reg" value="KA01AB1234" list="lc-plates" autocomplete="off" /><datalist id="lc-plates">${plates.map((p) => `<option value="${esc(p)}"></option>`).join('')}</datalist>`;
        }
        case 'catinfo': return `<label>Category (from request-entry) — read-only</label><div id="f-catinfo" style="padding:9px 10px;border:1px solid var(--border);border-radius:8px;background:var(--panel-2)">—</div>`;
        case 'vtype': return `<label>Vehicle type</label><select id="f-vtype"><option value="4w">4w</option><option value="2w">2w</option></select>`;
        case 'remark': return `<label>Remark</label><input id="f-remark" placeholder="optional" />`;
        case 'time': return `<label>Movement time (ISO)</label>
            <div class="inline"><input id="f-time" style="flex:1;min-width:0" value="${new Date().toISOString()}" /><button type="button" class="btn sm" id="f-time-now">Now</button></div>`;
        case 'collection': return `
            <label>Collection amount <span style="font-weight:400;color:var(--muted)">(blank = don't send collection)</span></label>
            <input id="f-col-amount" type="number" min="0" placeholder="blank = none" />
            <label>Collection mode</label>
            <select id="f-col-mode"><option value="cash">cash</option><option value="QR">QR</option><option value="card">card</option></select>`;
        default: return '';
    }
}
function renderReqFields(root) {
    const container = $('#lc-fields', root);
    if (!container) return;
    const type = $('#lc-req', root).value;
    const b = barrier() || {};
    const fields = (REQUESTS[type] || {}).fields || [];
    container.innerHTML = fields.length ? fields.map((k) => reqFieldHtml(k, b)).join('') : '<div class="empty" style="padding:8px">No fields — just Send.</div>';
    const nowBtn = $('#f-time-now', container);
    if (nowBtn) nowBtn.addEventListener('click', () => { const t = $('#f-time', container); if (t) t.value = new Date().toISOString(); });
    // Track whether the operator manually edited the time (typing marks it "touched").
    const timeEl = $('#f-time', container);
    if (timeEl) timeEl.addEventListener('input', () => { timeEl.dataset.touched = '1'; });
    // Prepopulate the read-only category/unregistered block from the vehicle's saved entry/exit data.
    const regEl = $('#f-reg', container);
    const catInfo = $('#f-catinfo', container);
    if (regEl && catInfo) {
        const upd = () => { catInfo.innerHTML = catInfoHtml(regEl.value.trim()); };
        regEl.addEventListener('input', upd);
        upd();
    }
}

// Best-known category/unregistered for a plate: live occupancy → last request-entry → last request-exit.
function vehicleInfo(plate) {
    if (!plate) return null;
    const occ = occupancyForSite(state.siteId).find((o) => o.registrationNumber === plate);
    if (occ) return { categoryId: occ.category && occ.category.id, categoryName: occ.category && occ.category.name, unregistered: occ.unregistered };
    const e = latestLogPayload('request-entry', plate);
    if (e && e.category) return { categoryId: e.category.id, categoryName: e.category.name, unregistered: e.unregistered };
    const x = latestLogPayload('request-exit', plate);
    if (x && x.categoryId) return { categoryId: x.categoryId, categoryName: catNameById(x.categoryId), unregistered: undefined };
    return null;
}
function catNameById(id) {
    const row = (db().availability || []).find((a) => a.siteId === state.siteId);
    const c = row && row.categories.find((x) => x.id === id);
    return c ? c.name : '';
}
function catInfoHtml(plate) {
    const info = vehicleInfo(plate);
    if (!info || !info.categoryId) return '<span style="color:var(--muted)">No saved entry for this vehicle — run Request entry first.</span>';
    let unreg = '';
    if (info.unregistered === true) unreg = ' <span class="badge" style="color:var(--warn);border-color:var(--warn)">unregistered</span>';
    else if (info.unregistered === false) unreg = ' <span class="badge" style="color:var(--ok);border-color:var(--ok)">registered</span>';
    return `<div><b>${esc(info.categoryName || '—')}</b>${unreg}</div><div class="mono" style="font-size:11px;opacity:.7">${esc(info.categoryId)}</div>`;
}

// Refresh the persisted availability snapshot from a fresh category-availability call.
async function snapAvailability(btn) {
    if (btn) btn.disabled = true;
    try {
        const res = await API.call({ partnerId: state.partnerId, siteId: state.siteId, action: 'category-availability' });
        if (res.error || res.status >= 400) { toast('Availability failed: ' + (errorMessage(res) || res.error || res.status), true); }
        await refresh(true); // server has overwritten db.availability
        renderAvail();
    } catch (e) { toast(e.message, true); } finally { if (btn) btn.disabled = false; }
}
// Render the persisted availability model (server adjusts it ±1 on entry/exit).
function renderAvail() {
    const el = $('#lc-avail');
    if (!el) return;
    const row = (db().availability || []).find((a) => a.siteId === state.siteId);
    const cats = row && row.categories;
    if (!cats || !cats.length) { el.innerHTML = '<div class="empty">No snapshot yet — click Snapshot.</div>'; return; }
    const cell = (c, size) => `${(c[size] && c[size].available) ?? 0}/${(c[size] && c[size].total) ?? 0}`;
    const rows = cats.map((c) => `<tr><td>${esc(c.name || c.id)}</td><td>${cell(c, '2w')}</td><td>${cell(c, '4w')}</td></tr>`).join('');
    el.innerHTML = `<table><thead><tr><th>Category</th><th>2W avail/total</th><th>4W avail/total</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="sub" style="margin-top:6px">updated ${fmtTime(row.updatedAt)} · auto-adjusts on entry/exit</div>`;
}

// Animate one barrier box's boom. Only a fresh ALLOWED opens it; everything else stays DOWN.
function driveBoom(barrierId, result) {
    if (state.boomTimers[barrierId]) state.boomTimers[barrierId].forEach(clearTimeout);
    state.boomTimers[barrierId] = [];
    const boom = document.getElementById('boom-' + barrierId), lbl = document.getElementById('bs-' + barrierId);
    if (!boom) return;
    const push = (fn, ms) => state.boomTimers[barrierId].push(setTimeout(fn, ms));
    const set = (s) => { boom.className = 'mini-boom boom-' + s; if (lbl) lbl.textContent = s; };
    if (result === 'ALLOWED') {
        set('OPENING'); push(() => set('OPENED'), 250); push(() => set('CLOSING'), 6250); push(() => set('CLOSED'), 6900);
    } else {
        set('BLOCKED'); push(() => set('CLOSED'), 3000);
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
function lastLogForLane(bid, code) {
    return [...db().barrierLogs].reverse().find((l) => l.barrierId === bid && l.barrierCode === code) || null;
}
function logToRes(log) {
    return { result: log.result, status: log.response && log.response.status, response: log.response && log.response.body, error: log.error, latencyMs: log.latencyMs };
}
// A short one-line summary for a barrier box verdict.
function barrierDetailFromRes(res) {
    if (res.error) return res.error;
    if (res.status >= 400) return errorMessage(res) || 'error';
    const p = getPayload(res.response);
    if (Array.isArray(p)) return `${p.length} log(s)`;
    if (p && typeof p === 'object') {
        if (p.categories) return `${p.categories.length} categories`;
        if (p.category && p.category.name) {
            let s = p.category.name;
            if (typeof p.pendingCollectionAmount === 'number' && p.pendingCollectionAmount > 0) s += ` · ₹${p.pendingCollectionAmount} due`;
            return s;
        }
        if (typeof p.amountToPay === 'number') return p.amountToPay > 0 ? `pay ₹${p.amountToPay}` : 'settled';
    }
    return 'OK';
}
// Update one lane box's verdict line after a call.
function updateLaneBox(key, res) {
    const el = document.getElementById('verdict-' + key);
    if (!el) return;
    const outcome = res.result;
    el.innerHTML = `<span class="result-tag tag-${outcome}">${VERDICT[outcome] || outcome}</span> <span style="opacity:.7">${esc(barrierDetailFromRes(res))} · ${res.latencyMs}ms</span>`;
}
// Modal showing a lane's most recent signed request + raw response.
function showLaneModal(bid, code) {
    const b = db().barriers.find((x) => x.id === bid);
    const last = lastLogForLane(bid, code);
    const content = last
        ? JSON.stringify({ action: last.action, result: last.result, ts: last.ts, request: last.request, response: last.response, error: last.error }, null, 2)
        : 'No calls yet for this lane.';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal"><div class="inline"><h2 style="margin:0">${esc(b ? b.name : '')} · code ${esc(code)} — last raw response</h2><span class="spacer"></span><button class="btn sm" id="modal-close">Close</button></div><pre class="json" style="max-height:64vh;margin-top:10px">${esc(content)}</pre></div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    const c = $('#modal-close', overlay); if (c) c.addEventListener('click', () => overlay.remove());
}

function forceOpen() {
    if (!state.barrierId || !state.barrierCode) return;
    const key = laneKey(state.barrierId, state.barrierCode);
    driveBoom(key, 'ALLOWED');
    const el = document.getElementById('verdict-' + key);
    if (el) el.innerHTML = `<span class="result-tag tag-ALLOWED">FORCE OPENED</span> <span style="opacity:.7">manual override (not sent)</span>`;
}

async function onSend(root) {
    const type = $('#lc-req', root).value;
    const code = state.barrierCode; // the selected lane's barrier code
    const overrides = {};
    const reg = () => (($('#f-reg', root) && $('#f-reg', root).value) || '').trim();
    const buildCollection = () => {
        const el = $('#f-col-amount', root);
        if (!el) return null;
        const raw = (el.value || '').trim();
        if (raw === '') return null; // only sent when the operator enters an amount
        const mode = ($('#f-col-mode', root) && $('#f-col-mode', root).value) || 'cash';
        return { amount: Number(raw), mode }; // ms-parking Collection DTO = { amount, mode } only
    };

    let action = type, body;
    if (type === 'category-availability') {
        action = 'category-availability'; body = undefined;
    } else if (type === 'request-entry') {
        if (!reg()) return toast('Enter a registration number', true);
        const vtype = ($('#f-vtype', root) && $('#f-vtype', root).value) || '4w';
        body = { vehicle: { registrationNumber: reg(), type: vtype }, barrierId: code };
    } else if (type === 'request-exit') {
        if (!reg()) return toast('Enter a registration number', true);
        body = { vehicleNo: reg(), barrierId: code };
    } else if (type === 'mlog-entry' || type === 'mlog-exit') {
        action = 'movement-logs';
        if (!reg()) return toast('Enter a registration number', true);
        const cats = categoriesForSite(state.siteId);
        const collection = buildCollection();
        // Default to NOW at send-time; only use the field value if the operator actually edited it.
        const timeEl = $('#f-time', root);
        const time = (timeEl && timeEl.dataset.touched === '1' && (timeEl.value || '').trim()) || new Date().toISOString();
        if (timeEl && timeEl.dataset.touched !== '1') timeEl.value = time; // reflect what was sent
        // categoryId is required by the DTO but ignored by ms-parking on movement-logs; we still
        // send the REAL category from the matching request (entry/exit response) so it lines up.
        if (type === 'mlog-entry') {
            const occ = occupancyForSite(state.siteId).find((o) => o.registrationNumber === reg());
            const entryPayload = latestLogPayload('request-entry', reg()) || {};
            const utilId = (occ && occ.utilizationId) || entryPayload.id;
            if (!utilId) return toast('Run Request entry for this vehicle first', true);
            const categoryId = (occ && occ.category && occ.category.id) || (entryPayload.category && entryPayload.category.id) || (cats[0] && cats[0].id) || uuid();
            const log = { id: utilId, vehicleNo: reg(), time, type: 'entry', categoryId, barrierId: code };
            if (collection) log.collection = collection;
            body = [log];
        } else {
            const exitPayload = latestLogPayload('request-exit', reg()) || {};
            const vlogId = exitPayload.id;
            if (!vlogId) return toast('Run Request exit for this vehicle first', true);
            const categoryId = exitPayload.categoryId || (cats[0] && cats[0].id) || uuid();
            const log = { id: vlogId, vehicleNo: reg(), time, type: 'exit', categoryId, barrierId: code };
            if (collection) log.collection = collection;
            body = [log];
        }
    } else if (type === 'manual-exit') {
        if (!reg()) return toast('Enter a registration number', true);
        // Entry/exit times handled behind the scenes (entry 1h ago, exit now); no categoryId (unhandled server-side).
        body = {
            vehicleNo: reg(),
            entryTime: new Date(Date.now() - 3600000).toISOString(),
            exitTime: new Date().toISOString(),
            remark: ($('#f-remark', root) && $('#f-remark', root).value) || undefined,
            barrierId: code,
        };
    }

    const sendBtn = $('#lc-send', root);
    if (sendBtn) sendBtn.disabled = true;
    try {
        const res = await API.call({ partnerId: state.partnerId, siteId: state.siteId, barrierId: state.barrierId, action, body, overrides });
        const key = laneKey(state.barrierId, state.barrierCode);
        updateLaneBox(key, res);
        // Only the entry/exit APIs physically open the barrier.
        if (action === 'request-entry' || action === 'request-exit') driveBoom(key, res.result);
        await refresh(true);
        renderAvail(); // reflect the ±1 availability adjustment / any occupancy change
    } catch (e) { toast(e.message, true); } finally { if (sendBtn) sendBtn.disabled = false; }
}

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
