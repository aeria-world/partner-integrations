# Signature Utilities

This folder contains signature generation and validation utilities for partner integrations across multiple programming languages.

## X-Signature Format

The x-signature is generated using the following format:
```
${integrationId}.${timestamp}.${hash}
```

Where:
- `integrationId`: Unique identifier for the integration
- `timestamp`: Current timestamp in milliseconds
- `hash`: Hash of the JSON stringified body concatenated with the timestamp

## Supported Languages

- PHP
- JavaScript
- TypeScript
- Java
- Python
- Go
- C#
- Ruby
- Rust

## Usage

Each language implementation provides:
1. `generateSignature(body, integrationId, secretKey)` - Generate x-signature
2. `validateSignature(signature, body, integrationId, secretKey, toleranceMs)` - Validate x-signature

The validation function includes timestamp tolerance to account for network delays and clock differences.

## Testing

All testing files are located in the `_test/` directory. See `_test/README.md` for detailed testing instructions.

### Quick Test
```bash
./_test/run-cross-language-tests.sh
```
