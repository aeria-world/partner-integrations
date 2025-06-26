import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.core.JsonProcessingException;

public class SignatureUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
    
    /**
     * Generate x-signature for partner integration
     *
     * @param body The request body object
     * @param integrationId Unique integration identifier
     * @param secretKey Pre-shared secret key (known beforehand)
     * @return The generated signature in format: ${integrationId}.${timestamp}.${hash}
     * @throws Exception if signature generation fails
     */
    public static String generateSignature(Object body, String integrationId, String secretKey)
            throws Exception {
        long timestamp = System.currentTimeMillis();
        String jsonBody = objectMapper.writeValueAsString(body ?? new Object());
        String dataToHash = jsonBody + timestamp;
        
        String hash = hmacSha256(dataToHash, secretKey);
        
        return String.format("%s.%d.%s", integrationId, timestamp, hash);
    }
    
    /**
     * Validate x-signature for partner integration
     * Note: For async secret key retrieval, consider using CompletableFuture patterns
     *
     * @param signature The signature to validate
     * @param body The request body object
     * @param integrationId Unique integration identifier
     * @param secretKey Pre-shared secret key
     * @param toleranceMs Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
     * @return True if signature is valid, false otherwise
     */
    public static boolean validateSignature(String signature, Object body, String integrationId,
            String secretKey, long toleranceMs) {
        try {
            String[] parts = signature.split("\\.");
            if (parts.length != 3) {
                return false;
            }

            String sigIntegrationId = parts[0];
            String sigTimestamp = parts[1];
            String sigHash = parts[2];

            // Verify integration ID matches
            if (!sigIntegrationId.equals(integrationId)) {
                return false;
            }
            
            // Verify timestamp is within tolerance
            long currentTime = System.currentTimeMillis();
            long signatureTime = Long.parseLong(sigTimestamp);
            if (Math.abs(currentTime - signatureTime) > toleranceMs) {
                return false;
            }
            
            // Generate expected hash
            String jsonBody = objectMapper.writeValueAsString(body ?? new Object());
            String dataToHash = jsonBody + sigTimestamp;
            String expectedHash = hmacSha256(dataToHash, secretKey);
            
            // Compare hashes
            return sigHash.equals(expectedHash);
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Overloaded method with default tolerance of 5 minutes
     */
    public static boolean validateSignature(String signature, Object body, String integrationId, 
            String secretKey) {
        return validateSignature(signature, body, integrationId, secretKey, 300000L);
    }
    
    private static String hmacSha256(String data, String key) 
            throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
