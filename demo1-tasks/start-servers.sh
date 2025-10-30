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

echo -e "${GREEN}Starting Demo 1: Task App Backend (Port 3000)...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!

echo -e "${GREEN}Starting Demo 1: Task App Frontend (Port 4201)...${NC}"
cd frontend && npm run start &
FRONTEND_PID=$!

echo -e "${BLUE}Demo 1 servers are starting up!${NC}"
echo -e "${BLUE}Backend:  http://localhost:3000${NC}"
echo -e "${BLUE}Frontend: http://localhost:4201${NC}"
echo -e "${BLUE}Backend PID: $BACKEND_PID${NC}"
echo -e "${BLUE}Frontend PID: $FRONTEND_PID${NC}"
echo -e "${BLUE}Press Ctrl+C to stop both servers${NC}"

# Wait for both processes
wait
