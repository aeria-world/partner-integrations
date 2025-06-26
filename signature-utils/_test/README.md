# Testing Directory

This directory contains all testing-related files for the signature utilities project.

## Files

### Test Data
- `test-data.json` - Shared test data used by all language implementations

### Test Scripts
- `cross-language-test.js` - JavaScript/Node.js cross-language test
- `cross_language_test.py` - Python cross-language test  
- `cross_language_test.php` - PHP cross-language test
- `test_example.js` - JavaScript usage example with async patterns

### Test Runner
- `run-cross-language-tests.sh` - Master test runner script for all languages

### Documentation
- `TESTING.md` - Comprehensive testing guide and documentation

## Generated Files

When tests are run, they generate signature files for cross-validation:
- `javascript-generated-signatures.json`
- `python-generated-signatures.json`
- `php-generated-signatures.json`
- `{language}-generated-signatures.json` (for other languages)

## Running Tests

### All Languages
```bash
# From the signature-utils root directory
./_test/run-cross-language-tests.sh
```

### Individual Languages
```bash
# JavaScript
node _test/cross-language-test.js

# Python  
python3 _test/cross_language_test.py

# PHP
php _test/cross_language_test.php

# Example usage
node _test/test_example.js
```

## Test Structure

Each test follows this pattern:

1. **Load test data** from `test-data.json`
2. **Generate signatures** using fixed timestamps for reproducibility
3. **Self-validate** generated signatures
4. **Cross-validate** signatures from other languages (if available)
5. **Save results** to `{language}-generated-signatures.json`

## Adding New Tests

To add tests for a new language:

1. Create a test file in this directory
2. Follow the existing pattern for loading test data and generating signatures
3. Save results with the naming convention `{language}-generated-signatures.json`
4. Update `run-cross-language-tests.sh` to include the new test

## Test Data Format

The `test-data.json` file contains:
```json
{
  "testCases": [
    {
      "name": "Test case description",
      "body": { /* request body object */ },
      "integrationId": "integration-id",
      "secretKey": "secret-key",
      "fixedTimestamp": 1703097600000
    }
  ]
}
```

## Cross-Language Validation

The tests verify that:
- Signatures generated in one language can be validated by all other languages
- All implementations produce consistent results for the same input
- JSON serialization is deterministic across languages
- Timestamp validation works correctly across implementations
