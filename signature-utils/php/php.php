<?php

/**
 * Recursively sort array/object keys for consistent JSON serialization
 * @param mixed $data The data to sort
 * @return mixed The data with sorted keys
 */
function sortKeys($data) {
    if (is_array($data)) {
        if (array_keys($data) === range(0, count($data) - 1)) {
            // Indexed array - sort values recursively but keep order
            return array_map('sortKeys', $data);
        } else {
            // Associative array - sort keys
            ksort($data);
            return array_map('sortKeys', $data);
        }
    }
    return $data;
}

/**
 * Generate x-signature for partner integration
 *
 * @param mixed $body The request body object
 * @param string $integrationId Unique integration identifier
 * @param string $secretKey Pre-shared secret key (known beforehand)
 * @return string The generated signature in format: ${integrationId}.${timestamp}.${hash}
 */
function generateSignature($body, $integrationId, $secretKey) {
    $timestamp = round(microtime(true) * 1000); // milliseconds
    $sortedBody = sortKeys($body ?? []);
    $jsonBody = json_encode($sortedBody, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $dataToHash = $jsonBody . $timestamp;
    
    $hash = hash_hmac('sha256', $dataToHash, $secretKey);
    
    return "{$integrationId}.{$timestamp}.{$hash}";
}

/**
 * Validate x-signature for partner integration
 *
 * @param string $signature The signature to validate
 * @param mixed $body The request body object
 * @param callable $getSecretKey Callback function that takes integrationId and returns the secret key
 *                                Note: For async operations, use ReactPHP or similar async frameworks
 * @param int $toleranceMs Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
 * @return bool True if signature is valid, false otherwise
 */
function validateSignature($signature, $body, $getSecretKey, $toleranceMs = 300000) {
    try {
        $parts = explode('.', $signature);
        if (count($parts) !== 3) {
            return false;
        }
        
        list($sigIntegrationId, $sigTimestamp, $sigHash) = $parts;

        // Get secret key for the integration ID from the signature
        $secretKey = $getSecretKey($sigIntegrationId);
        
        // Verify timestamp is within tolerance
        $currentTime = round(microtime(true) * 1000);
        $signatureTime = intval($sigTimestamp);
        if (abs($currentTime - $signatureTime) > $toleranceMs) {
            return false;
        }
        
        // Generate expected hash
        $sortedBody = sortKeys($body ?? []);
        $jsonBody = json_encode($sortedBody, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $dataToHash = $jsonBody . $sigTimestamp;
        $expectedHash = hash_hmac('sha256', $dataToHash, $secretKey);
        
        // Compare hashes using constant-time comparison to prevent timing attacks
        return hash_equals($sigHash, $expectedHash);
    } catch (Exception $e) {
        return false;
    }
}

?>
