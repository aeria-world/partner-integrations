using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace SignatureUtils
{
    public class SortedKeysContractResolver : DefaultContractResolver
    {
        protected override IList<JsonProperty> CreateProperties(Type type, MemberSerialization memberSerialization)
        {
            var properties = base.CreateProperties(type, memberSerialization);
            return properties.OrderBy(p => p.PropertyName).ToList();
        }
    }

    public static class SignatureGenerator
    {
        private static readonly JsonSerializerSettings sortedSettings = new JsonSerializerSettings
        {
            ContractResolver = new SortedKeysContractResolver(),
            Formatting = Formatting.None
        };
        /// <summary>
        /// Generate x-signature for partner integration
        /// </summary>
        /// <param name="body">The request body object</param>
        /// <param name="integrationId">Unique integration identifier</param>
        /// <param name="secretKey">Pre-shared secret key</param>
        /// <returns>The generated signature in format: ${integrationId}.${timestamp}.${hash}</returns>
        public static string GenerateSignature(object body, string integrationId, string secretKey)
        {
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var jsonBody = JsonConvert.SerializeObject(body ?? new object(), sortedSettings);
            var dataToHash = jsonBody + timestamp;
            
            var hash = ComputeHmacSha256(dataToHash, secretKey);
            
            return $"{integrationId}.{timestamp}.{hash}";
        }
        
        /// <summary>
        /// Validate x-signature for partner integration
        /// </summary>
        /// <param name="signature">The signature to validate</param>
        /// <param name="body">The request body object</param>
        /// <param name="integrationId">Unique integration identifier</param>
        /// <param name="secretKey">Pre-shared secret key</param>
        /// <param name="toleranceMs">Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)</param>
        /// <returns>True if signature is valid, false otherwise</returns>
        public static bool ValidateSignature(string signature, object body, string integrationId, 
            string secretKey, long toleranceMs = 300000)
        {
            try
            {
                var parts = signature.Split('.');
                if (parts.Length != 3)
                {
                    return false;
                }
                
                var sigIntegrationId = parts[0];
                var sigTimestamp = parts[1];
                var sigHash = parts[2];
                
                // Verify integration ID matches
                if (sigIntegrationId != integrationId)
                {
                    return false;
                }
                
                // Verify timestamp is within tolerance
                var currentTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                if (!long.TryParse(sigTimestamp, out var signatureTime))
                {
                    return false;
                }
                
                if (Math.Abs(currentTime - signatureTime) > toleranceMs)
                {
                    return false;
                }
                
                // Generate expected hash
                var jsonBody = JsonConvert.SerializeObject(body ?? new object(), sortedSettings);
                var dataToHash = jsonBody + sigTimestamp;
                var expectedHash = ComputeHmacSha256(dataToHash, secretKey);
                
                // Compare hashes
                return sigHash == expectedHash;
            }
            catch
            {
                return false;
            }
        }
        
        private static string ComputeHmacSha256(string data, string key)
        {
            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key)))
            {
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
                return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
            }
        }
    }
}
