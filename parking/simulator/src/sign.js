'use strict';
const crypto = require('crypto');

/**
 * Recursively sort object keys so serialization is deterministic.
 * Mirrors ms-parking's api/src/guards/helper.ts:sortObjectKeys exactly.
 */
function sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }
    const sorted = {};
    Object.keys(obj)
        .sort()
        .forEach((key) => {
            sorted[key] = sortObjectKeys(obj[key]);
        });
    return sorted;
}

/**
 * Build the x-signature header the same way ms-parking's helper.ts does:
 *   `${integrationId}.${timestamp}.${HMAC_SHA256(secret, sortedJSON(body) + timestamp)}`
 *
 * opts.timestamp  - override the timestamp (used to forge an expired signature)
 * opts.tamper     - corrupt the hash (used to forge a bad signature)
 */
function generateSignature(body, integrationId, secretKey, opts = {}) {
    const timestamp = opts.timestamp ?? Date.now();
    const sortedBody = sortObjectKeys(body ?? {});
    const jsonBody = JSON.stringify(sortedBody);
    const dataToHash = jsonBody + timestamp;

    let hash = crypto.createHmac('sha256', secretKey || '').update(dataToHash).digest('hex');
    if (opts.tamper) {
        // Flip the last hex char so the signature is well-formed but invalid.
        const last = hash.slice(-1);
        const flipped = last === '0' ? '1' : '0';
        hash = hash.slice(0, -1) + flipped;
    }
    return `${integrationId}.${timestamp}.${hash}`;
}

module.exports = { sortObjectKeys, generateSignature };
