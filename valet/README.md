# Integration Explained: External Valet Partner Integration with Aeria

This document provides guidance on integrating external valet solutions with Aeria's Tenant Experience Platform. Below is a detailed breakdown of the integration steps and corresponding API endpoints.

## One-Time Setup

### Obtain Partner Credentials:

- Aeria generates a Partner ID (PID), a Secret Key, and a Webhook Secret Key for your account. These credentials will be securely emailed to your admin upon configuration. Remember to keep them confidential as they grant access to Aeria's API.

### Set Up Webhook (Partner APIs):

- Aeria will collaborate with you to establish a set of pre-defined webhooks to ensure smooth communication between your platform and Aeria's Tenant Experience Platform. These webhooks include:

    - **Update Service Webhook:** Notifies the partner about service status updates. Parameters include service ID, status, and pending amount.

    - **Get Status Webhook:** Allows Aeria to retrieve the current status of a valet service. Parameters include service ID.

    - **Retrieve Vehicle Webhook:** Notifies the partner to retrieve a vehicle. Parameters include service ID, valet point ID, and payment status.

## Valet Operations

### Request Vehicle Entry:

- When a vehicle arrives for valet service, the partner calls this API to inform Aeria about the new service request.
- Aeria validates the request and returns a service ID along with payment status information.

### Request Vehicle Exit:

- When a vehicle is ready to exit, the partner calls this API to inform Aeria.
- Aeria calculates any pending amount and returns this information to the partner.

### Get Service Details:

- Partners can retrieve detailed information about a specific valet service using this API.
- Information includes service status, payment details, vehicle information, and timestamps.

### Update Service Status:

- Partners can update the status of a valet service using this API.
- Status updates help track the vehicle's journey through the valet process.

## Important Integration Notes

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

## Service Status Flow

The typical flow of a valet service includes these statuses:
- **REQUESTED**: Initial state when vehicle entry is requested
- **COLLECTED**: Vehicle has been collected by valet
- **PARKED**: Vehicle has been parked
- **RETRIEVING**: Vehicle is being retrieved
- **HANDED_OVER**: Vehicle has been handed over to the customer
- **COMPLETED**: Service is complete

# Conclusion

By following these steps, you can securely integrate your valet service with Aeria and manage valet operations for the properties you oversee through their Tenant Experience Platform.