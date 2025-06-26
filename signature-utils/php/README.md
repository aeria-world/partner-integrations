# PHP Signature Utils

This folder contains the PHP implementation for generating and validating x-signatures for partner integrations.

## Files

- `php.php` - Main signature utilities functions

## Requirements

- PHP 7.0 or higher
- Standard PHP extensions: `json`, `hash`

## Usage

```php
<?php
require_once 'php.php';

// Generate signature
$body = ["userId" => "123", "action" => "create"];
$integrationId = "partner-xyz";
$secretKey = "your-secret-key";

$signature = generateSignature($body, $integrationId, $secretKey);

// Validate signature
$isValid = validateSignature($signature, $body, $integrationId, $secretKey);
?>
```

## Functions

### generateSignature($body, $integrationId, $secretKey)
- **$body**: Request body object (will be JSON serialized with sorted keys)
- **$integrationId**: Unique integration identifier
- **$secretKey**: Pre-shared secret key
- **Returns**: Signature string in format `${integrationId}.${timestamp}.${hash}`

### validateSignature($signature, $body, $integrationId, $secretKey, $toleranceMs = 300000)
- **$signature**: The signature to validate
- **$body**: Request body object
- **$integrationId**: Unique integration identifier
- **$secretKey**: Pre-shared secret key
- **$toleranceMs**: Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
- **Returns**: Boolean indicating if signature is valid

### sortKeys($data)
- **$data**: Array or object to sort recursively
- **Returns**: Data with sorted keys (helper function for consistent JSON serialization)
