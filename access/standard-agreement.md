# Access Solution Provider Platform Integration Agreement

## Master Integration Agreement Between Aeria and Access Solution Provider

This Platform Integration Agreement is made between **Aeria** (hereinafter referred to as "Platform Provider"), operating a SaaS-based site management platform, and **Access Solution Provider** (hereinafter referred to as "Solution Provider"). This agreement establishes the framework for integrating the Solution Provider's access control systems with Aeria's platform for all current and future client sites as per site-specific agreements.

## 1. Roles and Responsibilities

### 1.1. Aeria (Platform Provider) Responsibilities
- Provide and maintain the platform that enables integration between Solution Provider's systems and client sites
- Define and maintain standardized integration specifications and APIs
- Facilitate onboarding of new client sites
- Provide necessary documentation and technical support for integration
- Handle client communications and requirements gathering
- Monitor service delivery across all integrated sites
- Maintain platform uptime and performance standards

### 1.2. Solution Provider Responsibilities
- Integrate their access control solution with Aeria's platform according to specified standards
- Maintain compatibility with Aeria's platform through regular updates
- Provide standardized pricing structure for all site implementations
- Ensure consistent service delivery across all client sites
- Submit regular performance reports for all integrated sites
- Maintain required certifications and compliance standards
- Provide technical support for integration-related issues
- Scale services to accommodate new site additions

## 2. Integration Framework

### 2.1. Integration Development Responsibilities

#### 2.1.1. Mutual Development Agreement
- This integration partnership is established for mutual business benefit
- Neither party shall charge the other for integration development work
- Each party is responsible for their own development costs

#### 2.1.2. Aeria (Platform Provider) Responsibilities
At their own expense, Aeria shall:
- Develop and maintain all necessary APIs for integration
- Ensure platform readiness for integration
- Provide comprehensive API documentation
- Maintain backward compatibility of APIs
- Provide testing environments
- Handle platform-side updates and modifications
- Ensure platform scalability for integration

#### 2.1.3. Solution Provider Responsibilities
At their own expense, Solution Provider shall:
- Develop all necessary integration components
- Ensure their system is integration-ready
- Implement required API endpoints
- Maintain compatibility with Aeria's platform
- Handle their system updates and modifications
- Ensure their system's scalability
- Solution Provider must provide Aeria with adequate sample hardware components:
  - Sufficient quantity of readers and controllers for testing
  - All supported authentication method variants
  - Located at Aeria's preferred testing location
  - Provided at no cost to Aeria
  - Maintained and updated as needed for ongoing integration testing
  - Replaced or upgraded when new hardware versions are released
  - Available for continuous integration validation

#### 2.1.4. Development Cost Restrictions
The following costs must be borne by the respective parties:
- All API development and maintenance
- System modifications for integration
- Testing and validation systems
- Documentation development
- Security implementation
- Ongoing compatibility updates
- Performance optimization
- No retrofitting charges between parties

### 2.2. API Integration Requirements

#### 2.2.1. Integration Architecture
a) Communication Flow
- All communication between Aeria and Solution Provider must occur via RESTful APIs
- Solution Provider must implement and maintain:
  - Secure cloud-based API endpoints following OAuth 2.0 standards
  - Efficient hardware command routing and execution
  - Real-time status synchronization between cloud and hardware
  - Robust error handling and retry mechanisms
  - Comprehensive logging and monitoring
  - Scalable cloud infrastructure

b) Technical Requirements
- API Response Times:
  - 99.9% of API calls must complete within 200ms
  - Maximum allowed latency of 500ms for any single call
  - Automatic retry for failed calls up to 3 attempts
- Infrastructure Requirements:
  - Minimum 99.99% API uptime guarantee
  - Multi-region deployment with automatic failover
  - Horizontal scaling capabilities to handle peak loads
  - Rate limiting and throttling mechanisms
  - Comprehensive monitoring and alerting
  - Regular security audits and penetration testing
  - Documented disaster recovery procedures

