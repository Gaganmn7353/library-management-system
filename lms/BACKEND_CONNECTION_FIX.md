# 🔧 Backend Connection Fix - Step by Step

## Problem: "Cannot connect to server"

This guide will help you fix the connection issue step by step.

---

## ✅ Step 1: Verify Backend is Running

### Check if backend is actually running:

**Open a new terminal and run:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\backend"
npm run dev
```

**Expected output:**
```
🚀 Server is running on port 5000
📝 Environment: development
🔗 API URL: http://localhost:5000/api
✅ Health check: http://localhost:5000/api/health
```

**If you see errors instead:**
- Check the error message
- Common errors: Database connection, port in use, missing .env

---

## ✅ Step 2: Test Backend Directly

**Open browser and go to:**
```
http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "status": "OK",
  "message": "Library Management System API is running",
  "timestamp": "...",
  "environment": "development"
}
```

**If this doesn't work:**
- Backend is NOT running
- Go back to Step 1 and fix the startup errors

---

## ✅ Step 3: Check Database Connection

**Common database errors:**

### Error: "password authentication failed"
**Fix:** Check `backend/.env`:
```env
DB_PASSWORD=Gagan@
```

### Error: "database does not exist"
**Fix:** Create the database:
```bash
# In PostgreSQL (psql or pgAdmin)
CREATE DATABASE library_management;
```

### Error: "connection refused"
**Fix:** Make sure PostgreSQL service is running:
```bash
# Windows - Check services
services.msc
# Look for "postgresql" service and make sure it's running
```

---

## ✅ Step 4: Check Port Conflicts

**If port 5000 is already in use:**

**Option 1: Change backend port**
Edit `backend/.env`:
```env
PORT=5001
```

Then update `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001/api
```

**Option 2: Kill the process using port 5000**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

---

## ✅ Step 5: Verify Environment Variables

**Check `backend/.env` exists and has:**
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
DB_USER=postgres
DB_PASSWORD=Gagan@

CORS_ORIGIN=http://localhost:3000

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
```

**Check `frontend/.env` exists and has:**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## ✅ Step 6: Restart Everything

**1. Stop all running servers (Ctrl+C in all terminals)**

**2. Start backend first:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\backend"
npm run dev
```

**Wait for:**
```
🚀 Server is running on port 5000
```

**3. Test backend:**
Open browser: http://localhost:5000/api/health

**4. Start frontend:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\frontend"
npm run dev
```

**5. Try login again**

---

## ✅ Step 7: Use Single Command (Recommended)

**From root directory:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms"
npm run dev
```

This starts both servers. Watch for any errors in the terminal.

---

## 🔍 Debugging Checklist

- [ ] Backend terminal shows "Server is running on port 5000"
- [ ] http://localhost:5000/api/health works in browser
- [ ] PostgreSQL service is running
- [ ] Database `library_management` exists
- [ ] `backend/.env` has correct database password
- [ ] `frontend/.env` has `VITE_API_URL=http://localhost:5000/api`
- [ ] No port conflicts (5000 and 3000 are free)
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows the request to `/api/auth/login`

---

## 🐛 Common Errors & Fixes

### "ECONNREFUSED" or "Cannot connect"
**Cause:** Backend not running  
**Fix:** Start backend server

### "CORS policy" error
**Cause:** CORS misconfiguration  
**Fix:** Check `CORS_ORIGIN=http://localhost:3000` in `backend/.env`

### "password authentication failed"
**Cause:** Wrong database password  
**Fix:** Update `DB_PASSWORD` in `backend/.env`

### "database does not exist"
**Cause:** Database not created  
**Fix:** Run `CREATE DATABASE library_management;` in PostgreSQL

### "Port 5000 already in use"
**Cause:** Another process using port 5000  
**Fix:** Change PORT in `.env` or kill the process

---

## 📞 Still Not Working?

**1. Check backend terminal for errors**
- Look for red error messages
- Database connection errors
- Port conflicts

**2. Check browser console (F12)**
- Network tab → Look for failed requests
- Console tab → Look for error messages

**3. Test backend directly:**
```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
```

**4. Verify both servers are running:**
- Backend: http://localhost:5000/api/health
- Frontend: http://localhost:3000

---

## ✅ Quick Fix Command Sequence

```bash
# 1. Stop everything (Ctrl+C)

# 2. Check database is running
# (Open services.msc and verify PostgreSQL is running)

# 3. Start backend
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\backend"
npm run dev

# 4. In new terminal, start frontend
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\frontend"
npm run dev

# 5. Test in browser
# http://localhost:5000/api/health
# http://localhost:3000
```

---

**After following these steps, the connection should work! 🎉**

