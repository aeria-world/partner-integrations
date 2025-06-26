# TypeScript Signature Utils

This folder contains the TypeScript implementation for generating and validating x-signatures for partner integrations.

## Files

- `typescript.ts` - Main signature utilities module with TypeScript types

## Installation

```bash
npm install -g typescript
npm install @types/node
```

## Compilation

```bash
tsc typescript.ts
```

## Usage

```typescript
import { generateSignature, validateSignature } from './typescript';

// Generate signature
const body = { userId: "123", action: "create" };
const integrationId = "partner-xyz";
const secretKey = "your-secret-key";

const signature = generateSignature(body, integrationId, secretKey);

// Validate signature
const isValid = validateSignature(signature, body, integrationId, secretKey);
```

## Functions

### generateSignature(body: any, integrationId: string, secretKey: string): string
- **body**: Request body object (will be JSON serialized with sorted keys)
- **integrationId**: Unique integration identifier
- **secretKey**: Pre-shared secret key
- **Returns**: Signature string in format `${integrationId}.${timestamp}.${hash}`

### validateSignature(signature: string, body: any, integrationId: string, secretKey: string, toleranceMs?: number): boolean
- **signature**: The signature to validate
- **body**: Request body object
- **integrationId**: Unique integration identifier
- **secretKey**: Pre-shared secret key
- **toleranceMs**: Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
- **Returns**: Boolean indicating if signature is valid
