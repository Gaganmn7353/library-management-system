# 🚀 Quick Start - Run Everything with One Command

## Single Command to Run Both Servers

From the root directory (`lms`), run:

```bash
npm run dev
```

This will start:
- ✅ **Backend** on http://localhost:5000
- ✅ **Frontend** on http://localhost:3000

---

## First Time Setup

If you haven't installed dependencies yet:

```bash
# Install root dependencies (includes concurrently)
npm install

# Install backend dependencies
npm run install:backend

# Install frontend dependencies
npm run install:frontend
```

---

## Prerequisites Before Running

1. **PostgreSQL is running**
2. **Database is created:**
   ```bash
   npm run init:db
   ```
3. **Database is seeded (optional):**
   ```bash
   npm run seed:db
   ```
4. **Environment variables configured:**
   - `backend/.env` - Database and server config
   - `frontend/.env` - API URL (optional)

---

## Usage

### Start Both Servers
```bash
npm run dev
```

### Start Only Backend
```bash
npm run dev:backend
```

### Start Only Frontend
```bash
npm run dev:frontend
```

### Stop Servers
Press `Ctrl + C` in the terminal

---

## What You'll See

When you run `npm run dev`, you'll see output like:

```
[BACKEND] 🚀 Server is running on port 5000
[BACKEND] 📝 Environment: development
[BACKEND] 🔗 API URL: http://localhost:5000/api
[FRONTEND] VITE v5.x.x  ready in xxx ms
[FRONTEND] ➜  Local:   http://localhost:3000/
```

The prefixes `[BACKEND]` and `[FRONTEND]` help you identify which server is logging.

---

## Troubleshooting

### "concurrently not found"
Run: `npm install` in the root directory

### Port already in use
- Backend (5000): Change `PORT=5000` in `backend/.env`
- Frontend (3000): Vite will auto-use next available port

### Database connection error
- Check PostgreSQL is running
- Verify `backend/.env` has correct database credentials

---

## Access the Application

1. **Frontend:** http://localhost:3000
2. **Backend API:** http://localhost:5000/api
3. **API Docs:** http://localhost:5000/api-docs

**Login Credentials:**
- Admin: `admin` / `admin123`
- Librarian: `librarian` / `librarian123`
- Member: `member` / `member123`

---

**That's it! One command to rule them all! 🎉**

