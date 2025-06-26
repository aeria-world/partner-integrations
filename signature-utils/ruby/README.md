# Ruby Signature Utils

This folder contains the Ruby implementation for generating and validating x-signatures for partner integrations.

## Files

- `signature_utils.rb` - Main signature utilities module

## Requirements

- Ruby 2.5 or higher
- Standard library gems: `openssl`, `json`

## Usage

```ruby
require_relative 'signature_utils'

# Generate signature
body = { "userId" => "123", "action" => "create" }
integration_id = "partner-xyz"
secret_key = "your-secret-key"

signature = SignatureUtils.generate_signature(body, integration_id, secret_key)

# Validate signature
is_valid = SignatureUtils.validate_signature(signature, body, integration_id, secret_key)
puts "Signature is valid: #{is_valid}"
```

## Methods

### SignatureUtils.generate_signature(body, integration_id, secret_key)
- **body**: Request body object (will be JSON serialized with sorted keys)
- **integration_id**: Unique integration identifier
- **secret_key**: Pre-shared secret key
- **Returns**: Signature string in format `${integrationId}.${timestamp}.${hash}`

### SignatureUtils.validate_signature(signature, body, integration_id, secret_key, tolerance_ms = 300000)
- **signature**: The signature to validate
- **body**: Request body object
- **integration_id**: Unique integration identifier
- **secret_key**: Pre-shared secret key
- **tolerance_ms**: Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
- **Returns**: Boolean indicating if signature is valid

### SignatureUtils.sort_keys(data)
- **data**: Hash or array to sort recursively
- **Returns**: Data with sorted keys (helper method for consistent JSON serialization)

## Installation

No external gems required. Uses Ruby standard library:

```ruby
require 'openssl'
require 'json'
```
