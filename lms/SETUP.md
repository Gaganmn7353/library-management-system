# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm run install:all

# Or install separately:
npm run install:backend
npm run install:frontend
```

### 2. Initialize Database

```bash
# Initialize the database schema
npm run init:db

# Seed the database with sample data
npm run seed:db
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
npm run start:backend
# Or for development with auto-reload:
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run start:frontend
# Or for development:
npm run dev:frontend
```

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### 5. Login

Use these credentials to login:

**Admin:**
- Username: `admin`
- Password: `admin123`

**Librarian:**
- Username: `librarian`
- Password: `librarian123`

## Manual Setup

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Initialize database:
```bash
npm run init-db
```

4. Seed database:
```bash
npm run seed
```

5. Start server:
```bash
npm start
# or for development:
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## Troubleshooting

### Database Issues

If you encounter database errors:

1. Delete the existing database file:
```bash
rm backend/library.db
```

2. Reinitialize:
```bash
cd backend
npm run init-db
npm run seed
```

### Port Already in Use

If port 5000 or 3000 is already in use:

1. **Backend:** Change `PORT` in `backend/.env` or `backend/server.js`
2. **Frontend:** Update `vite.config.js` to use a different port

### CORS Errors

If you see CORS errors, ensure:
- Backend is running on port 5000
- Frontend is running on port 3000
- CORS is properly configured in `backend/server.js`

## Production Build

### Build Frontend

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

### Run Backend in Production

```bash
cd backend
npm start
```

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
SESSION_SECRET=your-secret-key-change-in-production
NODE_ENV=production
```

**Important:** Change `SESSION_SECRET` to a random string in production!
