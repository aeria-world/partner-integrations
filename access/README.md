# Integration Diagram Explained

This diagram outlines how Aeria integrates with your platform to manage access control for the properties Aeria manages through their Tenant Experience Platform. Here's a breakdown of the onboarding and configuration process.

## One-Time Setup

### Obtain Partner Credentials:

- Aeria onboards you as a partner and provides you with a Partner ID (PID), a Secret Key, and a Webhook Secret Key for your account. These credentials will be securely emailed to your admin upon configuration. Remember to keep them confidential as they grant access to Aeria's API.

### Set Up Webhook:

- Aeria will collaborate with you to establish a set of pre-defined webhooks to ensure smooth communication between your platform and Aeria's Tenant Experience Platform. These webhooks include:

    - **Get Doors**: A webhook that retrieves all doors configured for an integration. This endpoint is called by Aeria to get the list of doors from your system, including their reference codes, names, status, and supported authentication modes for entry and exit.
    
    - **Add or Update Time Zones**: A webhook that notifies your system whenever time zones are added or modified in Aeria's system. This ensures your platform stays synchronized with Aeria's time-based access restrictions and scheduling configurations.

    - **Get All Time Zones**: A webhook that retrieves all time zones configured for an integration. This endpoint is called by Aeria to get the list of time zones from your system, including their reference codes, names, and time zone settings. This is used to ensure your platform stays synchronized with Aeria's time-based access restrictions and scheduling configurations.

    - **Delete Time Zone**: A webhook that notifies your system whenever a time zone is deleted in Aeria's system.
    
    - **Add or Update Access Group**: A webhook that notifies your system whenever an access group is created or modified in Aeria's system. This ensures your platform stays synchronized with Aeria's access group configurations, including door assignments and time zone settings.
    
    - **Delete Access Group**: A webhook that notifies your system whenever an access group is deleted in Aeria's system.
    
    - **Add or Update User**: A webhook that notifies your system whenever a user is added or modified in Aeria's system. This ensures your platform stays synchronized with Aeria's user configurations, including their access groups and validity periods.

    - **Delete User**: A webhook that notifies your system whenever a user is deleted in Aeria's system.

    - **Add User Identification**: A webhook that notifies your system to activate a user identification like qr code, rfid, ble or nfc tag. The list of rfid cards are maintained in Aeria system, while the qr codes are dynamically generated. These are activated and pushed to your system via this webhook to be synced with allowed doors.

    - **Delete User Identification**: A webhook that notifies your system whenever a user identification is deleted in Aeria's system.

    - **Get User Identifications**: A webhook that retrieves all user identifications configured for an integration. This endpoint is called by Aeria to get the list of user identifications from your system, including their reference codes, names, and status. This is used to ensure your platform stays synchronized with Aeria's user identifications.

    - **Get Movement Logs**: A webhook that retrieves all movement logs configured for an integration. This endpoint is called by Aeria to get the list of movement logs from your system, including their timestamp, user, door, identification method, and status. This log is fetched every few minutes to provide accurate access logs to Aeria's platform.

  Aeria will collaborate with you to configure these webhooks to ensure seamless integration and efficient management of access control for the properties managed through their Tenant Experience Platform.

## Integration Management

### Register Integration:

- When Aeria onboards a property, they will identify any partners designated as access partners for that specific property via the Aeria admin dashboard.
- If you're assigned as an access partner for the property, Aeria will provide with and integration id that will be used for all communication between your system and Aeria's Tenant Experience Platform.

### Add Doors (Access Points):

- Doors are physical entities installed by partners at the properties. These Doors serve as security measures such as flag barriers, turnstiles, or similar security points. To ensure proper management and configuration, partners need to provide the list of Doors to Aeria when Aeria calls the `Get Doors Webhook` endpoint.

- Upon registration, these Doors will be visible in Aeria's dashboard, enabling property admins to use them for configuring access groups and managing access permissions effectively.

    > **Key Point:**
    >
    > Registering Doors with Aeria's API allows seamless integration between partners' physical infrastructure and Aeria's Tenant Experience Platform. This integration streamlines access control management and enhances the overall user experience for employees and visitors accessing the properties.

## Access Control

### Create Access Groups:

- Access Groups in Aeria's system serve as logical groupings of doors and time restrictions to facilitate efficient management of access to properties. They primarily focus on organizing access control settings.

- Property administrators utilize the Aeria dashboard to create access groups, defining which doors belong to each group and setting time restrictions as needed.
- Upon creation, a webhook is triggered to inform the partner platform about the new access group, ensuring synchronization between Aeria's system and the partner's platform.

### Manage Time Zones:

- Time zones in Aeria's system serve as time-based restrictions for doors, allowing property administrators to define specific time intervals during which access is permitted or restricted.

- Time zone configurations can include weekly schedules specifying access permissions for different days and times. For example, access may be allowed from Monday to Friday from 8 am to 8 pm, and on Saturdays from 9 am to 1 pm. Access can also be restricted on public holidays or other specified dates.

- Property administrators use the Aeria dashboard to configure time zones for the properties they oversee. These configurations ensure accurate tracking of access logs and event timestamps, enhancing security and operational efficiency.

- When time zone configurations are added or updated, a webhook is triggered to inform partners about the changes. This ensures that partners have the latest information for synchronization with their systems.


### Group Management:

- Property administrators have the capability to manage access groups through the Aeria dashboard. This includes adding or removing doors from access groups, assigning time zones to groups, and viewing a list of all doors within a group within a property.

- Each access group can be associated with specific time zone configurations, allowing administrators to define time-based access restrictions for the group.

- Any modifications made to access groups, such as adding or removing access points or updating time zone configurations, are communicated to the partner platform via webhook notifications. This ensures that the partner platform stays updated with the latest access group configurations, facilitating seamless integration and access control management.

## User Management:

- User Management in Aeria's system facilitates the assignment of access groups to employees or visitors for seamless access to the property.

- Whenever an employee is onboarded, the admin can configure their access groups, including any validity period associated with the assignment. The same applies when a visitor is approved to enter the property, with access groups assigned to them, each having a validity period for seamless access to specific areas.

- These access group configurations for employees and visitors are then shared with the partner platform to ensure seamless integration and synchronization of access permissions between Aeria's system and the partner platform. This enables efficient access control management and enhances the overall user experience for employees and visitors accessing the properties.

## Real-Time Access Logs

### Sending Access Logs:

- Whenever an authentication pass issued to any user is used at an access point, the corresponding log must be sent to Aeria immediately or in batches every few minutes.

- These real-time access logs provide valuable insights into user access patterns and help enhance security measures, ensuring that Aeria's system stays updated with the latest access activities for timely monitoring and analysis.

- This is an optional feature, and you can decide to send the logs at any frequency you want. If logs are sent, Aeria will retrieve the logs from your system using the `Get Movement Logs` webhook and display them in the Aeria dashboard for monitoring and analysis.

# Important Integration Notes

### Aeria's APIs:

- **Movement Logs**: This API allows you to send movement logs to Aeria's system, facilitating the expansion and customization of physical access control within the properties managed through their Tenant Experience Platform. Only the logs of known credentials are sent to Aeria's system whether the entry or exit was successful or not.

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

By following these steps, you can securely integrate your website with Aeria and manage physical access control for the properties you oversee through their Tenant Experience Platform.

