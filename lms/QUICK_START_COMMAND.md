# ⚡ Quick Start - One Command

## 🚀 Run Both Servers with One Command

```bash
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms"
npm run dev
```

**That's it!** This single command will start:
- ✅ Backend server on http://localhost:5000
- ✅ Frontend server on http://localhost:3000

---

## 📋 Complete Setup (First Time Only)

```bash
# 1. Navigate to project root
cd "C:\Users\gagan\OneDrive\Desktop\Library Management System\lms"

# 2. Install root dependencies (concurrently)
npm install

# 3. Install backend dependencies
npm run install:backend

# 4. Install frontend dependencies
npm run install:frontend

# 5. Initialize database
npm run init:db

# 6. Seed database (optional - creates sample data)
npm run seed:db

# 7. Run both servers
npm run dev
```

---

## 🎯 Daily Usage

After initial setup, just run:

```bash
npm run dev
```

---

## 🛑 Stop Servers

Press `Ctrl + C` in the terminal

---

## 📍 Important URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **API Docs:** http://localhost:5000/api-docs

---

## 🔑 Login Credentials

- **Admin:** `admin` / `admin123`
- **Librarian:** `librarian` / `librarian123`
- **Member:** `member` / `member123`

---

## ⚠️ Prerequisites

- ✅ PostgreSQL installed and running
- ✅ Database `library_management` created
- ✅ `backend/.env` configured with database credentials

---

**Enjoy! 🎉**

