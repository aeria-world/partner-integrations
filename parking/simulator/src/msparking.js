'use strict';
const { generateSignature } = require('./sign');

// The five Phase-1 partner APIs, keyed by the action the UI sends.
const ACTIONS = {
    'category-availability': { method: 'GET', path: '/partner/v1/parking/category-availabilty', hasBody: false },
    'request-entry': { method: 'POST', path: '/partner/v1/parking/request-entry', hasBody: true },
    'request-exit': { method: 'POST', path: '/partner/v1/parking/request-exit', hasBody: true },
    'movement-logs': { method: 'POST', path: '/partner/v1/parking/movement-logs', hasBody: true },
    'manual-exit': { method: 'POST', path: '/partner/v1/parking/manual-exit', hasBody: true },
};

/**
 * Sign and send one partner-API call to ms-parking.
 * `overrides.signatureMode` = 'bad' | 'expired' forges an invalid signature (FR-9).
 * Returns a plain object describing the full request + response (for the log).
 */
async function callMsParking({ baseUrl, integrationId, secretKey, action, body, overrides = {} }) {
    const spec = ACTIONS[action];
    if (!spec) throw new Error('Unknown action: ' + action);

    const signOpts = {};
    if (overrides.signatureMode === 'expired') signOpts.timestamp = Date.now() - 6 * 60 * 1000;
    if (overrides.signatureMode === 'bad') signOpts.tamper = true;

    // GET signs an empty body ({}), matching ms-parking's helper.ts (body ?? {}).
    const bodyToSign = spec.hasBody ? body : null;
    const signature = generateSignature(bodyToSign, integrationId, secretKey, signOpts);

    const url = String(baseUrl || '').replace(/\/$/, '') + spec.path;
    const headers = { 'x-signature': signature };
    if (spec.hasBody) headers['Content-Type'] = 'application/json';

    const started = Date.now();
    let status = null;
    let response = null;
    let error = null;
    try {
        const res = await fetch(url, {
            method: spec.method,
            headers,
            body: spec.hasBody ? JSON.stringify(body) : undefined,
        });
        status = res.status;
        const text = await res.text();
        try {
            response = text ? JSON.parse(text) : null;
        } catch {
            response = text;
        }
    } catch (e) {
        error = e.message || String(e);
    }
    const latencyMs = Date.now() - started;

    return {
        request: { method: spec.method, url, headers, body: spec.hasBody ? body : null },
        signature,
        status,
        response,
        error,
        latencyMs,
    };
}

/**
 * Extract the real payload from ms-parking's response envelope.
 * Success shape: { statusCode, response: { message, code, data: <payload> } }
 * (also tolerates a bare { data } or a raw value).
 */
function payloadOf(body) {
    if (body && typeof body === 'object') {
        if (body.response && body.response.data !== undefined) return body.response.data;
        if (body.data !== undefined) return body.data;
    }
    return body;
}

/** Classify a call outcome into a label the driver display / log can use. */
function classifyResult(action, status, response, error) {
    if (error) return 'NETWORK_ERROR';
    if (status === 208) return 'ALREADY_REPORTED';
    if (status >= 400 || status === null) return 'DENIED';
    const d = payloadOf(response) || {};
    // Money outstanding must keep the barrier down: entry uses pendingCollectionAmount, exit uses amountToPay.
    const due = (typeof d.pendingCollectionAmount === 'number' ? d.pendingCollectionAmount : 0)
        || (typeof d.amountToPay === 'number' ? d.amountToPay : 0);
    if ((action === 'request-entry' || action === 'request-exit') && due > 0) {
        return 'PAYMENT_DUE';
    }
    return 'ALLOWED';
}

module.exports = { callMsParking, classifyResult, payloadOf, ACTIONS };
