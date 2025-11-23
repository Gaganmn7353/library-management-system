# Quick Start Guide - Library Management System

## 🚀 5-Step Quick Start

### Step 1: Install Dependencies

```bash
cd "Library Management System/lms"
npm run install:all
```

### Step 2: Configure Environment

```bash
cd backend

# Windows
notepad .env

# Mac/Linux
nano .env
```

**Update `DB_PASSWORD` with your PostgreSQL password**

### Step 3: Initialize Database

```bash
# Make sure PostgreSQL is running first!
npm run init-db
```

### Step 4: Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

### Step 5: Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

## ✅ Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Docs**: http://localhost:5000/api-docs

## 🎯 One-Command Start (After Initial Setup)

### Windows:
```bash
cd "Library Management System/lms"
run-project.bat
```

### Mac/Linux:
```bash
cd "Library Management System/lms"
chmod +x run-project.sh
./run-project.sh
```

## ⚠️ Prerequisites

1. **Node.js** v18+ installed
2. **PostgreSQL** installed and running
3. **PostgreSQL password** configured in `.env`

## 🔧 Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify password in `.env`
- Test: `psql -U postgres -d library_management`

### Port Already in Use
- Kill process on port 5000 or 5173
- Or change ports in `.env` and `vite.config.js`

### Module Not Found
```bash
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

## 📝 Default Test Credentials

After running `npm run seed` in backend:
- Check `backend/seed.js` for default admin/librarian credentials

