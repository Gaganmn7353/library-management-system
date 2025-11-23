# Library Management System - Complete Setup Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (5 Steps)](#quick-start-5-steps)
3. [Detailed Setup](#detailed-setup)
4. [Automated Scripts](#automated-scripts)
5. [Manual Setup](#manual-setup)
6. [Troubleshooting](#troubleshooting)
7. [Project Structure](#project-structure)

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`
   - Should output: `v18.x.x` or higher

2. **PostgreSQL** (v12 or higher)
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`
   - **Important**: Remember your PostgreSQL password!

3. **npm** (comes with Node.js)
   - Verify: `npm --version`

### System Requirements

- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: 500MB free space

## Quick Start (5 Steps)

### Step 1: Install Dependencies

```bash
# Navigate to project root
cd "Library Management System/lms"

# Install all dependencies
npm run install:all
```

**Expected time**: 2-5 minutes

### Step 2: Configure Environment

```bash
# Navigate to backend
cd backend

# Windows: Open .env in notepad
notepad .env

# Mac/Linux: Open .env in nano
nano .env
```

**Update these values**:
- `DB_PASSWORD`: Your PostgreSQL password
- `JWT_SECRET`: Generate a random string (keep it secret!)
- `JWT_REFRESH_SECRET`: Generate another random string

**Save and close the file**

### Step 3: Start PostgreSQL

**Windows**:
- Open Services (Win+R → `services.msc`)
- Find "PostgreSQL" service
- Right-click → Start (if not running)

**Mac**:
```bash
brew services start postgresql
```

**Linux**:
```bash
sudo systemctl start postgresql
```

### Step 4: Initialize Database

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

### Step 5: Start the Application

**Option A: Automated Script (Recommended)**

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

**Option B: Manual Start**

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

## Access the Application

Once both servers are running:

- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:5000/api
- 📚 **API Documentation**: http://localhost:5000/api-docs
- ❤️ **Health Check**: http://localhost:5000/api/health

## Detailed Setup

### 1. Database Setup

#### Create Database Manually (Alternative)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE library_management;

# Exit
\q
```

#### Verify Database

```bash
# List all databases
psql -U postgres -l

# Should see 'library_management' in the list
```

### 2. Environment Variables

The `.env` file contains:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
DB_USER=postgres
DB_PASSWORD=your_password_here  # ⚠️ CHANGE THIS!

# JWT Secrets (generate random strings)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Seed Initial Data (Optional)

```bash
cd backend
npm run seed
```

This creates:
- Default admin user
- Sample books
- Sample members

## Automated Scripts

### Windows: `run-project.bat`

This script:
- ✅ Checks prerequisites
- ✅ Installs dependencies
- ✅ Checks database
- ✅ Starts backend in new window
- ✅ Starts frontend in new window

**Usage**:
```bash
cd "Library Management System/lms"
run-project.bat
```

### Mac/Linux: `run-project.sh`

This script:
- ✅ Checks prerequisites
- ✅ Installs dependencies
- ✅ Checks database connection
- ✅ Initializes database if needed
- ✅ Starts both servers

**Usage**:
```bash
cd "Library Management System/lms"
chmod +x run-project.sh
./run-project.sh
```

## Manual Setup

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env and update DB_PASSWORD
# Windows: notepad .env
# Mac/Linux: nano .env

# Initialize database
npm run init-db

# Start server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Troubleshooting

### ❌ Database Connection Error

**Error**: `Connection refused` or `password authentication failed`

**Solutions**:
1. Verify PostgreSQL is running
   ```bash
   # Windows: Check Services
   # Mac: brew services list
   # Linux: sudo systemctl status postgresql
   ```

2. Check password in `.env`
   ```bash
   # Test connection
   psql -U postgres -d library_management
   ```

3. Verify database exists
   ```bash
   psql -U postgres -l | grep library_management
   ```

### ❌ Port Already in Use

**Error**: `Port 5000 is already in use`

**Solutions**:

**Windows**:
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Mac/Linux**:
```bash
# Find and kill process
lsof -ti:5000 | xargs kill -9
```

**Or change port** in `.env`:
```env
PORT=5001
```

### ❌ Module Not Found

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### ❌ Frontend Can't Connect to Backend

**Error**: CORS error or connection refused

**Solutions**:
1. Verify backend is running on port 5000
2. Check `CORS_ORIGIN` in `.env` matches frontend URL
3. Verify frontend API URL in `frontend/src/utils/api.js`

### ❌ Permission Denied (Mac/Linux)

**Error**: `Permission denied` when running scripts

**Solution**:
```bash
chmod +x run-project.sh
```

### ❌ Database Schema Errors

**Error**: `relation "users" does not exist`

**Solution**:
```bash
cd backend
npm run init-db
```

## Project Structure

```
lms/
├── backend/                 # Node.js/Express Backend
│   ├── src/                # Source code
│   │   ├── app.js         # Express app
│   │   ├── config/        # Configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/         # API routes
│   │   └── middleware/     # Custom middleware
│   ├── server.js          # Entry point
│   ├── schema.sql         # Database schema
│   ├── init-db-postgres.js # Database init script
│   ├── .env               # Environment variables
│   └── package.json
│
├── frontend/              # React/Vite Frontend
│   ├── src/              # Source code
│   │   ├── pages/        # React pages
│   │   ├── components/   # React components
│   │   └── utils/        # Utilities
│   └── package.json
│
├── run-project.sh        # Mac/Linux run script
├── run-project.bat       # Windows run script
└── package.json          # Root package.json
```

## Development Commands

### Backend

```bash
cd backend

npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server
npm run init-db      # Initialize database
npm run seed         # Seed initial data
npm test             # Run tests
```

### Frontend

```bash
cd frontend

npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Next Steps

1. ✅ Verify both servers are running
2. ✅ Open http://localhost:5173 in browser
3. ✅ Register a new account or use seeded credentials
4. ✅ Explore the API documentation at http://localhost:5000/api-docs
5. ✅ Test the application features

## Support

- 📖 Check `SETUP_GUIDE.md` for detailed instructions
- 📖 Check `QUICK_START.md` for quick reference
- 📖 Review API documentation at `/api-docs`
- 📖 Check backend logs in `backend/logs/`

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update `CORS_ORIGIN` to production URL
3. Use strong, random JWT secrets
4. Enable SSL for database if needed
5. Build frontend: `cd frontend && npm run build`
6. Serve frontend build with nginx/apache

---

**Happy Coding! 🚀**

