# JWT Authentication & Authorization System

Complete documentation for the JWT-based authentication and authorization system implemented in the Library Management System backend.

## Overview

The authentication system uses JWT (JSON Web Tokens) for stateless authentication, with support for:
- User registration and login
- Token-based authentication
- Refresh tokens for extended sessions
- Token blacklisting for secure logout
- Role-based access control (RBAC)
- Rate limiting for security
- Comprehensive input validation and sanitization

## Architecture

### Components

1. **Token Management**
   - Access tokens (short-lived, 1 hour)
   - Refresh tokens (long-lived, 7 days)
   - Token blacklist for logout

2. **Security Layers**
   - Password hashing (bcrypt with 10 rounds)
   - SQL injection prevention
   - XSS protection
   - CSRF protection
   - Rate limiting
   - Input validation and sanitization

3. **Authorization**
   - Role-based access control (admin, librarian, member)
   - Route-level authorization
   - Resource-level ownership checks

## API Endpoints

### Authentication Routes

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!@#",
  "role": "member"  // Optional, defaults to "member"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "member"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}
```

**Rate Limit:** 3 requests per hour per IP

**Password Requirements:**
- Minimum 8 characters, maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&#)
- Cannot be common passwords (password, 12345678, etc.)
- Cannot have more than 3 repeated characters

---

#### `POST /api/auth/login`
Login with username/email and password.

**Request Body:**
```json
{
  "username": "john_doe",  // OR "email": "john@example.com"
  "password": "SecurePass123!@#"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "member"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}
```

**Rate Limit:** 5 requests per 15 minutes per IP

---

#### `POST /api/auth/logout`
Logout and blacklist the current access token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (optional):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Optional, uses header if not provided
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

**Requires Authentication:** Yes

---

#### `POST /api/auth/refresh-token`
Refresh the access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}
```

**Rate Limit:** 10 requests per 15 minutes per IP

---

#### `GET /api/auth/me`
Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "member",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Requires Authentication:** Yes

## Authentication Flow

### Registration Flow
1. User submits registration form
2. Server validates input (username, email, password strength)
3. Server checks for duplicate username/email
4. Password is hashed with bcrypt (10 rounds)
5. User record is created in database
6. Access token and refresh token are generated
7. Tokens are returned to client

### Login Flow
1. User submits credentials (username/email + password)
2. Server validates input
3. User is looked up in database
4. Password is verified using bcrypt
5. Access token and refresh token are generated
6. Tokens are returned to client

### Authenticated Request Flow
1. Client includes access token in `Authorization: Bearer <token>` header
2. Server extracts token from header
3. Server checks if token is blacklisted
4. Server verifies token signature and expiry
5. Server attaches user info to request object
6. Request proceeds to route handler

### Logout Flow
1. Client sends logout request with token
2. Server extracts token
3. Server decodes token to get expiry time
4. Server adds token to blacklist
5. Token will be rejected on subsequent requests until it expires

### Token Refresh Flow
1. Client's access token expires
2. Client sends refresh token to `/api/auth/refresh-token`
3. Server verifies refresh token
4. Server generates new access token
5. New access token is returned to client

## Middleware

### `authenticate`
Verifies JWT token and attaches user info to request.

```javascript
import { authenticate } from '../middleware/auth.js';

router.get('/protected-route', authenticate, handler);
```

**Behavior:**
- Extracts token from `Authorization: Bearer <token>` header
- Checks if token is blacklisted
- Verifies token signature and expiry
- Attaches `req.user` (decoded token payload) and `req.token`

**Error Responses:**
- 401: Missing or invalid token
- 401: Token is blacklisted
- 401: Token has expired

---

### `authorize(...roles)`
Checks if user has required role(s).

```javascript
import { authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';

router.get('/admin-only', authenticate, authorize(USER_ROLES.ADMIN), handler);
router.get('/staff-only', authenticate, authorize(USER_ROLES.ADMIN, USER_ROLES.LIBRARIAN), handler);
```

**Predefined Helpers:**
- `isAdmin`: Only allows admin users
- `isLibrarian`: Allows admin and librarian users

---

### `validateRequest`
Validates request body using express-validator rules.

```javascript
import { validateRequest } from '../middleware/validateRequest.js';
import { validateUser } from '../utils/validators.js';

router.post('/register', validateUser.register, validateRequest, handler);
```

---

### Rate Limiters

**`authLimiter`**: 5 requests per 15 minutes (login)
**`registerLimiter`**: 3 requests per hour (registration)
**`refreshTokenLimiter`**: 10 requests per 15 minutes (token refresh)
**`generalLimiter`**: 100 requests per 15 minutes (all routes)

## Security Features

### Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Strength Requirements**: 
  - Minimum 8 characters
  - Must contain uppercase, lowercase, number, and special character
  - Cannot be common passwords
  - Maximum 3 repeated characters

### SQL Injection Prevention
- Parameterized queries (prepared statements)
- Input validation for suspicious SQL patterns
- All database queries use `$1, $2, ...` placeholders

### XSS Protection
- Input sanitization (removes `<`, `>`, `javascript:`, event handlers)
- Helmet.js security headers
- Content-Type validation

### CSRF Protection
- CSRF token validation for state-changing operations
- Session-based CSRF tokens (if using sessions)

### Token Security
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (7 days)
- Token blacklist for logout
- Secure token storage in memory (use Redis in production)

### Rate Limiting
- Prevents brute force attacks
- Different limits for different endpoints
- IP-based limiting

## User Roles

### Admin
- Full access to all endpoints
- Can manage users (create, update, delete)
- Can manage all resources

### Librarian
- Access to most endpoints except user management
- Can manage books, members, transactions
- Cannot create admin users

### Member
- Limited access
- Can view own profile
- Can view available books
- Can make reservations
- Cannot issue/return books directly

## Error Handling

All authentication errors return standardized responses:

```json
{
  "success": false,
  "message": "Error message here"
}
```

Common error codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `409`: Conflict (user already exists)
- `429`: Too Many Requests (rate limit exceeded)

## Configuration

Environment variables (`.env`):

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_SALT_ROUNDS=10
```

## Production Considerations

1. **Token Blacklist**: Use Redis instead of in-memory storage for scalability
2. **JWT Secrets**: Use strong, randomly generated secrets
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Consider using Redis for distributed rate limiting
5. **Token Storage**: Store tokens securely on client (httpOnly cookies recommended for web)
6. **Monitoring**: Log all authentication attempts and failures
7. **Password Policies**: Consider increasing minimum password length
8. **Token Rotation**: Implement refresh token rotation for enhanced security

## Testing

Example test requests using cURL:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!@#"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test123!@#"}'

# Get Profile
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"

# Refresh Token
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'

# Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

### "Token has expired"
- Access tokens expire after 1 hour
- Use refresh token to get a new access token

### "Invalid token"
- Token signature is invalid or token is malformed
- Ensure token is properly formatted in Authorization header

### "Too many requests"
- Rate limit has been exceeded
- Wait for the rate limit window to reset

### "User already exists"
- Username or email is already registered
- Use different credentials or try logging in

