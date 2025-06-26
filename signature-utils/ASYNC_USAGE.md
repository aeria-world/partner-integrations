# Async Secret Key Retrieval

This document explains the updated signature utilities that support asynchronous secret key retrieval for validation.

## Overview

The signature utilities now support two different patterns:

1. **Generate Signature**: Synchronous - secret key is known beforehand
2. **Validate Signature**: Asynchronous - secret key is fetched from database/external source

This design reflects real-world usage where:
- When generating signatures, you typically already have the secret key
- When validating signatures, you need to look up the secret key based on the integration ID from the signature

## Function Signatures

### Generate Signature (Synchronous)
```
generateSignature(body, integrationId, secretKey)
```

### Validate Signature (Asynchronous)
```
await validateSignature(signature, body, getSecretKey, toleranceMs?)
```

## Implementation Examples

### JavaScript/Node.js

```javascript
const { generateSignature, validateSignature } = require('./javascript');

// Secret key store (could be database, cache, etc.)
const secretKeyStore = {
    "partner-xyz": "secret-key-123",
    "partner-abc": "secret-key-456"
};

// Async callback function for validation (simulates DB lookup)
async function getSecretKey(integrationId) {
    // Simulate database query delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const secretKey = secretKeyStore[integrationId];
    if (!secretKey) {
        throw new Error(`Secret key not found for integration: ${integrationId}`);
    }
    return secretKey;
}

// Usage
const body = { userId: "123", action: "create" };
const integrationId = "partner-xyz";
const secretKey = "secret-key-123"; // Known beforehand

// Generate signature (sync)
const signature = generateSignature(body, integrationId, secretKey);

// Validate signature (async)
const isValid = await validateSignature(signature, body, getSecretKey);
```

### Python

```python
import asyncio
from python import generate_signature, validate_signature

# Secret key store
secret_key_store = {
    "partner-xyz": "secret-key-123",
    "partner-abc": "secret-key-456"
}

# Async callback function for validation
async def get_secret_key(integration_id):
    # Simulate async database lookup
    await asyncio.sleep(0.01)
    
    secret_key = secret_key_store.get(integration_id)
    if not secret_key:
        raise ValueError(f"Secret key not found for integration: {integration_id}")
    return secret_key

# Usage
async def main():
    body = {"userId": "123", "action": "create"}
    integration_id = "partner-xyz"
    secret_key = "secret-key-123"  # Known beforehand
    
    # Generate signature (sync)
    signature = generate_signature(body, integration_id, secret_key)
    
    # Validate signature (async)
    is_valid = await validate_signature(signature, body, get_secret_key)
    print(f"Signature is valid: {is_valid}")

# Run the async function
asyncio.run(main())
```

### PHP (with ReactPHP for async)

```php
<?php
require_once 'vendor/autoload.php';
require_once 'php.php';

use React\Promise\Promise;

// Secret key store
$secretKeyStore = [
    "partner-xyz" => "secret-key-123",
    "partner-abc" => "secret-key-456"
];

// Async callback function using ReactPHP promises
function getSecretKeyAsync($integrationId) use ($secretKeyStore) {
    return new Promise(function ($resolve, $reject) use ($integrationId, $secretKeyStore) {
        // Simulate async operation
        \React\EventLoop\Loop::get()->addTimer(0.01, function() use ($integrationId, $secretKeyStore, $resolve, $reject) {
            if (!isset($secretKeyStore[$integrationId])) {
                $reject(new Exception("Secret key not found for integration: $integrationId"));
                return;
            }
            $resolve($secretKeyStore[$integrationId]);
        });
    });
}

// Usage
$body = ["userId" => "123", "action" => "create"];
$integrationId = "partner-xyz";
$secretKey = "secret-key-123"; // Known beforehand

// Generate signature (sync)
$signature = generateSignature($body, $integrationId, $secretKey);

// For validation with async secret key retrieval, you would need to adapt
// the validateSignature function to work with promises
?>
```

## Database Integration Examples

### JavaScript with Database

```javascript
const mysql = require('mysql2/promise');

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'integrations'
});

// Async secret key retrieval from database
async function getSecretKeyFromDB(integrationId) {
    try {
        const [rows] = await db.execute(
            'SELECT secret_key FROM integrations WHERE integration_id = ? AND active = 1',
            [integrationId]
        );
        
        if (rows.length === 0) {
            throw new Error(`Integration not found or inactive: ${integrationId}`);
        }
        
        return rows[0].secret_key;
    } catch (error) {
        throw new Error(`Database error: ${error.message}`);
    }
}

// Usage
const isValid = await validateSignature(signature, body, getSecretKeyFromDB);
```

### Python with Database

```python
import asyncpg
import asyncio

# Database connection
async def get_secret_key_from_db(integration_id):
    conn = await asyncpg.connect('postgresql://user:password@localhost/integrations')
    try:
        row = await conn.fetchrow(
            'SELECT secret_key FROM integrations WHERE integration_id = $1 AND active = true',
            integration_id
        )
        
        if not row:
            raise ValueError(f"Integration not found or inactive: {integration_id}")
        
        return row['secret_key']
    finally:
        await conn.close()

# Usage
is_valid = await validate_signature(signature, body, get_secret_key_from_db)
```

## Error Handling

The async callback function should handle various error scenarios:

1. **Integration not found**: Throw appropriate error
2. **Database connection issues**: Handle connection errors
3. **Invalid/expired integrations**: Check status flags
4. **Rate limiting**: Implement appropriate backoff strategies

## Performance Considerations

1. **Caching**: Cache frequently accessed secret keys
2. **Connection pooling**: Use database connection pools
3. **Timeout handling**: Set appropriate timeouts for database queries
4. **Error recovery**: Implement retry logic for transient failures

## Migration Guide

### From Sync to Async Validation

**Before:**
```javascript
const isValid = validateSignature(signature, body, integrationId, secretKey);
```

**After:**
```javascript
const isValid = await validateSignature(signature, body, getSecretKey);
```

### Key Changes

1. Validation function is now async and returns a Promise
2. Secret key is retrieved dynamically based on integration ID from signature
3. Generate function remains synchronous for better performance
4. Error handling should account for async operations
