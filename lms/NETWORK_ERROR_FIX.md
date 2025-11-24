# 🔧 Fix Network Error During Login

## Common Causes & Solutions

### 1. ✅ Backend Server Not Running

**Check:**
- Is the backend server running on port 5000?
- Open: http://localhost:5000/api/health

**Fix:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\backend"
npm run dev
```

**Expected output:**
```
🚀 Server is running on port 5000
```

---

### 2. ✅ CORS Configuration Issue

**Check backend `.env` file:**
```env
CORS_ORIGIN=http://localhost:3000
```

**Verify in `backend/src/config/env.js`:**
```javascript
cors: {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}
```

**Fix:** Make sure `CORS_ORIGIN=http://localhost:3000` is in `backend/.env`

---

### 3. ✅ API URL Mismatch

**Check frontend API configuration:**

**File:** `frontend/src/utils/api.js`
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

**Check frontend `.env` file:**
```env
VITE_API_URL=http://localhost:5000/api
```

**Fix:** 
- Create `frontend/.env` if missing
- Add: `VITE_API_URL=http://localhost:5000/api`
- Restart frontend server

---

### 4. ✅ Port Conflicts

**Check if ports are in use:**
- Backend: Port 5000
- Frontend: Port 3000

**Fix:**
```bash
# Windows - Check port usage
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Kill process if needed (replace PID with actual process ID)
taskkill /PID <PID> /F
```

---

### 5. ✅ Database Connection Error

**Check backend logs for database errors**

**Fix:**
- Verify PostgreSQL is running
- Check `backend/.env` has correct database credentials:
  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=library_management
  DB_USER=postgres
  DB_PASSWORD=Gagan@
  ```

---

### 6. ✅ Browser Console Errors

**Open browser DevTools (F12) and check:**
- Console tab for errors
- Network tab for failed requests

**Common errors:**
- `ERR_CONNECTION_REFUSED` → Backend not running
- `CORS policy` → CORS configuration issue
- `404 Not Found` → Wrong API endpoint
- `500 Internal Server Error` → Backend error

---

## 🔍 Step-by-Step Debugging

### Step 1: Verify Backend is Running

**Test backend directly:**
```bash
# In browser or Postman
GET http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

### Step 2: Test Login Endpoint Directly

**Using curl or Postman:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Expected response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "..."
  }
}
```

---

### Step 3: Check Frontend Network Requests

**Open browser DevTools → Network tab:**
1. Try to login
2. Look for the `/auth/login` request
3. Check:
   - Request URL (should be `http://localhost:5000/api/auth/login`)
   - Status code (200 = success, 500 = server error, etc.)
   - Response body

---

### Step 4: Verify Environment Variables

**Backend `.env` (required):**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
DB_USER=postgres
DB_PASSWORD=Gagan@
CORS_ORIGIN=http://localhost:3000
```

**Frontend `.env` (optional but recommended):**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Quick Fix Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Backend responds to http://localhost:5000/api/health
- [ ] Frontend server is running (`npm run dev` in frontend folder)
- [ ] Frontend is accessible at http://localhost:3000
- [ ] `CORS_ORIGIN=http://localhost:3000` in backend `.env`
- [ ] `VITE_API_URL=http://localhost:5000/api` in frontend `.env` (optional)
- [ ] No port conflicts (5000 and 3000 are free)
- [ ] PostgreSQL is running
- [ ] Database `library_management` exists
- [ ] Browser console shows no CORS errors

---

## 🐛 Common Error Messages & Fixes

### "Network Error" or "ERR_CONNECTION_REFUSED"
**Cause:** Backend not running  
**Fix:** Start backend server

### "CORS policy: No 'Access-Control-Allow-Origin' header"
**Cause:** CORS misconfiguration  
**Fix:** Check `CORS_ORIGIN` in backend `.env`

### "404 Not Found"
**Cause:** Wrong API endpoint  
**Fix:** Verify API URL is `http://localhost:5000/api`

### "500 Internal Server Error"
**Cause:** Backend error (database, validation, etc.)  
**Fix:** Check backend terminal for error logs

### "401 Unauthorized"
**Cause:** Invalid credentials  
**Fix:** Use correct username/password (admin/admin123)

---

## 📞 Still Having Issues?

1. **Check backend terminal** for error messages
2. **Check browser console** (F12 → Console tab)
3. **Check browser network tab** (F12 → Network tab)
4. **Verify both servers are running** in separate terminals
5. **Restart both servers** (Ctrl+C, then `npm run dev` again)

---

## ✅ Test Commands

**Test backend:**
```bash
curl http://localhost:5000/api/health
```

**Test login (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
```

---

**After fixing, try logging in again!**

