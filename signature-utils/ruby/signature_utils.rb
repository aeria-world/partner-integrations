require 'openssl'
require 'json'

module SignatureUtils
  # Recursively sort hash keys for consistent JSON serialization
  # @param data [Object] The data to sort
  # @return [Object] The data with sorted keys
  def self.sort_keys(data)
    case data
    when Hash
      sorted_hash = {}
      data.keys.sort.each do |key|
        sorted_hash[key] = sort_keys(data[key])
      end
      sorted_hash
    when Array
      data.map { |item| sort_keys(item) }
    else
      data
    end
  end
  # Generate x-signature for partner integration
  # @param body [Object] The request body object
  # @param integration_id [String] Unique integration identifier
  # @param secret_key [String] Pre-shared secret key
  # @return [String] The generated signature in format: ${integrationId}.${timestamp}.${hash}
  def self.generate_signature(body, integration_id, secret_key)
    timestamp = (Time.now.to_f * 1000).to_i
    sorted_body = sort_keys(body || {})
    json_body = JSON.generate(sorted_body)
    data_to_hash = json_body + timestamp.to_s
    
    hash = OpenSSL::HMAC.hexdigest('SHA256', secret_key, data_to_hash)
    
    "#{integration_id}.#{timestamp}.#{hash}"
  end
  
  # Validate x-signature for partner integration
  # @param signature [String] The signature to validate
  # @param body [Object] The request body object
  # @param integration_id [String] Unique integration identifier
  # @param secret_key [String] Pre-shared secret key
  # @param tolerance_ms [Integer] Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
  # @return [Boolean] True if signature is valid, false otherwise
  def self.validate_signature(signature, body, integration_id, secret_key, tolerance_ms = 300000)
    parts = signature.split('.')
    return false unless parts.length == 3
    
    sig_integration_id, sig_timestamp, sig_hash = parts
    
    # Verify integration ID matches
    return false unless sig_integration_id == integration_id
    
    # Verify timestamp is within tolerance
    current_time = (Time.now.to_f * 1000).to_i
    signature_time = sig_timestamp.to_i
    return false if (current_time - signature_time).abs > tolerance_ms
    
    # Generate expected hash
    sorted_body = sort_keys(body || {})
    json_body = JSON.generate(sorted_body)
    data_to_hash = json_body + sig_timestamp
    expected_hash = OpenSSL::HMAC.hexdigest('SHA256', secret_key, data_to_hash)
    
    # Compare hashes
    sig_hash == expected_hash
  rescue StandardError
    false
  end
end
