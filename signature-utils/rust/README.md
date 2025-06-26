# Rust Signature Utils

This folder contains the Rust implementation for generating and validating x-signatures for partner integrations.

## Files

- `signature_utils.rs` - Main signature utilities library
- `Cargo.toml` - Rust package configuration and dependencies

## Dependencies

Add to your `Cargo.toml`:

```toml
[dependencies]
hmac = "0.12"
sha2 = "0.10"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
hex = "0.4"
```

## Build

```bash
cargo build
```

## Usage

```rust
use serde_json::json;
mod signature_utils;

fn main() {
    // Generate signature
    let body = json!({
        "userId": "123",
        "action": "create"
    });
    
    let integration_id = "partner-xyz";
    let secret_key = "your-secret-key";
    
    match signature_utils::generate_signature(&body, integration_id, secret_key) {
        Ok(signature) => {
            println!("Generated signature: {}", signature);
            
            // Validate signature
            let is_valid = signature_utils::validate_signature(
                &signature, 
                &body, 
                integration_id, 
                secret_key, 
                None
            );
            println!("Signature is valid: {}", is_valid);
        }
        Err(e) => eprintln!("Error generating signature: {}", e),
    }
}
```

## Functions

### generate_signature<T: serde::Serialize>(body: &T, integration_id: &str, secret_key: &str) -> Result<String, Box<dyn std::error::Error>>
- **body**: Request body object (must implement Serialize trait)
- **integration_id**: Unique integration identifier
- **secret_key**: Pre-shared secret key
- **Returns**: Result containing signature string in format `${integrationId}.${timestamp}.${hash}` or error

### validate_signature<T: serde::Serialize>(signature: &str, body: &T, integration_id: &str, secret_key: &str, tolerance_ms: Option<u64>) -> bool
- **signature**: The signature to validate
- **body**: Request body object (must implement Serialize trait)
- **integration_id**: Unique integration identifier
- **secret_key**: Pre-shared secret key
- **tolerance_ms**: Optional timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
- **Returns**: Boolean indicating if signature is valid

## Testing

Run the included tests:

```bash
cargo test
```
