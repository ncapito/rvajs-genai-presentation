#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down servers...${NC}"
    kill 0
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}Starting Demo 3: Email Generator Backend (Port 3003)...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!

echo -e "${GREEN}Starting Demo 3: Email Generator Frontend (Port 4203)...${NC}"
cd frontend && npm run start &
FRONTEND_PID=$!

echo -e "${BLUE}Demo 3 servers are starting up!${NC}"
echo -e "${BLUE}Backend:  http://localhost:3003${NC}"
echo -e "${BLUE}Frontend: http://localhost:4203${NC}"
echo -e "${BLUE}Backend PID: $BACKEND_PID${NC}"
echo -e "${BLUE}Frontend PID: $FRONTEND_PID${NC}"
echo -e "${BLUE}Press Ctrl+C to stop both servers${NC}"

# Wait for both processes
wait
