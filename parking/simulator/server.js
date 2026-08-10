'use strict';
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { load, save, COLLECTIONS } = require('./src/db');
const { callMsParking, classifyResult, payloadOf } = require('./src/msparking');

const PORT = process.env.PORT || 4100;
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- helpers ---------------------------------------------------------------

/** Return a copy of the DB with secrets stripped (never ship secretKey to the browser). */
function redact(db) {
    const copy = structuredClone(db);
    copy.siteBindings = copy.siteBindings.map((b) => {
        const { secretKey, ...rest } = b;
        return { ...rest, hasSecret: Boolean(secretKey) };
    });
    return copy;
}

function resolveConnection(db, partnerId, siteId) {
    const partner = db.partners.find((p) => p.id === partnerId);
    if (!partner) return { error: 'Unknown partnerId' };
    const binding = db.siteBindings.find((b) => b.partnerId === partnerId && b.siteId === siteId);
    if (!binding) return { error: 'No (partner, site) binding — set integrationId + secretKey first' };
    if (!binding.integrationId || !binding.secretKey) return { error: 'Binding is missing integrationId or secretKey' };
    return { partner, binding };
}

// ---- state (redacted) ------------------------------------------------------

app.get('/api/state', (req, res) => {
    res.json(redact(load()));
});

// ---- generic CRUD ----------------------------------------------------------

function collectionOr404(name, res) {
    if (!Object.prototype.hasOwnProperty.call(COLLECTIONS, name)) {
        res.status(404).json({ error: `Unknown collection: ${name}` });
        return null;
    }
    return COLLECTIONS[name];
}

app.post('/api/:collection', (req, res, next) => {
    const name = req.params.collection;
    if (name === 'call' || name === 'state' || name === 'health') return next(); // reserved, handled elsewhere
    const idField = collectionOr404(name, res);
    if (!idField) return;
    const db = load();
    const record = { ...req.body };
    if (!record[idField]) record[idField] = crypto.randomUUID();
    // Prevent silent duplicate primary keys.
    if (db[name].some((r) => r[idField] === record[idField])) {
        return res.status(409).json({ error: `${name} with ${idField}=${record[idField]} already exists` });
    }
    db[name].push(record);
    save(db);
    res.status(201).json(record);
});

