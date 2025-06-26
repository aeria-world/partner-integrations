# JavaScript Signature Utils

This folder contains the JavaScript implementation for generating and validating x-signatures for partner integrations.

## Files

- `javascript.js` - Main signature utilities module
- `package.json` - Node.js package configuration
- `test_example.js` - Example usage and testing

## Installation

```bash
npm install
```

## Usage

```javascript
const { generateSignature, validateSignature } = require('./javascript');

// Generate signature
const body = { userId: "123", action: "create" };
const integrationId = "partner-xyz";
const secretKey = "your-secret-key";

const signature = generateSignature(body, integrationId, secretKey);

// Validate signature
const isValid = validateSignature(signature, body, integrationId, secretKey);
```

## Functions

### generateSignature(body, integrationId, secretKey)
- **body**: Request body object (will be JSON serialized with sorted keys)
- **integrationId**: Unique integration identifier
- **secretKey**: Pre-shared secret key
- **Returns**: Signature string in format `${integrationId}.${timestamp}.${hash}`

### validateSignature(signature, body, integrationId, secretKey, toleranceMs)
- **signature**: The signature to validate
- **body**: Request body object
- **integrationId**: Unique integration identifier
- **secretKey**: Pre-shared secret key
- **toleranceMs**: Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
- **Returns**: Boolean indicating if signature is valid
