# Go Signature Utils

This folder contains the Go implementation for generating and validating x-signatures for partner integrations.

## Files

- `signature.go` - Main signature utilities package

## Dependencies

Standard library only - no external dependencies required.

## Usage

```go
package main

import (
    "fmt"
    "log"
    "./signature" // Adjust import path as needed
)

func main() {
    // Generate signature
    body := map[string]interface{}{
        "userId": "123",
        "action": "create",
    }
    
    integrationID := "partner-xyz"
    secretKey := "your-secret-key"
    
    signature, err := signature.GenerateSignature(body, integrationID, secretKey)
    if err != nil {
        log.Fatal(err)
    }
    
    // Validate signature
    isValid := signature.ValidateSignature(signature, body, integrationID, secretKey, 300000)
    fmt.Printf("Signature is valid: %v\n", isValid)
}
```

## Functions

### GenerateSignature(body interface{}, integrationID, secretKey string) (string, error)
- **body**: Request body object (will be JSON serialized with sorted keys)
- **integrationID**: Unique integration identifier
- **secretKey**: Pre-shared secret key
- **Returns**: Signature string in format `${integrationId}.${timestamp}.${hash}` and error

### ValidateSignature(signature string, body interface{}, integrationID, secretKey string, toleranceMs int64) bool
- **signature**: The signature to validate
- **body**: Request body object
- **integrationID**: Unique integration identifier
- **secretKey**: Pre-shared secret key
- **toleranceMs**: Timestamp tolerance in milliseconds
- **Returns**: Boolean indicating if signature is valid

### ValidateSignatureWithDefaultTolerance(signature string, body interface{}, integrationID, secretKey string) bool
- Convenience function with default tolerance of 5 minutes (300000ms)

### sortKeys(data interface{}) interface{}
- Helper function for recursively sorting map keys for consistent JSON serialization
