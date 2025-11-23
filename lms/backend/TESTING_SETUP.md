# Testing Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v12 or higher)
3. **npm** or **yarn**

## Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:
- Jest (testing framework)
- Supertest (HTTP testing)
- Swagger dependencies
- Other dev dependencies

### 2. Database Setup

#### Option A: Use Separate Test Database (Recommended)

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create test database
CREATE DATABASE library_management_test;

-- Run schema creation script on test database
\c library_management_test
\i schema.sql  -- Or your schema file
```

Set environment variable:
```bash
# Windows
set TEST_DB_NAME=library_management_test

# Linux/Mac
export TEST_DB_NAME=library_management_test
```

#### Option B: Use Main Database (Not Recommended for Production)

Tests will use the main database. Ensure you have backups!

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (auto-rerun on file changes)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Test Output

Tests will show:
- ✅ Passing tests
- ❌ Failing tests
- Coverage summary
- Test execution time

### Coverage Report

After running `npm run test:coverage`, view the HTML report:

```bash
# Open in browser
open coverage/lcov-report/index.html  # Mac
start coverage/lcov-report/index.html  # Windows
```

## Test Structure

### Unit Tests

Located in `tests/unit/`:
- **Controllers**: Test individual controller methods
- **Middleware**: Test authentication, validation, etc.

### Integration Tests

Located in `tests/integration/`:
- **Transaction Flow**: Complete issue/return cycle
- **Reservation Flow**: Reservation lifecycle
- **Fine Calculation**: Fine calculation and payment

## Writing New Tests

### Example: Controller Test

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';
import { cleanTestDatabase } from '../../helpers/testDatabase.js';
import { createTestUser, generateTestToken } from '../../helpers/mockData.js';

describe('My Controller', () => {
  beforeEach(async () => {
    await cleanTestDatabase();
  });

  it('should do something', async () => {
    const user = await createTestUser();
    const token = await generateTestToken(user);

    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## Troubleshooting

### Database Connection Errors

**Error**: `Connection refused` or `database does not exist`

**Solution**:
1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure test database exists
4. Verify user has permissions

### Test Timeouts

**Error**: `Timeout - Async callback was not invoked`

**Solution**:
1. Increase timeout in `jest.config.js`:
   ```javascript
   testTimeout: 30000, // 30 seconds
   ```
2. Check for unclosed database connections
3. Verify async/await is used correctly

### Windows-Specific Issues

**Error**: `NODE_ENV is not recognized`

**Solution**:
- Use `cross-env` (already included)
- Or manually set: `set NODE_ENV=test && npm test`

### Coverage Issues

**Error**: Coverage below 80%

**Solution**:
1. Review uncovered lines in coverage report
2. Add tests for edge cases
3. Test error scenarios
4. Test all code paths

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean database between tests
3. **Mocking**: Use mock data generators
4. **Assertions**: Use descriptive assertions
5. **Naming**: Use descriptive test names
6. **Structure**: Follow AAA pattern (Arrange, Act, Assert)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: library_management_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DB_HOST: localhost
      DB_PORT: 5432
      DB_NAME: library_management_test
      DB_USER: postgres
      DB_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
```

## Next Steps

1. ✅ Set up test database
2. ✅ Run initial tests
3. ✅ Review coverage report
4. ✅ Add missing tests
5. ✅ Set up CI/CD
6. ✅ Configure test environment

## Support

For issues:
1. Check `TESTING_DOCUMENTATION.md` for detailed info
2. Review test examples in `tests/` directory
3. Check Jest documentation: https://jestjs.io/
4. Check Supertest documentation: https://github.com/visionmedia/supertest

