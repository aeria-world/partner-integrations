# Integration Explained: External Carpooling Partner Integration with Aeria

This document provides guidance on integrating external carpooling solutions with Aeria's Tenant Experience Platform through a Progressive Web App (PWA) integration. This integration enables verified corporate employees to access carpooling services directly from their tenant app.

## Integration Model

The integration uses a **Progressive Web App (PWA)** approach with JWT-based authentication, providing:
- Seamless single sign-on experience without repeated logins
- Minimal API exposure while maintaining partner control over core features
- Simplified partnership onboarding
- Enhanced user experience with real-time notifications
- Privacy-first data sharing approach

## One-Time Setup

### Obtain Partner Credentials

Aeria will provide the following credentials for your integration:
- **Partner ID (PID)**: Unique identifier for your integration
- **Secret Key**: For signing API requests to Aeria
- **JWT Public Key**: For validating JWT tokens sent by Aeria (Aeria holds the private key to sign tokens)

These credentials will be securely shared with your admin upon configuration. Keep them confidential as they grant access to Aeria's API.

### PWA Configuration

Partners should configure their PWA to:
- Accept and validate JWT tokens from Aeria using the provided JWT public key
- Implement the JavaScript Bridge (optional) for enhanced communication
- Handle deep linking from Aeria's tenant app
- Support event callbacks to Aeria's backend

### Tenant Onboarding

For each corporate tenant:
- Tenant admin onboarding is performed by Aeria
- Only pre-verified users can access the carpooling service
- Company name is shared as the primary identifier (no personal emails/phone numbers without explicit user consent)

## Authentication Flow

### JWT-Based Single Sign-On

1. **User Login**: User logs into Aeria's tenant app with their verified work email
2. **JWT Generation**: Aeria generates and signs a JWT token using the private key
3. **PWA Launch**: Aeria launches partner's PWA with the JWT token
4. **Token Validation**: Partner validates the JWT using the provided public key
5. **Session Creation**: Partner creates/updates user session based on validated token
6. **Seamless Access**: User accesses carpooling features without additional login

### JWT Token Structure

```json
{
  "payload": {
    "userId": "user-uuid-1234",
    "userName": "1234567890",
    "organisation": {
      "id": "org-uuid-5678",
      "name": "Company Name"
    }
  },
  "sub": "user-uuid-1234",
  "iat": 1699876543,
  "exp": 1699880143
}
```

**Note**: The `userName` field contains UPIN digits for user identification.

### JWT Token Validation

Partners must validate the JWT token using the provided public key:

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Load the public key provided by Aeria
const publicKey = fs.readFileSync('aeria-public-key.pem');

// Validate the token
try {
  const decoded = jwt.verify(token, publicKey, {
    algorithms: ['RS256']
  });

  // Access user information
  const userId = decoded.payload.userId;
  const userName = decoded.payload.userName;
  const organisation = decoded.payload.organisation;

  // Create/update user session
  // ...
} catch (error) {
  // Invalid token
  console.error('JWT validation failed:', error.message);
}
```

## Communication Options

### Option 1: Basic JWT Authentication (Minimal Integration)

- JWT token passed during PWA launch
- Token refresh handled through PWA reload
- Suitable for initial rollout and testing

### Option 2: JavaScript Bridge (Enhanced Integration)

For richer user experience, partners can implement a JavaScript Bridge enabling:
- Real-time communication between PWA and native app
- Trigger events on Aeria backend
- Deep linking and navigation
- User preference synchronization

**Example JS Bridge Interface:**
```javascript
window.AeriaBridge = {
  // Trigger event on Aeria backend
  onEvent: function(eventName, payload) {
    // eventName: string identifier for the event (e.g., 'ride-booked', 'ride-cancelled')
    // payload: object with event-specific data
  },

  // Get current user context
  getUserContext: function() { },

  // Navigate to specific app section
  navigate: function(route) { }
};
```

**Example Event Call:**
```javascript
// Trigger event (notifications sent based on backend configuration)
window.AeriaBridge.onEvent('ride-booked', {
  rideId: 'ride-123',
  pickupTime: '2024-11-15T08:30:00Z',
  driverId: 'driver-456'
});
```

## Event System

### Backend Event Endpoint

Aeria provides a backend event endpoint that partners can use to trigger various events:

**Partner → Aeria Event Flow:**
1. Partner triggers an event (e.g., ride-booked, ride-cancelled)
2. Partner calls Aeria's event API with event name and event data
3. Aeria processes the event based on configured triggers (notifications, analytics, etc.)

**API Endpoint:**
```
POST /partner/v1/carpooling/events
```

**Request Body:**
```json
{
  "userId": "user-uuid-1234",
  "eventName": "ride-booked",
  "payload": {
    "rideId": "ride-123",
    "pickupTime": "2024-11-15T08:30:00Z",
    "driverId": "driver-456"
  }
}
```

**Supported Events:**
- `ride-booked`: Ride has been booked/matched
- `ride-cancelled`: Ride has been cancelled
- `ride-started`: Ride has started
- `ride-completed`: Ride has been completed
- Additional events can be configured as needed

**Note**: Notifications are automatically sent to users based on configured triggers for each event type.

## Data Privacy & Security

### Privacy-First Approach

- **Minimal Data Sharing**: Only company name shared as primary identifier
- **No PII by Default**: Work emails and phone numbers excluded unless user consents
- **Tenant Admin Control**: Only pre-verified users can access the service
- **NDA Protection**: Data sharing governed by NDAs with tenants

### Security Measures

All API requests must be signed using x-signature:

1. Generate signature: `${integrationId}.${timestamp}.${hash}`
   - Sort all JSON keys alphabetically before stringifying
   - Concatenate JSON body with current timestamp (milliseconds)
   - Generate HMAC-SHA256 hash using secret key
2. Include signature in `x-signature` header

**Example:**
```javascript
const crypto = require('crypto');
const timestamp = Date.now();
const sortedBody = sortObjectKeys(requestBody);
const jsonBody = JSON.stringify(sortedBody);
const dataToHash = jsonBody + timestamp;
const hash = crypto.createHmac('sha256', secretKey).update(dataToHash).digest('hex');
const signature = `${integrationId}.${timestamp}.${hash}`;
```

> **Note**: Signature utilities are available in multiple programming languages in the `/signature-utils` directory.

## Integration Endpoints

### Aeria's APIs (Called by Partner)

- **Event Endpoint**: Trigger events on Aeria backend (notifications sent based on configured triggers)
- **Get User Context**: Retrieve user information (with privacy controls)
- **Report Analytics**: Share usage metrics for partnership insights

## Conclusion

By following these steps, you can securely integrate your carpooling service with Aeria and provide verified corporate employees with seamless access to carpooling features through their Tenant Experience Platform.

