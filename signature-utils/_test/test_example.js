const { generateSignature, validateSignature } = require('../javascript/javascript');

// Example usage with callback function for secret key retrieval
const testBody = {
    userId: "12345",
    action: "create_booking",
    data: {
        location: "parking_lot_a",
        duration: 120
    }
};

const integrationId = "partner-xyz";

// Secret key store (in real implementation, this would be a database or secure store)
const secretKeyStore = {
    "partner-xyz": "super-secret-key-12345",
    "partner-abc": "another-secret-key-67890",
    "test-integration": "test-secret-key"
};

// Async callback function to get secret key by integration ID (simulates DB lookup)
async function getSecretKey(integrationId) {
    // Simulate async database lookup
    await new Promise(resolve => setTimeout(resolve, 10));

    const secretKey = secretKeyStore[integrationId];
    if (!secretKey) {
        throw new Error(`Secret key not found for integration: ${integrationId}`);
    }
    return secretKey;
}

// Generate signature (sync - secret key is known beforehand)
const secretKey = secretKeyStore[integrationId];
const signature = generateSignature(testBody, integrationId, secretKey);
console.log("Generated signature:", signature);

// Validate signature (async - fetches secret key from "database")
async function runValidation() {
    const isValid = await validateSignature(signature, testBody, getSecretKey);
    console.log("Signature is valid:", isValid);

    // Test with modified body
    const modifiedBody = { ...testBody, userId: "54321" };
    const isInvalidBody = await validateSignature(signature, modifiedBody, getSecretKey);
    console.log("Signature with modified body is valid:", isInvalidBody);

    // Test with signature from unknown integration
    const unknownSignature = "unknown-integration.1703097600000.abcdef123456";
    try {
        const isUnknownValid = await validateSignature(unknownSignature, testBody, getSecretKey);
        console.log("Unknown integration signature is valid:", isUnknownValid);
    } catch (error) {
        console.log("Expected error for unknown integration:", error.message);
    }
}

runValidation().catch(console.error);


