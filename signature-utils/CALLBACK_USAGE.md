# Callback-Based Secret Key Retrieval

This document explains how to use the signature utilities with callback functions for secret key retrieval.

## Overview

Instead of passing the secret key directly to the functions, you now provide a callback function that retrieves the secret key based on the integration ID. This approach offers several benefits:

1. **Security**: Secret keys are not passed around as parameters
2. **Flexibility**: Different integrations can use different secret storage mechanisms
3. **Validation**: The validation function automatically extracts the integration ID from the signature
4. **Centralized Management**: All secret key logic is centralized in the callback function

## Function Signatures

### Generate Signature
```
generateSignature(body, integrationId, getSecretKey)
```

### Validate Signature
```
validateSignature(signature, body, getSecretKey, toleranceMs?)
```

Note: The validation function no longer requires the `integrationId` parameter as it extracts it from the signature.

## Implementation Examples

### JavaScript/Node.js

```javascript
const { generateSignature, validateSignature } = require('./javascript');

// Secret key store (could be database, environment variables, etc.)
const secretKeyStore = {
    "partner-xyz": "secret-key-123",
    "partner-abc": "secret-key-456"
};

// Callback function
function getSecretKey(integrationId) {
    const secretKey = secretKeyStore[integrationId];
    if (!secretKey) {
        throw new Error(`Secret key not found for integration: ${integrationId}`);
    }
    return secretKey;
}

// Usage
const body = { userId: "123", action: "create" };
const integrationId = "partner-xyz";

const signature = generateSignature(body, integrationId, getSecretKey);
const isValid = validateSignature(signature, body, getSecretKey);
```

### Python

```python
from python import generate_signature, validate_signature

# Secret key store
secret_key_store = {
    "partner-xyz": "secret-key-123",
    "partner-abc": "secret-key-456"
}

# Callback function
def get_secret_key(integration_id):
    secret_key = secret_key_store.get(integration_id)
    if not secret_key:
        raise ValueError(f"Secret key not found for integration: {integration_id}")
    return secret_key

# Usage
body = {"userId": "123", "action": "create"}
integration_id = "partner-xyz"

signature = generate_signature(body, integration_id, get_secret_key)
is_valid = validate_signature(signature, body, get_secret_key)
```

### PHP

```php
<?php
require_once 'php.php';

// Secret key store
$secretKeyStore = [
    "partner-xyz" => "secret-key-123",
    "partner-abc" => "secret-key-456"
];

// Callback function
function getSecretKey($integrationId) use ($secretKeyStore) {
    if (!isset($secretKeyStore[$integrationId])) {
        throw new Exception("Secret key not found for integration: $integrationId");
    }
    return $secretKeyStore[$integrationId];
}

// Usage
$body = ["userId" => "123", "action" => "create"];
$integrationId = "partner-xyz";

$signature = generateSignature($body, $integrationId, 'getSecretKey');
$isValid = validateSignature($signature, $body, 'getSecretKey');
?>
```

## Advanced Secret Key Management

### Database Integration

```javascript
// Example with database lookup
async function getSecretKeyFromDB(integrationId) {
    const result = await db.query(
        'SELECT secret_key FROM integrations WHERE id = ?', 
        [integrationId]
    );
    
    if (!result.length) {
        throw new Error(`Integration not found: ${integrationId}`);
    }
    
    return result[0].secret_key;
}

// Usage with async/await
const signature = generateSignature(body, integrationId, getSecretKeyFromDB);
```

### Environment Variables

```javascript
function getSecretKeyFromEnv(integrationId) {
    const envKey = `SECRET_KEY_${integrationId.toUpperCase().replace('-', '_')}`;
    const secretKey = process.env[envKey];
    
    if (!secretKey) {
        throw new Error(`Secret key not found in environment for: ${integrationId}`);
    }
    
    return secretKey;
}
```

### Caching

```javascript
const secretKeyCache = new Map();

function getCachedSecretKey(integrationId) {
    if (secretKeyCache.has(integrationId)) {
        return secretKeyCache.get(integrationId);
    }
    
    const secretKey = fetchSecretKeyFromSecureStore(integrationId);
    secretKeyCache.set(integrationId, secretKey);
    
    return secretKey;
}
```

## Error Handling

The callback function should:
1. Return the secret key if found
2. Throw an error if the integration ID is not found
3. Handle any storage-specific errors appropriately

## Migration from Direct Secret Key Approach

### Before (Old Approach)
```javascript
const signature = generateSignature(body, integrationId, secretKey);
const isValid = validateSignature(signature, body, integrationId, secretKey);
```

### After (New Callback Approach)
```javascript
const signature = generateSignature(body, integrationId, getSecretKey);
const isValid = validateSignature(signature, body, getSecretKey);
```

## Benefits

1. **Security**: Secret keys are retrieved just-in-time and not stored in memory longer than necessary
2. **Flexibility**: Different integrations can use different storage mechanisms
3. **Validation Simplification**: No need to pass integration ID to validation function
4. **Centralized Logic**: All secret key retrieval logic is in one place
5. **Error Handling**: Consistent error handling for missing or invalid integrations
