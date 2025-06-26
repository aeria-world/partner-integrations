# Python Signature Utils

This folder contains the Python implementation for generating and validating x-signatures for partner integrations.

## Files

- `python.py` - Main signature utilities module
- `requirements.txt` - Python dependencies (uses only standard library)

## Installation

No external dependencies required. Uses Python standard library modules:
- `json`, `time`, `hmac`, `hashlib`, `typing`

## Usage

```python
from python import generate_signature, validate_signature

# Generate signature
body = {"userId": "123", "action": "create"}
integration_id = "partner-xyz"
secret_key = "your-secret-key"

signature = generate_signature(body, integration_id, secret_key)

# Validate signature
is_valid = validate_signature(signature, body, integration_id, secret_key)
```

## Functions

### generate_signature(body: Any, integration_id: str, secret_key: str) -> str
- **body**: Request body object (will be JSON serialized with sorted keys)
- **integration_id**: Unique integration identifier
- **secret_key**: Pre-shared secret key
- **Returns**: Signature string in format `${integrationId}.${timestamp}.${hash}`

### validate_signature(signature: str, body: Any, integration_id: str, secret_key: str, tolerance_ms: int = 300000) -> bool
- **signature**: The signature to validate
- **body**: Request body object
- **integration_id**: Unique integration identifier
- **secret_key**: Pre-shared secret key
- **tolerance_ms**: Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
- **Returns**: Boolean indicating if signature is valid