#### 2.2.2. Hardware Command Execution Requirements
a) Timing Requirements
- Standard execution time from API call to door response: < 1 second, consisting of:
  - Aeria to Solution Provider API response: < 200ms
  - Solution Provider cloud processing: < 300ms
  - Cloud to hardware communication: < 500ms
  
b) Solution Provider's Responsibilities
- Maintain cloud API uptime of 99.99%
- Ensure reliable cloud-to-hardware communication
- Monitor end-to-end command execution
- Handle hardware protocol translations
- Manage hardware connection states
- Buffer and retry mechanisms for hardware communication
- Real-time hardware status updates

c) Hardware Communication Management
- Solution Provider must:
  - Maintain secure connections to all hardware
  - Handle hardware protocol specifics
  - Manage hardware authentication
  - Monitor hardware connectivity
  - Implement failover procedures
  - Handle network interruptions
  - Provide hardware status updates

d) Performance Monitoring
- Solution Provider must monitor:
  - Cloud API performance
  - Cloud-to-hardware communication
  - Hardware response times
  - End-to-end command execution
  - System bottlenecks
  - Network latency
  - Hardware state

#### 2.2.3. Access Control Management APIs
a) Access Group Management
- Creation of multiple access groups
- Granular door selection within groups
- Time-based restrictions including:
  - Time zones
  - Daily schedules
  - Holiday schedules
  - Special event schedules
- Access rule configuration:
  - Door-specific rules
  - Time-bound permissions
  - Authentication method requirements
  - Access level hierarchies

b) Credential Management
- Support for all authentication methods:
  - QR codes
  - Bluetooth Low Energy (BLE)
  - Near Field Communication (NFC)
  - Facial Recognition (FR)
  - PIN codes
  - RFID cards
  - Mobile credentials
- Credential operations:
  - Creation/Registration
  - Assignment/Unassignment
  - Activation/Deactivation
  - Validity period management
  - Bulk operations support
- Temporal controls:
  - Start date/time
  - End date/time
  - Temporary access periods
  - Recurring schedules

#### 2.2.4. Data Retrieval APIs
- Comprehensive data access for all Aeria-created entities:
  - Access groups
  - User credentials
  - Access rules
  - Audit logs
  - Usage statistics
- Query capabilities:
  - Filtering on date range without pagination
- Real-time data synchronization
- Historical data access

#### 2.2.5. Webhook Integration Requirements
a) Event Notifications
- Real-time webhook callbacks for:
  - Access attempts (successful and denied)
  - User interactions
  - System events
  - Hardware status changes
  - Error conditions

b) Event Data Requirements
- Detailed event information including:
  - Timestamp (UTC)
  - Event type
  - Location
  - User identification
  - Credential used
  - Access point
  - Event outcome
  - Reason codes for denied access:
    - Invalid credential
    - Expired credential
    - Out of schedule
    - Insufficient privileges
    - Hardware malfunction
    - Other specific denial reasons
  - Additional context data

c) Webhook Performance Requirements
- Maximum latency: 1 second
- Retry mechanism for failed deliveries
- Guaranteed delivery order
- Event persistence
- Acknowledgment handling

#### 2.2.6. API Performance and Reliability
- Response time: ≤ 1 second for all API operations
- Availability: 99.9% uptime
- Rate limiting specifications
- Error handling protocols
- API versioning support
- Backward compatibility requirements

#### 2.2.7. API Security Requirements
- Authentication mechanisms
- Authorization protocols
- Data encryption
- Secure communication channels
- Audit logging
- Access token management
- Rate limiting
- IP whitelisting options

#### 2.2.8. Software Suite Hosting Options

a) Hosting Models
- Centralized hosting by Aeria
  - Single instance serving multiple sites
  - Hosted in Aeria's infrastructure
  - Integrated with Aeria's platform
- Individual site hosting
  - Dedicated instance per site or site group
  - Hosted in client's infrastructure
  - Connected to Aeria's platform

