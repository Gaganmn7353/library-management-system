# Frontend API Configuration

## Current Configuration

### API Base URL
- **Location**: `src/utils/api.js`
- **Current Value**: `http://localhost:5000/api`
- **Environment Variable**: `VITE_API_URL` (with fallback)

### Configuration Files

1. **`src/utils/api.js`**
   - Main API configuration file
   - Uses `VITE_API_URL` environment variable or defaults to `http://localhost:5000/api`
   - Includes axios interceptors for:
     - Adding Authorization token from localStorage
     - Handling 401 errors (redirects to login)

2. **`.env`** (if exists)
   - Contains: `VITE_API_URL=http://localhost:5000/api`
   - Vite automatically loads variables prefixed with `VITE_`

3. **`vite.config.js`**
   - Development server port: `3000`
   - Proxy configuration: `/api` → `http://localhost:5000`
   - This allows using relative URLs like `/api/auth/login` in development

## How It Works

### Development Mode
- Frontend runs on: `http://localhost:3000`
- Backend runs on: `http://localhost:5000`
- API calls go to: `http://localhost:5000/api` (or use proxy `/api`)

### Using the Proxy (Recommended)
With the proxy configured in `vite.config.js`, you can use relative URLs:
```javascript
api.get('/auth/me')  // → http://localhost:5000/api/auth/me
```

### Using Full URL
Without proxy, use full URL:
```javascript
api.get('http://localhost:5000/api/auth/me')
```

## Authentication Flow

1. **Login**: 
   - POST `/auth/login` with `{ username, password }`
   - Backend returns token in `response.data.data.token`
   - Token stored in `localStorage.setItem('token', token)`

2. **Authenticated Requests**:
   - Token automatically added to headers via axios interceptor
   - Header: `Authorization: Bearer <token>`

3. **Auth Check**:
   - GET `/auth/me` to verify token and get user info
   - Called on app initialization

4. **Logout**:
   - POST `/auth/logout` to invalidate token
   - Clear `localStorage.removeItem('token')`

## Backend Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (accepts username OR email)
- `GET /api/auth/me` - Get current user (requires token)
- `POST /api/auth/logout` - Logout (requires token)

## Troubleshooting

### API Connection Failed
1. Verify backend is running on port 5000
2. Check `VITE_API_URL` in `.env` file
3. Verify CORS is configured in backend (should allow `http://localhost:3000`)

### 401 Unauthorized
1. Check if token exists: `localStorage.getItem('token')`
2. Verify token is being sent in headers
3. Check if token has expired
4. Try logging in again

### CORS Errors
- Backend `.env` should have: `CORS_ORIGIN=http://localhost:3000`
- Or use the proxy in `vite.config.js` to avoid CORS issues

## Environment Variables

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

For production, update to production URL:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

