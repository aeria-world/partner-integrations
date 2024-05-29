# Integration Diagram Explained

This diagram outlines how Aeria integrates with your platform to manage access control for the properties Aeria manages through their Tenant Experience Platform. Here's a breakdown of the onboarding and configuration process.

## One-Time Setup

### Obtain Partner Credentials:

- Aeria generates a Partner ID (PID), a Secret Key, and a Webhook Secret Key for your account. These credentials will be securely emailed to your admin upon configuration. Remember to keep them confidential as they grant access to Aeria's API.

### Set Up Webhook:

- Aeria will collaborate with you to establish a set of pre-defined webhooks to ensure smooth communication between your platform and Aeria's Tenant Experience Platform. These webhooks include:

    - **Add a Property**: A notification will be sent whenever Aeria adds a new property to their platform. If you're assigned as an access partner for the property via the Aeria admin dashboard, the property ID, name, and other relevant details will be shared with you through the webhook notification.
    
    - **Add an Access Group**: You'll receive a webhook notification whenever a new access group is created, enabling Aeria to manage access permissions effectively.
    
    - **Add Time Zones**: Aeria requires updates on time zone changes for accurate access log tracking. Whenever a new time zone is added or modified, a webhook notification will be triggered.
    
    - **Modify Access Group**: This webhook notifies your system when there's a change in access group configuration, such as adding or removing access points or adjusting time zone settings within the group.
    
    - **Add Employee to Access Group**: Whenever an employee is added to or removed from an access group, a webhook notification will be sent. This ensures that access permissions are promptly updated for each employee, who may belong to multiple access groups.

  Aeria's collaboration with you to configure these webhooks ensures seamless integration and efficient management of access control for the properties managed through their Tenant Experience Platform.

## Property Management

### Register Property:

- When Aeria onboards a property, they will identify any partners designated as access partners for that specific property via the Aeria admin dashboard.
- If you're assigned as an access partner for the property, Aeria will trigger a webhook notification to your system, informing you about the addition of the new property. This notification will include the property ID, name, and potentially other relevant details about the property.
- Upon receiving this webhook notification, your system can automatically synchronize the new property information, ensuring seamless integration with Aeria's Tenant Experience Platform. This enables efficient management of access control and enhances the overall user experience.

### Add Access Point:

- Access Points are physical entities installed by partners at the properties. These Access Points serve as security measures such as flag barriers, turnstiles, or similar security points. To ensure proper management and configuration, partners need to call Aeria's API to register these Access Points with Aeria's system.

- Upon registration, these Access Points will be visible in Aeria's dashboard, enabling property admins to use them for configuring access groups and managing access permissions effectively.

    > **Key Point:**
    >
    > Registering Access Points with Aeria's API allows seamless integration between partners' physical infrastructure and Aeria's Tenant Experience Platform. This integration streamlines access control management and enhances the overall user experience for employees and visitors accessing the properties.


## Access Control

### Create Access Groups:

- Access Groups in Aeria's system serve as logical groupings of access points and time restrictions to facilitate efficient management of access to properties. They primarily focus on organizing access control settings.

- Property administrators utilize the Aeria dashboard to create access groups, defining which access points belong to each group and setting time restrictions as needed.
- Upon creation, a webhook is triggered to inform the partner platform about the new access group, ensuring synchronization between Aeria's system and the partner's platform.

### Manage Time Zones:

- Time zones in Aeria's system serve as time-based restrictions for access points, allowing property administrators to define specific time intervals during which access is permitted or restricted.

- Time zone configurations can include weekly schedules specifying access permissions for different days and times. For example, access may be allowed from Monday to Friday from 8 am to 8 pm, and on Saturdays from 9 am to 1 pm. Access can also be restricted on public holidays or other specified dates.

- Property administrators use the Aeria dashboard to configure time zones for the properties they oversee. These configurations ensure accurate tracking of access logs and event timestamps, enhancing security and operational efficiency.

- When time zone configurations are added or updated, a webhook is triggered to inform partners about the changes. This ensures that partners have the latest information for synchronization with their systems.


### Group Management:

- Property administrators have the capability to manage access groups through the Aeria dashboard. This includes adding or removing access points from access groups, assigning time zones to groups, and viewing a list of all access points within a group within a property.

- Each access group can be associated with specific time zone configurations, allowing administrators to define time-based access restrictions for the group.

- Any modifications made to access groups, such as adding or removing access points or updating time zone configurations, are communicated to the partner platform via webhook notifications. This ensures that the partner platform stays updated with the latest access group configurations, facilitating seamless integration and access control management.

## User Access Management:

- User Access Management in Aeria's system facilitates the assignment of access groups to employees or visitors for seamless access to the property.

- Whenever an employee is onboarded, the admin can configure their access groups, including any validity period associated with the assignment. The same applies when a visitor is approved to enter the property, with access groups assigned to them, each having a validity period for seamless access to specific areas.

- These access group configurations for employees and visitors are then shared with the partner platform to ensure seamless integration and synchronization of access permissions between Aeria's system and the partner platform. This enables efficient access control management and enhances the overall user experience for employees and visitors accessing the properties.

## Real-Time Access Logs

### Sending Access Logs:

- Whenever an authentication pass issued to any user is used at an access point, the corresponding log must be sent to Aeria immediately.

- These real-time access logs provide valuable insights into user access patterns and help enhance security measures, ensuring that Aeria's system stays updated with the latest access activities for timely monitoring and analysis.

# Important Integration Notes

### Aeria's APIs:

- **Regenerate Credentials**: This API allows you to regenerate the Partner ID and Secret Key for your account, providing enhanced security and control over access to Aeria's services.

- **Set or Update Webhooks**: With this API, you can dynamically set or update the pre-defined webhooks configured for your account, enabling flexible integration and customization according to your platform's requirements.

- **Add an Access Point**: This API enables you to add new access points to Aeria's system, facilitating the expansion and customization of physical access control within the properties managed through their Tenant Experience Platform.

- **Log Employee or Visitor Movement through Access Point**: This API allows you to log and track the movement of employees or visitors through access points in real-time, providing valuable insights into access patterns and enhancing security measures.

### Signing Requests with Secret Key:

For enhanced security, Aeria requires you to sign every request sent to their API with your Datapath Secret Key. Here's the signing process:

1. Include your Partner ID (PID) in the request header with the key `x-partner-code`. This helps Aeria identify your account.
2. Deep sort the params and body data alphabetically.
3. Sign the JSON stringified data of the format `{params: {[key: string]: string}, body: {[key: string]: any}}` using the AES256 encryption algorithm with secret key.
4. Generate a hash of the signed data using the bcrypt hashing algorithm.
5. Include this hash in the request header with the key `x-signature`.

> **Note**: Aeria follows the same signing request steps when calling any webhook with the webhook secret key, ensuring secure communication between systems.

# Conclusion

By following these steps, you can securely integrate your website with Aeria and manage physical access control for the properties you oversee through their Tenant Experience Platform.