b) Infrastructure Responsibilities
- Hosting Party (Aeria or Client) responsible for:
  - Server infrastructure procurement
  - Cloud infrastructure setup
  - Network connectivity
  - Database infrastructure
  - Storage requirements
  - Backup infrastructure
  - Security infrastructure
  - Load balancing setup
  - Monitoring infrastructure

c) Solution Provider's Responsibilities (at no additional manpower cost)
- Software Installation:
  - Initial setup and configuration
  - Database setup and optimization
  - Network configuration
  - Security configuration
  - Integration setup
  - Migration support if needed

- Maintenance:
  - Regular system health checks
  - Performance optimization
  - Database maintenance
  - Security patches
  - Bug fixes
  - Configuration updates
  - System tuning

- Debugging:
  - Issue investigation
  - Root cause analysis
  - Performance troubleshooting
  - Integration debugging
  - Error resolution
  - System diagnostics
  - Log analysis

- Upgrades:
  - Version upgrades
  - Feature updates
  - Security updates
  - Patch management
  - Database schema updates
  - API version updates
  - Integration updates
  - Documentation updates

d) Service Level Requirements
- Response times for hosted solutions:
  - Critical issues: < 1 hour
  - Major issues: < 4 hours
  - Minor issues: < 24 hours
- Resolution times:
  - Critical issues: < 4 hours
  - Major issues: < 24 hours
  - Minor issues: < 72 hours
- Upgrade windows:
  - Planned during off-peak hours
  - Minimum 48 hours notice
  - Rollback plan required
  - Zero data loss guarantee

e) Support Coverage
- 24/7 support for critical issues
- Business hours support for non-critical issues
- Remote support capabilities
- On-site support when required
- Dedicated support contact
- Escalation procedures
- Knowledge transfer to hosting team

### 2.2.9. Cloud Infrastructure Requirements and Costs

a) Initial Cost Disclosure Requirements
Solution Provider must provide detailed written specifications for:
- Minimum server requirements:
  - CPU cores and specifications
  - RAM requirements
  - Storage capacity and type
  - Network bandwidth
  - Database specifications
- Scaling thresholds:
  - Maximum users per server instance
  - Maximum doors/readers per instance
  - Maximum transactions per second
  - Maximum API calls per second
  - Maximum concurrent connections
  - Database size projections
- Infrastructure components:
  - Load balancers
  - Backup systems
  - Monitoring tools
  - Security components
  - Redundancy requirements

b) Cost Breakdown Requirements
Detailed costs must be provided for:
- Base infrastructure setup
- Per-instance hosting costs
- Database hosting costs
- Backup storage costs
- Network bandwidth costs
- SSL certificate costs
- Monitoring tool costs
- Security component costs
- Disaster recovery infrastructure

c) Scaling Cost Matrix
Provider must specify:
- Cost per additional server instance
- Cost per additional user block
- Cost per additional door/reader block
- Cost per additional storage block
- Cost per additional bandwidth block
- Database scaling costs

d) Cost Responsibility
- All costs specified in initial agreement will be borne by hosting party
- Solution Provider shall bear:
  - Any additional infrastructure costs not specified initially
  - Costs due to inefficient resource utilization
  - Costs due to performance optimization requirements
  - Costs due to security requirement changes
  - Costs due to compliance requirement changes
  - Costs due to scalability issues
  - Any unexpected or unspecified costs

e) Infrastructure Optimization
Solution Provider must:
- Regularly review resource utilization
- Optimize system performance
- Reduce unnecessary resource consumption
- Implement cost-saving measures
- Provide optimization recommendations
- Monitor and report inefficiencies

f) Cost Restrictions
- No additional charges for:
  - Performance optimization
  - Security updates
  - Bug fixes
  - System tuning
  - Resource optimization
  - Configuration changes
  - Monitoring setup
  - Standard maintenance

g) Annual Cost Review
- Annual review of infrastructure costs
- Identification of optimization opportunities
- Implementation of cost-saving measures
- Update of scaling requirements
- Review of resource utilization
- Adjustment of capacity planning

