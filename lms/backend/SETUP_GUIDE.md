# Library Management System - Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **PostgreSQL** (v12 or higher)
   - Download from: https://www.postgresql.org/download/
   - Verify: `psql --version`

3. **npm** (comes with Node.js)
   - Verify: `npm --version`

## Quick Start (5 Steps)

### Step 1: Install Dependencies

```bash
# Navigate to project root
cd "Library Management System/lms"

# Install all dependencies (backend + frontend)
npm run install:all
```

### Step 2: Configure Environment

```bash
# Navigate to backend
cd backend

# Copy .env.example to .env (if not exists)
# Edit .env and update database password
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Important**: Update `DB_PASSWORD` in `.env` with your PostgreSQL password.

### Step 3: Create and Initialize Database

```bash
# Make sure PostgreSQL is running
# Windows: Check Services
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Create database and run schema
npm run init-db
```

### Step 4: Seed Initial Data (Optional)

```bash
npm run seed
```

### Step 5: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/api/health

## Detailed Setup Instructions

### 1. Database Setup

#### Create PostgreSQL Database Manually (Alternative)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE library_management;

# Exit psql
\q
```

#### Run Schema

```bash
cd backend
npm run init-db
```

### 2. Environment Configuration

The `.env` file should contain:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_management
DB_USER=postgres
DB_PASSWORD=your_actual_password
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

### 3. Verify Installation

```bash
# Check Node.js
node --version

# Check PostgreSQL
psql --version

# Check if database exists
psql -U postgres -l | grep library_management
```

## Troubleshooting

### Database Connection Error

**Error**: `Connection refused` or `password authentication failed`

**Solution**:
1. Verify PostgreSQL is running
2. Check password in `.env` file
3. Verify database exists: `psql -U postgres -l`
4. Test connection: `psql -U postgres -d library_management`

### Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**:
```bash
# Windows: Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Mac/Linux: Find and kill process
lsof -ti:5000 | xargs kill -9
```

### Module Not Found

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend Can't Connect to Backend

**Error**: CORS error or connection refused

**Solution**:
1. Verify backend is running on port 5000
2. Check `CORS_ORIGIN` in `.env` matches frontend URL
3. Verify frontend API URL in `frontend/src/utils/api.js`

## Default Credentials

After seeding, you can use:

- **Admin**: Check seed.js for admin credentials
- **Librarian**: Check seed.js for librarian credentials
- **Member**: Register a new account

## Project Structure

```
lms/
├── backend/          # Node.js/Express backend
│   ├── src/         # Source code
│   ├── server.js    # Entry point
│   └── .env         # Environment variables
├── frontend/        # React/Vite frontend
│   ├── src/         # Source code
│   └── package.json
└── package.json     # Root package.json
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

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update `CORS_ORIGIN` to production URL
3. Use strong JWT secrets
4. Enable SSL for database if needed
5. Build frontend: `cd frontend && npm run build`
6. Serve frontend build with a web server

## Support

For issues:
- Check logs in `backend/logs/`
- Review API documentation at `/api-docs`
- Check database connection
- Verify environment variables

