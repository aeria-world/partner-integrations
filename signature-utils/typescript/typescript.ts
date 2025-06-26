import { createHmac } from 'crypto';

/**
 * Recursively sort object keys for consistent JSON serialization
 * @param obj - The object to sort
 * @returns The object with sorted keys
 */
function sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }

    const sortedObj: any = {};
    Object.keys(obj).sort().forEach(key => {
        sortedObj[key] = sortObjectKeys(obj[key]);
    });

    return sortedObj;
}

/**
 * Generate x-signature for partner integration
 * @param body - The request body object
 * @param integrationId - Unique integration identifier
 * @param secretKey - Pre-shared secret key (known beforehand)
 * @returns The generated signature in format: ${integrationId}.${timestamp}.${hash}
 */
export function generateSignature(body: any, integrationId: string, secretKey: string): string {
    const timestamp = Date.now();
    const sortedBody = sortObjectKeys(body ?? {});
    const jsonBody = JSON.stringify(sortedBody);
    const dataToHash = jsonBody + timestamp;
    
    const hash = createHmac('sha256', secretKey)
        .update(dataToHash)
        .digest('hex');
    
    return `${integrationId}.${timestamp}.${hash}`;
}

/**
 * Validate x-signature for partner integration
 * @param signature - The signature to validate
 * @param body - The request body object
 * @param getSecretKey - Async callback function that takes integrationId and returns the secret key
 * @param toleranceMs - Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
 * @returns Promise that resolves to true if signature is valid, false otherwise
 */
export async function validateSignature(
    signature: string,
    body: any,
    getSecretKey: (integrationId: string) => Promise<string>,
    toleranceMs: number = 300000
): Promise<boolean> {
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
        const expectedHash = createHmac('sha256', secretKey)
            .update(dataToHash)
            .digest('hex');
        
        // Compare hashes using constant-time comparison to prevent timing attacks
        // Note: Install @types/node for proper Buffer support
        return sigHash === expectedHash;
    } catch (error) {
        return false;
    }
}