h) Reporting Requirements
Provider must submit monthly reports on:
- Resource utilization
- Performance metrics
- Scaling requirements
- Cost optimization opportunities
- Infrastructure health
- Capacity planning recommendations

### 2.3. Technical Requirements
- API compatibility and specifications
- Security protocols and standards
- Data exchange formats
- Integration testing procedures
- Performance benchmarks
- Monitoring and logging requirements

### 2.4. Authentication Methods and Reader Capabilities

#### 2.4.1. Reader Functionality
- All authentication methods supported by the procured reader hardware must be made available without additional charges
- This includes but is not limited to:
  - Bluetooth Low Energy (BLE)
  - Near Field Communication (NFC)
  - QR Code scanning
  - RFID card reading
  - Biometric authentication
  - PIN code entry
  - Mobile credentials
  - Any other authentication method supported by the reader

#### 2.4.2. Included in Initial Scope
The following must be provided without additional charges:
- All software licenses required for supported authentication methods
- All necessary configuration and integration work
- Any required development for supported authentication methods
- All necessary firmware and software updates
- Integration with Aeria's platform for all supported methods
- Support for unlimited users within the site's scope

#### 2.4.3. Restrictions
- No additional charges may be levied for:
  - Enabling supported authentication methods
  - Adding new users utilizing supported methods
  - Software licenses for supported authentication methods
  - Integration or configuration of supported methods
  - Development work required for supported methods
  - Updates or maintenance of supported methods

### 2.5. Cost Implications
- All costs for supported authentication methods must be included in the initial scope
- No additional hardware costs unless explicitly requested by the site
- No additional software license fees for supported authentication methods
- No additional development or integration charges for supported methods
- No user-based licensing fees for supported authentication methods

### 2.6. Onboarding Process
- Standard implementation timeline
- Testing and validation procedures
- Documentation requirements
- Training requirements
- Go-live criteria

## 3. Financial Framework

### 3.1. Licensing Terms and Conditions

#### 3.1.1. License Fee Structure
- License fees shall only apply to:
  - Physical hardware items procured
  - Software systems procured
- No additional licensing fees for:
  - Number of users
  - Number of interactions
  - API calls or integrations
  - System utilization levels
  - Additional authentication methods
  - Additional features supported by procured items

#### 3.1.2. Aeria's License Rights
Aeria shall have full and unrestricted rights to:
- Distribute licenses across multiple sites
- Reassign licenses between sites
- Pool licenses across different locations
- Transfer licenses between users
- Reallocate licenses as needed
- Add unlimited users to licensed systems
- Use licensed systems without usage limitations

#### 3.1.3. License Restrictions
The Solution Provider:
- Cannot impose additional licensing fees beyond initial procurement
- Cannot restrict the number of users
- Cannot limit system interactions
- Cannot charge for license redistribution
- Cannot impose usage-based fees
- Cannot restrict Aeria's license management

### 3.2. Cost Structure
- One-time hardware costs with associated licenses
- One-time software procurement costs with associated licenses
- No recurring licensing fees unless explicitly agreed for specific procurements
- No user-based licensing fees
- No interaction-based licensing fees

### 3.3. Integration Development Costs
a) Prohibited Charges:
- No development fees between parties
- No API creation or maintenance fees
- No integration readiness charges
- No retrofitting fees
- No compatibility update charges
- No testing environment fees

b) Each Party's Financial Responsibilities:
- Own platform/system development costs
- Own API development and maintenance
- Own integration component development
- Own testing and validation systems
- Own documentation development
- Own security implementation
- Own scalability measures

### 3.4. Cost Responsibility
a) Solution Provider shall bear costs related to:
- Platform integration development
- Maintaining compatibility with platform updates
- Resolution of integration issues
- Support infrastructure

b) Site-specific costs to be borne by end clients:
- Hardware procurement and installation
- Subscription license fees (if applicable)
- Any additional customization requirements
- Maintenance and support fees

