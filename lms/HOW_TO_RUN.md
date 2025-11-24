# 🚀 How to Run the Library Management System

## Quick Start (5 Steps)

### Step 1: Install Dependencies

**Backend:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\backend"
npm install
```

**Frontend:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\frontend"
npm install
```

---

### Step 2: Set Up Database

**1. Make sure PostgreSQL is running**

**2. Create the database:**
```bash
# Open PostgreSQL command line (psql) or use pgAdmin
psql -U postgres

# Then run:
CREATE DATABASE library_management;
\q
```

**3. Initialize database schema:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\backend"
npm run init-db
```

**4. Seed the database (optional - creates sample data):**
```bash
npm run seed
```

---

### Step 3: Configure Environment Variables

**Backend `.env` file** (already created at `lms/backend/.env`):
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
DB_USER=postgres
DB_PASSWORD=Gagan@

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Bcrypt
BCRYPT_SALT_ROUNDS=10
```

**Frontend `.env` file** (create if needed at `lms/frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

---

### Step 4: Start Backend Server

**Open Terminal 1:**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\backend"
npm run dev
```

**Expected output:**
```
🚀 Server is running on port 5000
📝 Environment: development
🔗 API URL: http://localhost:5000/api
```

✅ Backend is running at: **http://localhost:5000**

---

### Step 5: Start Frontend Application

**Open Terminal 2 (new terminal window):**
```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\frontend"
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

✅ Frontend is running at: **http://localhost:3000**

---

## 🎉 Access the Application

1. **Open your browser:** http://localhost:3000
2. **Login with default credentials:**
   - **Admin:** username: `admin`, password: `admin123`
   - **Librarian:** username: `librarian`, password: `librarian123`
   - **Member:** username: `member`, password: `member123`

---

## 📋 Complete Command Sequence

**Copy and paste these commands one by one:**

```bash
# 1. Install backend dependencies
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms\backend"
npm install

# 2. Install frontend dependencies
cd "..\frontend"
npm install

# 3. Initialize database (if not done)
cd "..\backend"
npm run init-db

# 4. Seed database (optional - creates sample data)
npm run seed

# 5. Start backend (Terminal 1)
npm run dev

# 6. Start frontend (Terminal 2 - new terminal)
cd "..\frontend"
npm run dev
```

---

## 🔧 Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- **Backend:** Change `PORT=5000` to `PORT=5001` in `backend/.env`
- **Frontend:** Vite will automatically use the next available port

### Database Connection Error
- Check PostgreSQL is running
- Verify database credentials in `backend/.env`
- Make sure database `library_management` exists

### Module Not Found
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### CORS Errors
- Make sure backend `.env` has: `CORS_ORIGIN=http://localhost:3000`
- Or use the proxy configured in `frontend/vite.config.js`

---

## 📚 API Documentation

Once backend is running, access:
- **Swagger UI:** http://localhost:5000/api-docs
- **API Base URL:** http://localhost:5000/api

---

## 🛑 Stop the Servers

Press `Ctrl + C` in both terminal windows to stop the servers.

---

## ✅ Quick Checklist

- [ ] PostgreSQL is installed and running
- [ ] Database `library_management` is created
- [ ] Backend dependencies installed (`npm install` in backend folder)
- [ ] Frontend dependencies installed (`npm install` in frontend folder)
- [ ] Backend `.env` file is configured
- [ ] Database schema initialized (`npm run init-db`)
- [ ] Database seeded (`npm run seed`)
- [ ] Backend server running (`npm run dev` in backend)
- [ ] Frontend server running (`npm run dev` in frontend)
- [ ] Browser opened to http://localhost:3000

---

## 🎯 Default Login Credentials

After running `npm run seed`:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Librarian | `librarian` | `librarian123` |
| Member | `member` | `member123` |

---

**Need help?** Check the error messages in the terminal and verify all steps above.

