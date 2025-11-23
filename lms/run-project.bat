@echo off
REM Library Management System - Automated Run Script for Windows
REM This script sets up and runs the entire project

setlocal enabledelayedexpansion

echo ========================================
echo Library Management System - Setup
echo ========================================
echo.

REM Project directories
set BACKEND_DIR=backend
set FRONTEND_DIR=frontend
set ROOT_DIR=%~dp0

REM Check prerequisites
echo Checking prerequisites...

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%

REM Check if .env exists
if not exist "%BACKEND_DIR%\.env" (
    echo [WARNING] .env file not found. Creating from .env.example...
    if exist "%BACKEND_DIR%\.env.example" (
        copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
        echo [WARNING] Please edit %BACKEND_DIR%\.env and update DB_PASSWORD
        pause
    ) else (
        echo [ERROR] .env.example not found. Please create .env manually.
        pause
        exit /b 1
    )
) else (
    echo [OK] .env file exists
)

REM Install dependencies
echo.
echo Installing dependencies...

if not exist "%BACKEND_DIR%\node_modules" (
    echo Installing backend dependencies...
    cd "%BACKEND_DIR%"
    call npm install
    cd "%ROOT_DIR%"
) else (
    echo [OK] Backend dependencies already installed
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    cd "%FRONTEND_DIR%"
    call npm install
    cd "%ROOT_DIR%"
) else (
    echo [OK] Frontend dependencies already installed
)

REM Check database (optional)
echo.
echo Checking database...
cd "%BACKEND_DIR%"
where psql >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL client found
    echo [INFO] Database will be initialized if needed when backend starts
) else (
    echo [WARNING] PostgreSQL client not found. Make sure PostgreSQL is installed.
)
cd "%ROOT_DIR%"

REM Start servers
echo.
echo ========================================
echo Starting servers...
echo ========================================
echo.
echo Backend will start on: http://localhost:5000
echo Frontend will start on: http://localhost:5173
echo API Docs will be at: http://localhost:5000/api-docs
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start backend in new window
start "LMS Backend" cmd /k "cd /d %BACKEND_DIR% && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "LMS Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo [OK] Servers started in separate windows
echo [INFO] Close the windows or press Ctrl+C in each to stop the servers
echo.
pause

