# Java Signature Utils

This folder contains the Java implementation for generating and validating x-signatures for partner integrations.

## Files

- `SignatureUtils.java` - Main signature utilities class

## Dependencies

Add to your `pom.xml` (Maven) or `build.gradle` (Gradle):

### Maven
```xml
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.2</version>
</dependency>
```

### Gradle
```gradle
implementation 'com.fasterxml.jackson.core:jackson-databind:2.15.2'
```

## Compilation

```bash
javac -cp "path/to/jackson-databind.jar" SignatureUtils.java
```

## Usage

```java
import java.util.HashMap;
import java.util.Map;

// Generate signature
Map<String, Object> body = new HashMap<>();
body.put("userId", "123");
body.put("action", "create");

String integrationId = "partner-xyz";
String secretKey = "your-secret-key";

String signature = SignatureUtils.generateSignature(body, integrationId, secretKey);

// Validate signature
boolean isValid = SignatureUtils.validateSignature(signature, body, integrationId, secretKey);
```

## Methods

### generateSignature(Object body, String integrationId, String secretKey)
- **body**: Request body object (will be JSON serialized with sorted keys)
- **integrationId**: Unique integration identifier
- **secretKey**: Pre-shared secret key
- **Returns**: Signature string in format `${integrationId}.${timestamp}.${hash}`
- **Throws**: Exception if signature generation fails

### validateSignature(String signature, Object body, String integrationId, String secretKey, long toleranceMs)
- **signature**: The signature to validate
- **body**: Request body object
- **integrationId**: Unique integration identifier
- **secretKey**: Pre-shared secret key
- **toleranceMs**: Timestamp tolerance in milliseconds
- **Returns**: Boolean indicating if signature is valid

### validateSignature(String signature, Object body, String integrationId, String secretKey)
- Overloaded method with default tolerance of 5 minutes (300000ms)