### 3.5. Cost Restrictions
a) The following shall not incur additional charges:
- Enabling any authentication method supported by procured readers
- Software licenses for supported authentication methods
- Integration work for supported authentication methods
- Configuration of supported authentication methods
- User additions utilizing supported authentication methods
- Updates and maintenance of supported authentication methods
- License redistribution or reallocation
- Additional users under existing licenses
- System interactions under existing licenses
- License transfers between sites
- License pooling or sharing

b) Additional charges are only permitted for:
- New hardware procurement with associated licenses
- New software procurement with associated licenses
- Site-requested additional hardware/software procurement
- Explicitly agreed maintenance fees for procured items

### 3.6. Pricing Transparency
a) Solution Provider must provide:
- Clear breakdown of hardware costs
- Transparent subscription fee structure (if applicable)
- Documentation of all additional charges
- Advance notification of any price changes

### 3.7. Billing and Payment
- Hardware costs to be paid as per agreed payment terms
- Subscription fees to be billed directly to end clients
- Payment terms and conditions
- Invoice requirements

## 4. Service Level Agreements (SLA)

### 4.1. Real-Time Performance SLAs

#### 4.1.1 Cloud API Performance SLAs
- API Availability: 99.99% uptime
- API Response Time: < 200ms for 99.9% of requests
- API Error Rate: < 0.01%
- API Throughput: Minimum 100 requests per second per site

#### 4.1.2 End-to-End Performance SLAs
- End-to-end command execution: < 1 second for 99% of commands
- End-to-end command execution: < 5 seconds for 99.99% of commands
- Cloud-to-hardware communication: < 1 second for 99.99% of commands
- System recovery time: < 30 seconds

#### 4.1.3 Hardware Command Execution SLAs
- End-to-end command execution: < 1 second for 99% of commands
- End-to-end command execution: < 5 second for 99.99% of commands
- Hardware response time: < 1 second for 99.99% of commands
- Command failure rate: < 0.01%
- System recovery time: < 30 seconds
- Consecutive failure limit: 0 (no consecutive failures allowed)

#### 4.1.4 Performance Penalties for Hardware Delays
- Single command delay (>5s): 0.1% of monthly fee for site
- Multiple delays in same hour: 1% of monthly fee for site
- Consecutive delays: 5% of monthly fee for site
- Critical access delays: 10% of monthly fee per incident for site
- System-wide delays: 20% of monthly fee per hour for site

### 4.2. Platform Integration Performance
- API availability: 99.9%
- Response time standards
- Error rate thresholds
- Data synchronization requirements

### 4.3. Platform Integration Performance
a) API Availability Requirements
- Minimum API availability: 99.99%
- Scheduled maintenance windows: 24 hours advance notice to be performed in non-business hours
- Maximum allowed unplanned downtime: 5 hours per year

b) Response Time Standards  
- Average response time: 200ms
- Peak response time: 500ms
- Response time monitoring: Real-time with 1-minute intervals

c) Error Rate Requirements
- Maximum error rate: 0.01%
- Error tracking methodology: Detailed logging with error categorization
- Error resolution timeline: 
    - P0 Critical issues: 2 hour
    - P1 High priority issues: 8 business hours
    - P2 Standard issues: 24 business hours

d) Data Synchronization Standards
- Sync frequency: Real-time
- Maximum sync delay: 
    - 5 seconds for push operations like adding or updating users, enabling credentials, creating access groups, updating time zones, etc.
    - 1 minute for pull operations like fetching movement logs, user credentials, access groups, time zones, etc.
- Data consistency requirements: 100% for push operations and 99.9% for pull operations

### 4.4. Support Requirements
a) Support Availability
- Support hours: 24/7/365
- Emergency support: 24/7 with 15-minute response time
- Support channels: Email, Phone, Chat, and Aeria's support portal

b) Response Time Commitments
- P0 response: 15 minutes
- P1 response: 1 business hour
- P2 response: 4 business hours

