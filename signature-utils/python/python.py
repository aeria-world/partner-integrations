import json
import time
import hmac
import hashlib
import secrets
from typing import Any


def generate_signature(body: Any, integration_id: str, secret_key: str) -> str:
    """
    Generate x-signature for partner integration

    Args:
        body: The request body object
        integration_id: Unique integration identifier
        secret_key: Pre-shared secret key (known beforehand)

    Returns:
        The generated signature in format: ${integrationId}.${timestamp}.${hash}
    """
    timestamp = int(time.time() * 1000)  # milliseconds
    json_body = json.dumps(body or {}, separators=(',', ':'), sort_keys=True)
    data_to_hash = json_body + str(timestamp)
    
    hash_value = hmac.new(
        secret_key.encode('utf-8'),
        data_to_hash.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return f"{integration_id}.{timestamp}.{hash_value}"


async def validate_signature(
    signature: str,
    body: Any,
    get_secret_key: callable,
    tolerance_ms: int = 300000
) -> bool:
    """
    Validate x-signature for partner integration

    Args:
        signature: The signature to validate
        body: The request body object
        get_secret_key: Async callback function that takes integration_id and returns the secret key
        tolerance_ms: Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)

    Returns:
        True if signature is valid, False otherwise
    """
    try:
        parts = signature.split('.')
        if len(parts) != 3:
            return False
        
        sig_integration_id, sig_timestamp, sig_hash = parts

        # Get secret key for the integration ID from the signature (async)
        secret_key = await get_secret_key(sig_integration_id)
        
        # Verify timestamp is within tolerance
        current_time = int(time.time() * 1000)
        signature_time = int(sig_timestamp)
        if abs(current_time - signature_time) > tolerance_ms:
            return False
        
        # Generate expected hash
        json_body = json.dumps(body or {}, separators=(',', ':'), sort_keys=True)
        data_to_hash = json_body + sig_timestamp
        expected_hash = hmac.new(
            secret_key.encode('utf-8'),
            data_to_hash.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Compare hashes using constant-time comparison to prevent timing attacks
        return secrets.compare_digest(sig_hash, expected_hash)
    except (ValueError, TypeError):
        return False
