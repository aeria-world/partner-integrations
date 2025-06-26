# C# Signature Utils

This folder contains the C# implementation for generating and validating x-signatures for partner integrations.

## Files

- `SignatureUtils.cs` - Main signature utilities class

## Dependencies

Install via NuGet Package Manager:

```bash
Install-Package Newtonsoft.Json
```

Or add to your `.csproj` file:

```xml
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
```

## Usage

```csharp
using System;
using System.Collections.Generic;
using SignatureUtils;

class Program
{
    static void Main()
    {
        // Generate signature
        var body = new Dictionary<string, object>
        {
            ["userId"] = "123",
            ["action"] = "create"
        };
        
        string integrationId = "partner-xyz";
        string secretKey = "your-secret-key";
        
        string signature = SignatureGenerator.GenerateSignature(body, integrationId, secretKey);
        
        // Validate signature
        bool isValid = SignatureGenerator.ValidateSignature(signature, body, integrationId, secretKey);
        Console.WriteLine($"Signature is valid: {isValid}");
    }
}
```

## Methods

### GenerateSignature(object body, string integrationId, string secretKey)
- **body**: Request body object (will be JSON serialized with sorted keys)
- **integrationId**: Unique integration identifier
- **secretKey**: Pre-shared secret key
- **Returns**: Signature string in format `${integrationId}.${timestamp}.${hash}`

### ValidateSignature(string signature, object body, string integrationId, string secretKey, long toleranceMs = 300000)
- **signature**: The signature to validate
- **body**: Request body object
- **integrationId**: Unique integration identifier
- **secretKey**: Pre-shared secret key
- **toleranceMs**: Timestamp tolerance in milliseconds (default: 300000 = 5 minutes)
- **Returns**: Boolean indicating if signature is valid

## Classes

### SortedKeysContractResolver
- Custom JSON contract resolver that ensures object properties are serialized in alphabetical order for consistent hashing
