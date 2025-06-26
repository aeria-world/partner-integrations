# Security Considerations

This document outlines the security measures implemented in the signature utilities to protect against various attacks.

## Constant-Time Comparison

### Why It Matters

Regular string comparison (`===`, `==`, `strcmp`) can be vulnerable to timing attacks. Attackers can measure the time it takes to compare strings and potentially deduce information about the expected value by analyzing timing differences.

### Implementation

All signature comparisons use constant-time comparison functions to prevent timing attacks:

#### JavaScript
```javascript
function secureCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
}

// Usage in validation
return secureCompare(sigHash, expectedHash);
```

#### Python
```python
import secrets

# Usage in validation
return secrets.compare_digest(sig_hash, expected_hash)
```

#### PHP
```php
// Usage in validation
return hash_equals($sigHash, $expectedHash);
```

## HMAC-SHA256 Security

### Algorithm Choice

- **HMAC-SHA256**: Provides strong cryptographic security
- **Key-dependent**: Requires knowledge of the secret key to generate valid signatures
- **Collision-resistant**: SHA-256 is resistant to collision attacks
- **Industry standard**: Widely used and well-tested

### Key Management Best Practices

1. **Unique Keys**: Each integration should have a unique secret key
2. **Key Rotation**: Regularly rotate secret keys
3. **Secure Storage**: Store keys in secure key management systems
4. **Access Control**: Limit access to secret keys
5. **Key Length**: Use sufficiently long random keys (minimum 32 bytes)

## Timestamp Validation

### Replay Attack Prevention

The signature includes a timestamp to prevent replay attacks:

```javascript
// Default tolerance: 5 minutes
const toleranceMs = 300000;

// Check if timestamp is within acceptable range
if (Math.abs(currentTime - signatureTime) > toleranceMs) {
    return false;
}
```

### Best Practices

1. **Short Tolerance Window**: Use the shortest acceptable time window
2. **Clock Synchronization**: Ensure server clocks are synchronized
3. **Monotonic Timestamps**: Use monotonically increasing timestamps when possible

## JSON Serialization Security

### Key Ordering

All implementations sort JSON keys before hashing to ensure consistent results:

```javascript
// Recursive key sorting
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
```

### Benefits

1. **Consistency**: Same data produces same signature across languages
2. **Deterministic**: Eliminates variations due to object property ordering
3. **Cross-platform**: Works consistently across different JSON implementations

## Input Validation

### Signature Format Validation

```javascript
// Validate signature format
const parts = signature.split('.');
if (parts.length !== 3) {
    return false;
}

const [integrationId, timestamp, hash] = parts;

// Validate each component
if (!integrationId || !timestamp || !hash) {
    return false;
}
```

### Integration ID Validation

```javascript
// Extract integration ID from signature (not from parameters)
const integrationId = parts[0];
const secretKey = await getSecretKey(integrationId);
```

## Error Handling Security

### Information Disclosure Prevention

Avoid revealing sensitive information in error messages:

```javascript
// Good: Generic error message
throw new Error('Invalid signature');

// Bad: Reveals internal details
throw new Error('Secret key not found for integration: xyz-123');
```

### Consistent Error Responses

Return consistent error responses regardless of failure reason:

```javascript
// Always return false for any validation failure
try {
    // validation logic
    return isValid;
} catch (error) {
    // Log error internally but return consistent response
    console.error('Signature validation error:', error);
    return false;
}
```

## Database Security

### Async Secret Key Retrieval

```javascript
async function getSecretKeyFromDB(integrationId) {
    try {
        // Use parameterized queries to prevent SQL injection
        const [rows] = await db.execute(
            'SELECT secret_key FROM integrations WHERE integration_id = ? AND active = 1',
            [integrationId]
        );
        
        if (rows.length === 0) {
            throw new Error('Integration not found');
        }
        
        return rows[0].secret_key;
    } catch (error) {
        // Log error but don't expose details
        console.error('Database error:', error);
        throw new Error('Secret key retrieval failed');
    }
}
```

### Best Practices

1. **Parameterized Queries**: Always use parameterized queries
2. **Connection Security**: Use encrypted database connections
3. **Access Control**: Implement proper database access controls
4. **Audit Logging**: Log all secret key access attempts

## Rate Limiting

### Validation Rate Limiting

Implement rate limiting to prevent brute force attacks:

```javascript
const rateLimit = require('express-rate-limit');

const signatureValidationLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many signature validation attempts'
});
```

## Monitoring and Alerting

### Security Events to Monitor

1. **Failed Validations**: High number of failed signature validations
2. **Unknown Integrations**: Attempts to validate signatures for unknown integration IDs
3. **Timestamp Anomalies**: Signatures with timestamps far outside normal range
4. **Rate Limit Violations**: IPs hitting rate limits frequently

### Alerting Thresholds

```javascript
// Example monitoring
if (failedValidations > 10 && timeWindow < 60000) {
    alert('Potential signature validation attack detected');
}
```

## Compliance Considerations

### Data Protection

1. **PII Handling**: Ensure request bodies don't contain unencrypted PII
2. **Audit Trails**: Maintain audit logs for signature operations
3. **Data Retention**: Implement appropriate data retention policies

### Standards Compliance

1. **OWASP**: Follow OWASP guidelines for cryptographic storage
2. **NIST**: Align with NIST cryptographic standards
3. **Industry Standards**: Follow relevant industry security standards

## Security Checklist

- [ ] Use constant-time comparison for signature validation
- [ ] Implement appropriate timestamp tolerance
- [ ] Sort JSON keys before hashing
- [ ] Use strong secret keys (minimum 32 bytes)
- [ ] Implement proper error handling
- [ ] Use parameterized database queries
- [ ] Implement rate limiting
- [ ] Monitor for security events
- [ ] Regular security audits
- [ ] Key rotation procedures
