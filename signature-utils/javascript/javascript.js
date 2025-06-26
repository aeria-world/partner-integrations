const crypto = require('crypto');

/**
 * Recursively sort object keys for consistent JSON serialization
 * @param {any} obj - The object to sort
 * @returns {any} The object with sorted keys
 */
function sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }

    const sortedObj = {};
    Object.keys(obj).sort().forEach(key => {
        sortedObj[key] = sortObjectKeys(obj[key]);
    });

    return sortedObj;
}

/**
 * Generate x-signature for partner integration
 * @param {Object} body - The request body object
 * @param {string} integrationId - Unique integration identifier
 * @param {string} secretKey - Pre-shared secret key (known beforehand)
 * @returns {string} The generated signature in format: ${integrationId}.${timestamp}.${hash}
 */
function generateSignature(body, integrationId, secretKey) {
    const timestamp = Date.now();
    const sortedBody = sortObjectKeys(body ?? {});
    const jsonBody = JSON.stringify(sortedBody);
    const dataToHash = jsonBody + timestamp;
    
    const hash = crypto
        .createHmac('sha256', secretKey)
        .update(dataToHash)
        .digest('hex');
    
    return `${integrationId}.${timestamp}.${hash}`;
}

/**
 * Validate x-signature for partner integration
 * @param {string} signature - The signature to validate
 * @param {Object} body - The request body object
 * @param {Function} getSecretKey - Async callback function that takes integrationId and returns the secret key
 * @param {number} toleranceMs - Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
 * @returns {Promise<boolean>} True if signature is valid, false otherwise
 */
async function validateSignature(signature, body, getSecretKey, toleranceMs = 300000) {
    try {
        const parts = signature.split('.');
        if (parts.length !== 3) {
            return false;
        }
        
        const [sigIntegrationId, sigTimestamp, sigHash] = parts;

        // Get secret key for the integration ID from the signature (async)
        const secretKey = await getSecretKey(sigIntegrationId);
        
        // Verify timestamp is within tolerance
        const currentTime = Date.now();
        const signatureTime = parseInt(sigTimestamp, 10);
        if (Math.abs(currentTime - signatureTime) > toleranceMs) {
            return false;
        }
        
        // Generate expected hash
        const sortedBody = sortObjectKeys(body ?? {});
        const jsonBody = JSON.stringify(sortedBody);
        const dataToHash = jsonBody + sigTimestamp;
        const expectedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataToHash)
            .digest('hex');
        
        // Compare hashes using constant-time comparison to prevent timing attacks
        return crypto.timingSafeEqual(Buffer.from(sigHash), Buffer.from(expectedHash));
    } catch (error) {
        return false;
    }
}

module.exports = {
    generateSignature,
    validateSignature
};