c) Resolution Time Standards
- P0 Critical issues: 2 hours
- P1 High priority issues: 8 hours
- P2 Standard issues: 24 hours

d) Escalation Procedures
- Level 1 escalation: Automatic after 1 hour of P0 issues
- Level 2 escalation: Automatic after 8 hours of P0 issues
- Executive escalation: Automatic after 24 hours of any issues if response is not satisfactory

## 5. Compliance and Security

### 5.1. Data Protection
a) Data Handling Standards
- Data classification: AES-256 encryption for all stored data
- Storage requirements: Encrypted at rest with HSM key management
- Transmission security: TLS 1.3 with perfect forward secrecy

b) Privacy Requirements
- Data privacy standards: GDPR and CCPA compliant
- User data protection: End-to-end encryption
- Consent management: User consent for data processing

c) Security Protocols
- Encryption standards: AES-256 for data at rest, TLS 1.3 for transit
- Access controls: OAuth 2.0 with MFA
- Security monitoring: 24/7 automated threat detection

d) Audit Requirements
- Audit frequency: Continuous automated security scanning
- Audit scope: All data in transit and at rest
- Compliance reporting: Monthly compliance reports

### 5.2. Certifications
a) Required Industry Certifications
- Security certifications: ISO 27001, SOC 2 Type II
- Industry standards: OWASP Top 10 compliance
- Compliance certifications: ISO 27001, SOC 2 Type II

b) Compliance Standards
- Regulatory compliance: GDPR, CCPA, HIPAA
- Industry compliance: OWASP Top 10 compliance
- Local compliance: Local data protection laws

c) Regular Audit Requirements
- Internal audits: Quarterly security assessments
- External audits: Annual external audits
- Certification maintenance: Monthly compliance reports

## 6. Site-Specific Implementations

### 6.1. Individual Site Agreements
a) Documentation Requirements
- Site specifications: Detailed technical documentation for the site including site map, access points, wiring diagram, etc.
- Technical requirements: API specifications and integration patterns
- Implementation scope: Integration of Aeria's platform with the site's access control system

b) Pricing Framework
- Hardware costs: Hardware procurement and installation costs
- Service fees: Integration development and maintenance costs
- Additional charges: Any additional costs for site-specific implementation

c) Implementation Standards
- Timeline requirements: Maximum 4 weeks from hardware installation, or as agreed in the site-specific agreement
- Resource allocation: Dedicated technical team during implementation
- Quality standards: 100% test coverage for integration points

### 6.2. Site Onboarding Process
a) Assessment Procedures
- Site evaluation: Technical infrastructure assessment
- Requirements gathering: API compatibility verification
- Technical assessment: Network latency and bandwidth verification

b) Implementation Planning
- Project timeline: 2-4 weeks standard deployment
- Resource allocation: Dedicated integration engineer
- Risk management: Mitigation of integration risks

c) Testing Requirements
- Test phases: Unit, Integration, End-to-end, Performance
- Acceptance criteria: 100% API test coverage
- Performance validation: Load testing up to 10x expected volume

## 7. Quality Assurance

### 7.1. Performance Monitoring
a) Integration Health Checks
- Monitoring frequency: Real-time with 1-minute intervals
- Health metrics: Latency, Error rates, CPU usage, Memory usage
- Reporting requirements: Monthly performance reports

b) Quality Control
- Quality standards: 100% automated test coverage
- Testing procedures: Automated regression testing
- Validation requirements: Performance testing under peak load

c) Continuous Improvement
- Performance reviews: Monthly performance analysis
- Optimization requirements: Quarterly performance optimization
- Innovation standards: Continuous improvement of integration

## 8. Support and Maintenance

### 8.1. Ongoing Support
a) Integration Support
- Support coverage: 24/7 technical support
- Response and resolution times as per the SLA

b) Maintenance Standards
- Maintenance schedule: Weekly security updates
- Update procedures: Zero-downtime deployments, or as agreed in the site-specific agreement
- Version control: Semantic versioning with backwards compatibility