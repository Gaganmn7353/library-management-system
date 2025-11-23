# Testing Documentation

## Overview

This document provides comprehensive information about the testing setup, test structure, and how to run tests for the Library Management System API.

## Test Framework

- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library for testing Express.js routes
- **Coverage**: Jest's built-in coverage tool

## Test Structure

```
tests/
├── setup.js                    # Global test setup
├── helpers/
│   ├── testDatabase.js        # Database setup/teardown utilities
│   ├── mockData.js            # Mock data generators
│   └── testHelpers.js         # Test utility functions
├── unit/
│   ├── controllers/           # Unit tests for controllers
│   │   ├── authController.test.js
│   │   ├── bookController.test.js
│   │   ├── transactionController.test.js
│   │   ├── reservationController.test.js
│   │   └── fineController.test.js
│   └── middleware/            # Unit tests for middleware
│       └── auth.test.js
└── integration/               # Integration tests
    ├── transactionFlow.test.js
    ├── reservationFlow.test.js
    └── fineCalculation.test.js
```

## Test Database Setup

The test suite uses a separate test database (`library_management_test`) to avoid affecting development data.

### Database Configuration

- Test database name: `{DB_NAME}_test`
- Tables are truncated before each test suite
- Database connection is managed through a test pool

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run Integration Tests Only

```bash
npm run test:integration
```

## Test Coverage

The project aims for >80% code coverage across:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### View Coverage Report

After running `npm run test:coverage`, open:
```
coverage/lcov-report/index.html
```

## Test Categories

### Unit Tests

Unit tests focus on testing individual components in isolation:

- **Controllers**: Test request/response handling, validation, and business logic
- **Middleware**: Test authentication, authorization, and request processing
- **Models**: Test database operations (if needed)

### Integration Tests

Integration tests verify complete workflows:

- **Transaction Flow**: Issue → Return → Fine calculation
- **Reservation Flow**: Create → Queue → Fulfill → Cancel
- **Fine Calculation**: Overdue detection → Fine calculation → Payment

## Mock Data

The test suite includes comprehensive mock data generators:

- `generateMockUser()`: Create test user data
- `generateMockBook()`: Create test book data
- `generateMockMember()`: Create test member data
- `createTestUser()`: Create user in database
- `createTestBook()`: Create book in database
- `createTestUserWithMember()`: Create complete user + member setup

## Test Helpers

### Database Helpers

- `setupTestDatabase()`: Initialize test database
- `cleanTestDatabase()`: Truncate all tables
- `closeTestDatabase()`: Close database connections
- `testQuery()`: Execute queries on test database

### Request Helpers

- `createAuthHeaders(token)`: Create authenticated request headers
- `assertSuccessResponse()`: Assert successful API response structure
- `assertErrorResponse()`: Assert error response structure

## Writing Tests

### Example Unit Test

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../src/app.js';

describe('Book Controller', () => {
  beforeEach(async () => {
    await cleanTestDatabase();
  });

  it('should get all books', async () => {
    const response = await request(app)
      .get('/api/books')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.books)).toBe(true);
  });
});
```

### Example Integration Test

```javascript
describe('Transaction Flow', () => {
  it('should complete full transaction lifecycle', async () => {
    // Issue book
    const issueResponse = await request(app)
      .post('/api/transactions/issue')
      .set(createAuthHeaders(librarianToken))
      .send({ member_id: 1, book_id: 1 })
      .expect(201);

    // Return book
    const returnResponse = await request(app)
      .post(`/api/transactions/${issueResponse.body.data.id}/return`)
      .set(createAuthHeaders(librarianToken))
      .expect(200);

    expect(returnResponse.body.data.status).toBe('returned');
  });
});
```

## Test Scenarios Covered

### Authentication
- ✅ User registration
- ✅ User login
- ✅ Token validation
- ✅ Token blacklisting (logout)
- ✅ Role-based access control

### Books
- ✅ CRUD operations
- ✅ Search and filtering
- ✅ Pagination
- ✅ Category filtering
- ✅ Authorization checks

### Transactions
- ✅ Book issuing
- ✅ Book returning
- ✅ Overdue detection
- ✅ Fine calculation
- ✅ Maximum books per member
- ✅ Pending fine checks

### Reservations
- ✅ Creating reservations
- ✅ Queue management
- ✅ Reservation fulfillment
- ✅ Reservation cancellation
- ✅ Expiry handling

### Fines
- ✅ Fine calculation
- ✅ Fine payment
- ✅ Payment history
- ✅ Partial payments

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:coverage
```

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify test database exists: `CREATE DATABASE library_management_test;`

### Test Timeouts

If tests timeout, increase timeout in `jest.config.js`:
```javascript
testTimeout: 30000, // 30 seconds
```

### Coverage Issues

- Ensure all test files are in the correct directories
- Check `collectCoverageFrom` in `jest.config.js`
- Verify excluded files are appropriate

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean database between tests
3. **Mocking**: Use mock data generators for consistency
4. **Assertions**: Use descriptive assertion messages
5. **Coverage**: Aim for high coverage but focus on critical paths
6. **Speed**: Keep tests fast; use integration tests sparingly

## Future Enhancements

- [ ] Add E2E tests with Playwright/Cypress
- [ ] Performance testing
- [ ] Load testing
- [ ] Security testing
- [ ] API contract testing

