use hmac::{Hmac, Mac};
use sha2::Sha256;
use serde_json;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

/// Generate x-signature for partner integration
/// 
/// # Arguments
/// * `body` - The request body object (must be serializable to JSON)
/// * `integration_id` - Unique integration identifier
/// * `secret_key` - Pre-shared secret key
/// 
/// # Returns
/// The generated signature in format: ${integrationId}.${timestamp}.${hash}
pub fn generate_signature<T: serde::Serialize>(
    body: &T,
    integration_id: &str,
    secret_key: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_millis() as u64;
    
    let json_body = serde_json::to_string(body.unwrap_or(&serde_json::json!({})))?;
    let data_to_hash = format!("{}{}", json_body, timestamp);
    
    let mut mac = HmacSha256::new_from_slice(secret_key.as_bytes())?;
    mac.update(data_to_hash.as_bytes());
    let result = mac.finalize();
    let hash = hex::encode(result.into_bytes());
    
    Ok(format!("{}.{}.{}", integration_id, timestamp, hash))
}

/// Validate x-signature for partner integration
/// 
/// # Arguments
/// * `signature` - The signature to validate
/// * `body` - The request body object (must be serializable to JSON)
/// * `integration_id` - Unique integration identifier
/// * `secret_key` - Pre-shared secret key
/// * `tolerance_ms` - Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
/// 
/// # Returns
/// True if signature is valid, false otherwise
pub fn validate_signature<T: serde::Serialize>(
    signature: &str,
    body: &T,
    integration_id: &str,
    secret_key: &str,
    tolerance_ms: Option<u64>,
) -> bool {
    let tolerance_ms = tolerance_ms.unwrap_or(300000);
    
    let parts: Vec<&str> = signature.split('.').collect();
    if parts.len() != 3 {
        return false;
    }
    
    let sig_integration_id = parts[0];
    let sig_timestamp = parts[1];
    let sig_hash = parts[2];
    
    // Verify integration ID matches
    if sig_integration_id != integration_id {
        return false;
    }
    
    // Verify timestamp is within tolerance
    let current_time = match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_millis() as u64,
        Err(_) => return false,
    };
    
    let signature_time = match sig_timestamp.parse::<u64>() {
        Ok(time) => time,
        Err(_) => return false,
    };
    
    if (current_time as i64 - signature_time as i64).abs() as u64 > tolerance_ms {
        return false;
    }
    
    // Generate expected hash
    let json_body = match serde_json::to_string(body.unwrap_or(&serde_json::json!({}))) {
        Ok(json) => json,
        Err(_) => return false,
    };
    
    let data_to_hash = format!("{}{}", json_body, sig_timestamp);
    
    let mut mac = match HmacSha256::new_from_slice(secret_key.as_bytes()) {
        Ok(mac) => mac,
        Err(_) => return false,
    };
    
    mac.update(data_to_hash.as_bytes());
    let result = mac.finalize();
    let expected_hash = hex::encode(result.into_bytes());
    
    // Compare hashes
    sig_hash == expected_hash
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    
    #[test]
    fn test_generate_and_validate_signature() {
        let body = json!({"test": "data", "number": 123});
        let integration_id = "test-integration";
        let secret_key = "test-secret-key";
        
        let signature = generate_signature(&body, integration_id, secret_key).unwrap();
        let is_valid = validate_signature(&signature, &body, integration_id, secret_key, None);
        
        assert!(is_valid);
    }
}
