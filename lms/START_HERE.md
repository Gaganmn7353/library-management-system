# 🚀 START HERE - Library Management System

## ⚡ Quick Start (Copy-Paste Ready)

### Windows Users:

```powershell
# 1. Navigate to project
cd "Library Management System\lms"

# 2. Install all dependencies
npm run install:all

# 3. Edit backend/.env and update DB_PASSWORD
notepad backend\.env

# 4. Make sure PostgreSQL is running, then initialize database
cd backend
npm run init-db

# 5. Start the application (use automated script)
cd ..
run-project.bat
```

### Mac/Linux Users:

```bash
# 1. Navigate to project
cd "Library Management System/lms"

# 2. Install all dependencies
npm run install:all

# 3. Edit backend/.env and update DB_PASSWORD
nano backend/.env

# 4. Make sure PostgreSQL is running, then initialize database
cd backend
npm run init-db

# 5. Start the application (use automated script)
cd ..
chmod +x run-project.sh
./run-project.sh
```

## 📝 Step-by-Step Instructions

### Step 1: Prerequisites Check

```bash
# Check Node.js (should be v18+)
node --version

# Check npm
npm --version

# Check PostgreSQL
psql --version
```

**If any are missing**, install them first:
- Node.js: https://nodejs.org/
- PostgreSQL: https://www.postgresql.org/download/

### Step 2: Install Dependencies

```bash
cd "Library Management System/lms"
npm run install:all
```

**This installs**:
- Backend dependencies (Express, PostgreSQL, etc.)
- Frontend dependencies (React, Vite, etc.)

**Time**: 2-5 minutes

### Step 3: Configure Environment

```bash
cd backend

# Windows
notepad .env

# Mac/Linux
nano .env
```

**Update these values**:
```env
DB_PASSWORD=your_postgresql_password_here
JWT_SECRET=generate-a-random-string-here
JWT_REFRESH_SECRET=generate-another-random-string-here
```

**Save and close**

### Step 4: Start PostgreSQL

**Windows**:
- Press `Win+R`, type `services.msc`
- Find "PostgreSQL" service
- Right-click → Start (if stopped)

**Mac**:
```bash
brew services start postgresql
```

**Linux**:
```bash
sudo systemctl start postgresql
```

### Step 5: Initialize Database

```bash
# Make sure you're in backend directory
cd backend

# Create database and tables
npm run init-db
```

**Expected output**:
```
✅ Connected to PostgreSQL
📦 Creating database: library_management...
✅ Database 'library_management' created successfully
✅ Schema executed successfully
🎉 Database initialization completed successfully!
```

### Step 6: Start Application

**Option A: Automated (Recommended)**

**Windows**:
```bash
cd "Library Management System/lms"
run-project.bat
```

**Mac/Linux**:
```bash
cd "Library Management System/lms"
chmod +x run-project.sh
./run-project.sh
```

**Option B: Manual (Two Terminals)**

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

## ✅ Verify Installation

Once both servers are running, open:

1. **Frontend**: http://localhost:5173
2. **Backend API**: http://localhost:5000/api
3. **API Docs**: http://localhost:5000/api-docs
4. **Health Check**: http://localhost:5000/api/health

## 🎯 What to Do Next

1. ✅ Open http://localhost:5173 in your browser
2. ✅ Register a new account or use seeded credentials
3. ✅ Explore the API documentation
4. ✅ Test the application features

## 🆘 Common Issues

### Database Connection Failed

```bash
# Test PostgreSQL connection
psql -U postgres -d library_management

# If it fails, check:
# 1. PostgreSQL is running
# 2. Password in .env is correct
# 3. Database exists: psql -U postgres -l
```

### Port Already in Use

**Windows**:
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Mac/Linux**:
```bash
lsof -ti:5000 | xargs kill -9
```

### Module Not Found

```bash
# Backend
cd backend
rm -rf node_modules
npm install

# Frontend
cd frontend
rm -rf node_modules
npm install
```

## 📚 Documentation

- **Complete Setup**: See `README_SETUP.md`
- **Quick Reference**: See `QUICK_START.md`
- **API Documentation**: http://localhost:5000/api-docs

## 🎉 Success!

If you see both servers running and can access the frontend, you're all set!

**Backend running**: ✅
**Frontend running**: ✅
**Database connected**: ✅

---

**Need Help?** Check `README_SETUP.md` for detailed troubleshooting.

