# 🚀 Single Command Start - Library Management System

## Quick Start

### First Time Setup (Run Once)

```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms"
npm run install-all
```

This will install:
- ✅ Root dependencies (concurrently)
- ✅ Backend dependencies
- ✅ Frontend dependencies

---

### Daily Usage - Start Everything

```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms"
npm run dev
```

**That's it!** This single command starts:
- ✅ **Backend** server on http://localhost:5000
- ✅ **Frontend** server on http://localhost:3000

---

## 📋 Complete Setup Steps

### Step 1: Install All Dependencies
```bash
npm run install-all
```

### Step 2: Initialize Database (First Time Only)
```bash
npm run init:db
```

### Step 3: Seed Database (Optional - Creates Sample Data)
```bash
npm run seed:db
```

### Step 4: Start Both Servers
```bash
npm run dev
```

---

## 🎯 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend servers |
| `npm run backend` | Start only backend server |
| `npm run frontend` | Start only frontend server |
| `npm run install-all` | Install all dependencies (root, backend, frontend) |
| `npm run init:db` | Initialize database schema |
| `npm run seed:db` | Seed database with sample data |
| `npm run build:frontend` | Build frontend for production |

---

## 📺 What You'll See

When you run `npm run dev`, you'll see colored output:

```
[BACKEND] 🚀 Server is running on port 5000
[BACKEND] 📝 Environment: development
[BACKEND] 🔗 API URL: http://localhost:5000/api
[FRONTEND] VITE v5.x.x  ready in xxx ms
[FRONTEND] ➜  Local:   http://localhost:3000/
```

- **Blue text** = Backend logs
- **Green text** = Frontend logs

---

## 🛑 Stop Servers

Press `Ctrl + C` in the terminal to stop both servers.

---

## 📍 Important URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **API Documentation:** http://localhost:5000/api-docs
- **Health Check:** http://localhost:5000/api/health

---

## 🔑 Default Login Credentials

After running `npm run seed:db`:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Librarian | `librarian` | `librarian123` |
| Member | `member` | `member123` |

---

## ⚠️ Prerequisites

Before running `npm run dev`, make sure:

- ✅ **PostgreSQL is installed and running** (as a Windows service)
- ✅ **Database `library_management` is created**
- ✅ **Backend `.env` file is configured** with database credentials
- ✅ **All dependencies are installed** (`npm run install-all`)

---

## 🔧 Troubleshooting

### "concurrently not found"
```bash
npm install
```

### "Port already in use"
- Backend (5000): Change `PORT=5000` in `backend/.env`
- Frontend (3000): Vite will automatically use next available port

### "Database connection error"
- Check PostgreSQL service is running
- Verify `backend/.env` has correct credentials:
  ```env
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=library_management
  DB_USER=postgres
  DB_PASSWORD=your_password
  ```

### "Module not found"
```bash
npm run install-all
```

---

## 📁 Project Structure

```
lms/
├── package.json          ← Root package.json (this file)
├── backend/
│   ├── package.json
│   ├── .env
│   └── src/
├── frontend/
│   ├── package.json
│   ├── .env
│   └── src/
└── README.md
```

---

## ✅ Quick Checklist

- [ ] PostgreSQL service is running
- [ ] Database `library_management` exists
- [ ] `backend/.env` is configured
- [ ] Dependencies installed (`npm run install-all`)
- [ ] Database initialized (`npm run init:db`)
- [ ] Database seeded (`npm run seed:db`)
- [ ] Ready to run: `npm run dev`

---

**Enjoy your Library Management System! 🎉**

