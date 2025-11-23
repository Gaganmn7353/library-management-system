#!/bin/bash

# Library Management System - Automated Run Script
# This script sets up and runs the entire project

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directories
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
ROOT_DIR=$(pwd)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Library Management System - Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18 or higher.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm found: $(npm --version)${NC}"

if ! command_exists psql; then
    echo -e "${YELLOW}⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed.${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL client found${NC}"
fi

# Check if .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f "$BACKEND_DIR/.env.example" ]; then
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        echo -e "${YELLOW}⚠️  Please edit $BACKEND_DIR/.env and update DB_PASSWORD${NC}"
        read -p "Press Enter after updating .env file..."
    else
        echo -e "${RED}❌ .env.example not found. Please create .env manually.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd "$BACKEND_DIR"
    npm install
    cd "$ROOT_DIR"
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd "$FRONTEND_DIR"
    npm install
    cd "$ROOT_DIR"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

# Check database
echo -e "\n${YELLOW}Checking database...${NC}"
cd "$BACKEND_DIR"
source .env 2>/dev/null || true

# Try to connect to database
if command_exists psql; then
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c '\q' 2>/dev/null; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
        
        # Check if database exists
        DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")
        
        if [ "$DB_EXISTS" != "1" ]; then
            echo -e "${YELLOW}⚠️  Database '$DB_NAME' does not exist. Initializing...${NC}"
            npm run init-db
        else
            echo -e "${GREEN}✅ Database '$DB_NAME' exists${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not connect to database. Please check your .env settings.${NC}"
        echo -e "${YELLOW}⚠️  Continuing anyway...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL client not available. Skipping database check.${NC}"
fi

cd "$ROOT_DIR"

# Start servers
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Starting servers...${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}Backend will start on: http://localhost:5000${NC}"
echo -e "${GREEN}Frontend will start on: http://localhost:5173${NC}"
echo -e "${GREEN}API Docs will be at: http://localhost:5000/api-docs${NC}\n"

echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
cd "$BACKEND_DIR"
npm run dev &
BACKEND_PID=$!
cd "$ROOT_DIR"

# Wait a bit for backend to start
sleep 3

# Start frontend
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
cd "$ROOT_DIR"

# Wait for processes
wait

