# Testing and Documentation Setup

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Test Database

Create a test database (optional, can use main database for testing):

```sql
CREATE DATABASE library_management_test;
```

Or set environment variable:
```bash
TEST_DB_NAME=library_management_test
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### 4. View API Documentation

Start the server:
```bash
npm run dev
```

Access Swagger UI at: `http://localhost:5000/api-docs`

## Test Coverage

The test suite covers:

- ✅ Authentication flows (register, login, logout, token validation)
- ✅ Book CRUD operations
- ✅ Transaction lifecycle (issue, return, fine calculation)
- ✅ Reservation system (create, fulfill, cancel, queue management)
- ✅ Fine calculations and payments
- ✅ Error scenarios and edge cases
- ✅ Role-based access control
- ✅ Input validation

## Test Structure

```
tests/
├── setup.js                    # Global test configuration
├── helpers/
│   ├── testDatabase.js        # Database utilities
│   ├── mockData.js            # Data generators
│   └── testHelpers.js         # Test utilities
├── unit/
│   ├── controllers/           # Controller unit tests
│   └── middleware/            # Middleware tests
└── integration/                # Integration tests
```

## Documentation

### API Documentation

- **Swagger UI**: `http://localhost:5000/api-docs`
- **API Documentation**: See `API_DOCUMENTATION.md`
- **Testing Guide**: See `TESTING_DOCUMENTATION.md`

### Postman Collection

Import `postman_collection.json` into Postman for:
- Pre-configured API requests
- Environment variables
- Test scripts
- Request examples

## Coverage Goals

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

View coverage report: `coverage/lcov-report/index.html`

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Check `.env` file for database credentials
3. Verify database exists

### Test Failures

1. Check test database is clean
2. Verify all dependencies are installed
3. Check environment variables

### Windows Compatibility

The test scripts use `cross-env` for Windows compatibility. If issues persist:

```bash
# Manually set environment variable
set NODE_ENV=test && npm test
```

## Continuous Integration

Example GitHub Actions workflow:

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
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:coverage
```

## Next Steps

1. Review test coverage report
2. Add tests for edge cases
3. Set up CI/CD pipeline
4. Configure test database in production
5. Add performance tests
6. Add E2E tests

