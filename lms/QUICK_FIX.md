# ⚡ Quick Fix for Connection Errors

## 🚨 Immediate Fix Steps

### Step 1: Stop Everything
Press `Ctrl + C` in all terminal windows to stop all servers.

---

### Step 2: Start Backend First

**Open Terminal 1:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\backend"
npm run dev
```

**Wait for this message:**
```
🚀 Server is running on port 5000
✅ Health check: http://localhost:5000/api/health
```

**If you see errors:**
- **Database error:** Check PostgreSQL is running and `backend/.env` has correct password
- **Port error:** Change `PORT=5001` in `backend/.env`

---

### Step 3: Test Backend

**Open browser and go to:**
```
http://localhost:5000/api/health
```

**You should see:**
```json
{
  "status": "OK",
  "message": "Library Management System API is running"
}
```

**If this doesn't work:** Backend is not running correctly. Check the terminal for errors.

---

### Step 4: Start Frontend

**Open Terminal 2 (new terminal):**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\frontend"
npm run dev
```

**Wait for:**
```
➜  Local:   http://localhost:3000/
```

---

### Step 5: Try Login Again

1. Open browser: http://localhost:3000
2. Try logging in with: `admin` / `admin123`

---

## 🔧 Common Issues & Quick Fixes

### Issue 1: "Backend not running"
**Fix:**
```bash
cd backend
npm run dev
```

### Issue 2: "Database connection error"
**Fix:**
1. Check PostgreSQL service is running
2. Verify `backend/.env` has: `DB_PASSWORD=Gagan@`
3. Make sure database exists: `CREATE DATABASE library_management;`

### Issue 3: "Port 5000 in use"
**Fix:**
```bash
# Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue 4: "CORS error"
**Fix:**
Make sure `backend/.env` has:
```env
CORS_ORIGIN=http://localhost:3000
```

---

## ✅ Use Single Command (After First Setup)

**From root directory:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms"
npm run dev
```

This starts both servers automatically!

---

## 🧪 Test Connection

**Run the test script:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms"
node test-connection.js
```

This will tell you exactly what's wrong.

---

## 📋 Checklist

Before trying to login, make sure:

- [ ] Backend terminal shows "Server is running on port 5000"
- [ ] http://localhost:5000/api/health works in browser
- [ ] Frontend terminal shows "Local: http://localhost:3000/"
- [ ] No errors in either terminal
- [ ] PostgreSQL service is running

---

**Follow these steps and the connection should work! 🎉**

