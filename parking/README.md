# Integration Explained: External Parking Partner Integration with Aeria

This document provides guidance on integrating external parking solutions with Aeria's Tenant Experience Platform. Below is a detailed breakdown of the integration steps and corresponding API endpoints.

## One-Time Setup

### Obtain Partner Credentials:

- Aeria generates a Partner ID (PID), a Secret Key, and a Webhook Secret Key for your account. These credentials will be securely emailed to your admin upon configuration. Remember to keep them confidential as they grant access to Aeria's API.

### Set Up Webhook (Partner APIs):

- Aeria will collaborate with you to establish a set of pre-defined webhooks to ensure smooth communication between your platform and Aeria's Tenant Experience Platform. These webhooks include:

    - **Add Parking Webhook:** Notifies the partner about new parking addition. Parameters include parking ID, name, property name, city name, coordinates, and status.

    - **Update Parking Webhook:** Notifies the partner about updating parking information. Parameters include parking ID, name, and status.

    - **Add Pass Webhook:** Notifies the partner whenever a new pass in added. Parameters include pass ID, vehicle details, parking ID, entry type, entry details, fare group, etc.

    - **Revoke Pass Webhook:** Notifies the partner about revoking an existing pass. Parameters include pass ID.

    - **Set Pricing Webhook:** Notifies the partner whenever parking pricing information is updated. Parameters include parking ID and fare groups with pricing details.

    - **Set Vehicle Info Webhook:** Notifies the partner about a new vehicle or updates on an existing information. Parameters include parking ID, vehicle details, fare group, and blacklist status.

    - **Delete Vehicle Info Webhook:** Notifies the partner to delete a vehicle's information. Parameters include parking ID and vehicle number.

# Important Integration Notes

### Aeria's APIs:

- **Regenerate Credentials**: This API allows you to regenerate the Partner ID and Secret Key for your account, providing enhanced security and control over access to Aeria's services.

- **Set or Update Webhooks**: With this API, you can dynamically set or update the pre-defined webhooks configured for your account, enabling flexible integration and customization according to your platform's requirements.

- **Mark Entry of a Vehicle**
    - Partner calls this api to inform Aeria whenever a vehicle enter the parking facility.

- **Mark Exit of a Vehicle**
    - Partner calls this api to inform Aeria whenever a vehicle exits the parking facility.

### Signing Requests with Secret Key:

For enhanced security, Aeria requires you to sign every request sent to their API with your Secret Key. Here's the signing process:

1. Generate an x-signature using the following format: `${integrationId}.${timestamp}.${hash}`
   - Sort all JSON keys alphabetically before stringifying
   - Concatenate the JSON stringified body with the current timestamp in milliseconds
   - Generate an HMAC-SHA256 hash of the concatenated string using your secret key
   - Format: `integrationId.timestamp.hmacHash`
2. Include this signature in the request header with the key `x-signature`.

**Example signature generation:**
```javascript
const crypto = require('crypto');
const timestamp = Date.now();
const sortedBody = sortObjectKeys(requestBody);
const jsonBody = JSON.stringify(sortedBody);
const dataToHash = jsonBody + timestamp;
const hash = crypto.createHmac('sha256', secretKey).update(dataToHash).digest('hex');
const signature = `${integrationId}.${timestamp}.${hash}`;
```

> **Note**: Aeria follows the same signing process when calling webhooks, using the webhook secret key. Signature utilities are available in multiple programming languages in the `/signature-utils` directory.

# Conclusion

By following these steps, you can securely integrate your website with Aeria and manage parking for the properties you oversee through their Tenant Experience Platform.