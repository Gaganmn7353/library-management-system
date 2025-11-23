@echo off
REM Library Management System - Start Script for Windows
echo Library Management System - Startup Script
echo ==========================================
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo Error: Please run this script from the lms directory
    echo Current directory: %CD%
    echo Expected: C:\Users\gagan\OneDrive\Desktop\Library Management System\lms
    pause
    exit /b 1
)

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
