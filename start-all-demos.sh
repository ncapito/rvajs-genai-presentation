#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down all demo servers...${NC}"
    kill 0
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo -e "${YELLOW}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║                                                       ║${NC}"
echo -e "${YELLOW}║        Starting All GenAI Presentation Demos         ║${NC}"
echo -e "${YELLOW}║                                                       ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Start Demo 1
echo -e "${GREEN}Starting Demo 1: Task App (Natural Language Querying)${NC}"
echo -e "${BLUE}  Backend:  http://localhost:3000${NC}"
echo -e "${BLUE}  Frontend: http://localhost:4201${NC}"
(cd demo1-tasks/backend && npm run dev) &
(cd demo1-tasks/frontend && npm run start) &
echo ""

# Start Demo 2
echo -e "${GREEN}Starting Demo 2: Receipt Parsing (Vision + Structured Output)${NC}"
echo -e "${BLUE}  Backend:  http://localhost:3001${NC}"
echo -e "${BLUE}  Frontend: http://localhost:4202${NC}"
(cd demo2-receipts/backend && npm run dev) &
(cd demo2-receipts/frontend && npm run start) &
echo ""

# Start Demo 3
echo -e "${GREEN}Starting Demo 3: Email Generator (RAG + Personalization)${NC}"
echo -e "${BLUE}  Backend:  http://localhost:3003${NC}"
echo -e "${BLUE}  Frontend: http://localhost:4203${NC}"
(cd demo3-email-generator/backend && npm run dev) &
(cd demo3-email-generator/frontend && npm run start) &
echo ""

echo -e "${YELLOW}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║                                                       ║${NC}"
echo -e "${YELLOW}║              All Demos Are Starting Up!              ║${NC}"
echo -e "${YELLOW}║                                                       ║${NC}"
echo -e "${YELLOW}║  Demo 1: http://localhost:4201  (Backend: 3000)      ║${NC}"
echo -e "${YELLOW}║  Demo 2: http://localhost:4202  (Backend: 3001)      ║${NC}"
echo -e "${YELLOW}║  Demo 3: http://localhost:4203  (Backend: 3003)      ║${NC}"
echo -e "${YELLOW}║                                                       ║${NC}"
echo -e "${YELLOW}║         Press Ctrl+C to stop all servers             ║${NC}"
echo -e "${YELLOW}║                                                       ║${NC}"
echo -e "${YELLOW}╚═══════════════════════════════════════════════════════╝${NC}"

# Wait for all processes
wait