app.put('/api/:collection/:id', (req, res) => {
    const name = req.params.collection;
    const idField = collectionOr404(name, res);
    if (!idField) return;
    const db = load();
    const idx = db[name].findIndex((r) => String(r[idField]) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    // For siteBindings, an empty secretKey in the patch means "leave the stored one".
    const patch = { ...req.body };
    if (name === 'siteBindings' && (patch.secretKey === '' || patch.secretKey === undefined)) {
        delete patch.secretKey;
    }
    delete patch[idField];
    db[name][idx] = { ...db[name][idx], ...patch };
    save(db);
    const out = name === 'siteBindings' ? { ...db[name][idx], secretKey: undefined, hasSecret: Boolean(db[name][idx].secretKey) } : db[name][idx];
    res.json(out);
});

app.delete('/api/:collection/:id', (req, res) => {
    const name = req.params.collection;
    const idField = collectionOr404(name, res);
    if (!idField) return;
    const db = load();
    const before = db[name].length;
    db[name] = db[name].filter((r) => String(r[idField]) !== String(req.params.id));
    if (db[name].length === before) return res.status(404).json({ error: 'Not found' });
    save(db);
    res.json({ ok: true });
});

// ---- the signing proxy: call ms-parking ------------------------------------

app.post('/api/call', async (req, res) => {
    const { partnerId, siteId, barrierId, action, body, overrides } = req.body || {};
    const db = load();
    const conn = resolveConnection(db, partnerId, siteId);
    if (conn.error) return res.status(400).json({ error: conn.error });

    const result = await callMsParking({
        baseUrl: conn.partner.baseUrl,
        integrationId: conn.binding.integrationId,
        secretKey: conn.binding.secretKey,
        action,
        body,
        overrides: overrides || {},
    });

    const outcome = classifyResult(action, result.status, result.response, result.error);
    const barrier = db.barriers.find((b) => b.id === barrierId);

    // Persist the audit log (newest entries read first in the UI).
    const logEntry = {
        id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        partnerId,
        siteId,
        barrierId: barrierId || null,
        barrierCode: body && !Array.isArray(body) ? body.barrierId || null : null,
        direction: barrier ? barrier.direction : null,
        action,
        registrationNumber: extractReg(action, body),
        request: { ...result.request, headers: { 'x-signature': result.signature } },
        response: { status: result.status, body: result.response },
        latencyMs: result.latencyMs,
        result: outcome,
        error: result.error || null,
        injected: overrides && overrides.signatureMode ? overrides.signatureMode : null,
    };
    db.barrierLogs.push(logEntry);

    // Local availability model (persisted): a fresh availability call overwrites the snapshot;
    // a successful entry decrements the resolved category's available (for the vehicle's size),
    // a successful exit increments it back.
    const data = payloadOf(result.response) || {};
    if (action === 'category-availability' && outcome === 'ALLOWED' && Array.isArray(data.categories)) {
        setAvailability(db, siteId, data.categories);
    } else if (action === 'request-entry' && (outcome === 'ALLOWED' || outcome === 'PAYMENT_DUE')) {
        const vt = body && body.vehicle && body.vehicle.type;
        if (data.category && data.category.id && vt) adjustAvailability(db, siteId, data.category.id, vt, -1);
    } else if (action === 'request-exit' && outcome === 'ALLOWED') {
        const plate = extractReg(action, body);
        const occ = db.occupancy.find((o) => o.siteId === siteId && o.registrationNumber === plate);
        const catId = data.categoryId || (occ && occ.category && occ.category.id);
        const vt = occ && occ.vehicleType;
        if (catId && vt) adjustAvailability(db, siteId, catId, vt, 1);
    }

    // Maintain the local occupancy board on successful entry/exit.
    updateOccupancy(db, action, siteId, barrierId, outcome, result.response, body);

    save(db);

    res.json({
        logId: logEntry.id,
        signature: result.signature,
        request: logEntry.request,
        status: result.status,
        response: result.response,
        error: result.error,
        latencyMs: result.latencyMs,
        result: outcome,
    });
});

function extractReg(action, body) {
    if (!body) return null;
    if (Array.isArray(body)) return body.map((x) => x.vehicleNo).filter(Boolean).join(', ');
    if (body.vehicle && body.vehicle.registrationNumber) return body.vehicle.registrationNumber;
    return body.vehicleNo || null;
}

function updateOccupancy(db, action, siteId, barrierId, outcome, response, requestBody) {
    const data = payloadOf(response) || {};
    // The plate is most reliable from the request we just sent.
    const plate = extractReg(action, requestBody) || data.registrationNumber || data.vehicleNo || null;
    if (!plate) return;

    if (action === 'request-entry' && ['ALLOWED', 'PAYMENT_DUE', 'ALREADY_REPORTED'].includes(outcome)) {
        const existing = db.occupancy.find((o) => o.siteId === siteId && o.registrationNumber === plate);
        const row = {
            id: existing ? existing.id : crypto.randomUUID(),
            siteId,
            registrationNumber: plate,
            utilizationId: data.id || null,
            entryTime: data.entryTime || new Date().toISOString(),
            bay: data.bay || null,
            category: data.category || null,
            validTill: data.validTill || null,
            entryBarrierId: barrierId || null,
            unregistered: data.unregistered === true,
            vehicleType: (requestBody && requestBody.vehicle && requestBody.vehicle.type) || (existing && existing.vehicleType) || null,
        };
        if (existing) Object.assign(existing, row);
        else db.occupancy.push(row);
    }

    if ((action === 'request-exit' || action === 'manual-exit') && ['ALLOWED', 'ALREADY_REPORTED'].includes(outcome)) {
        db.occupancy = db.occupancy.filter((o) => !(o.siteId === siteId && o.registrationNumber === plate));
    }
}

// Overwrite a site's stored availability snapshot from a fresh category-availability response.
function setAvailability(db, siteId, categories) {
    const clean = categories.map((c) => ({ id: c.id, name: c.name, '2w': c['2w'], '4w': c['4w'] }));
    const row = db.availability.find((a) => a.siteId === siteId);
    if (row) { row.categories = clean; row.updatedAt = new Date().toISOString(); }
    else db.availability.push({ siteId, categories: clean, updatedAt: new Date().toISOString() });
}

// Adjust one category's available count for a vehicle size (delta -1 on entry, +1 on exit).
function adjustAvailability(db, siteId, categoryId, sizeKey, delta) {
    const row = db.availability.find((a) => a.siteId === siteId);
    if (!row) return; // no snapshot captured yet — nothing to adjust
    const cat = row.categories.find((c) => c.id === categoryId);
    if (!cat || !cat[sizeKey] || typeof cat[sizeKey].available !== 'number') return;
    cat[sizeKey].available += delta;
    row.updatedAt = new Date().toISOString();
}

app.get('/api/health', (req, res) => res.json({ ok: true, port: PORT }));

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Parking Partner Simulator running: http://localhost:${PORT}`);
});
