package signature

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"time"
)

// sortKeys recursively sorts map keys for consistent JSON serialization
func sortKeys(data interface{}) interface{} {
	v := reflect.ValueOf(data)
	switch v.Kind() {
	case reflect.Map:
		m := make(map[string]interface{})
		for _, key := range v.MapKeys() {
			keyStr := key.String()
			value := v.MapIndex(key).Interface()
			m[keyStr] = sortKeys(value)
		}
		return m
	case reflect.Slice, reflect.Array:
		result := make([]interface{}, v.Len())
		for i := 0; i < v.Len(); i++ {
			result[i] = sortKeys(v.Index(i).Interface())
		}
		return result
	default:
		return data
	}
}

// GenerateSignature generates x-signature for partner integration
// body: The request body object
// integrationID: Unique integration identifier
// secretKey: Pre-shared secret key
// Returns: The generated signature in format: ${integrationId}.${timestamp}.${hash}
func GenerateSignature(body interface{}, integrationID, secretKey string) (string, error) {
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)

	sortedBody := sortKeys(body ?? map[string]interface{}{})
	jsonBody, err := json.Marshal(sortedBody)
	if err != nil {
		return "", err
	}
	
	dataToHash := string(jsonBody) + strconv.FormatInt(timestamp, 10)
	
	hash := hmacSHA256(dataToHash, secretKey)
	
	return fmt.Sprintf("%s.%d.%s", integrationID, timestamp, hash), nil
}

// ValidateSignature validates x-signature for partner integration
// signature: The signature to validate
// body: The request body object
// integrationID: Unique integration identifier
// secretKey: Pre-shared secret key
// toleranceMs: Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
// Returns: True if signature is valid, false otherwise
func ValidateSignature(signature string, body interface{}, integrationID, secretKey string, toleranceMs int64) bool {
	parts := strings.Split(signature, ".")
	if len(parts) != 3 {
		return false
	}
	
	sigIntegrationID := parts[0]
	sigTimestamp := parts[1]
	sigHash := parts[2]
	
	// Verify integration ID matches
	if sigIntegrationID != integrationID {
		return false
	}
	
	// Verify timestamp is within tolerance
	currentTime := time.Now().UnixNano() / int64(time.Millisecond)
	signatureTime, err := strconv.ParseInt(sigTimestamp, 10, 64)
	if err != nil {
		return false
	}
	
	if math.Abs(float64(currentTime-signatureTime)) > float64(toleranceMs) {
		return false
	}
	
	// Generate expected hash
	sortedBody := sortKeys(body ?? map[string]interface{}{})
	jsonBody, err := json.Marshal(sortedBody)
	if err != nil {
		return false
	}
	
	dataToHash := string(jsonBody) + sigTimestamp
	expectedHash := hmacSHA256(dataToHash, secretKey)
	
	// Compare hashes
	return sigHash == expectedHash
}

// ValidateSignatureWithDefaultTolerance validates signature with default 5-minute tolerance
func ValidateSignatureWithDefaultTolerance(signature string, body interface{}, integrationID, secretKey string) bool {
	return ValidateSignature(signature, body, integrationID, secretKey, 300000)
}

func hmacSHA256(data, key string) string {
	h := hmac.New(sha256.New, []byte(key))
	h.Write([]byte(data))
	return hex.EncodeToString(h.Sum(nil))
}
