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

1. Include your Integration ID in the request header with the key `x-integration-id`. This helps Aeria identify your account.
2. Deep sort the params and body data alphabetically.
3. Generate a hash of the JSON stringified data of the format `{params: {[key: string]: string}, body: {[key: string]: any}}` using the bcrypt hashing algorithm.
4. Encrypt the hash using the Crypto.AES encryption algorithm with secret key.
5. Include this encrypted hash in the request header with the key `x-signature`.

> **Note**: Aeria follows the same signing request steps when calling any webhook with the webhook secret key, ensuring secure communication between systems.

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