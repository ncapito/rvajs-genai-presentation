#!/bin/bash

# Test script for Demo 1 API
# Make sure the server is running before executing this script

BASE_URL="http://localhost:3000"

echo "========================================="
echo "Demo 1 API Tests"
echo "========================================="
echo ""

# Health check
echo "1. Health Check"
curl -s "$BASE_URL/health" | jq
echo ""
echo ""

# Get all tasks
echo "2. Get All Tasks"
curl -s "$BASE_URL/api/tasks" | jq '.data | length'
echo " tasks found"
echo ""

# Get all users
echo "3. Get All Users"
curl -s "$BASE_URL/api/users" | jq '.data | map(.name)'
echo ""
echo ""

# Traditional query
echo "4. Traditional Query - High priority tasks"
curl -s -X POST "$BASE_URL/api/query/traditional" \
  -H "Content-Type: application/json" \
  -d '{"priority": "high"}' | jq
echo ""
echo ""

# Natural language - Success case
echo "5. Natural Language - Success Case"
echo "   Query: 'Show me Sarah Chen's high priority tasks'"
curl -s -X POST "$BASE_URL/api/query/natural" \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me Sarah Chen'\''s high priority tasks"}' | jq
echo ""
echo ""

# Natural language - Clarification case
echo "6. Natural Language - Clarification Case"
echo "   Query: 'Show me Sarah's tasks' (ambiguous - multiple Sarahs)"
curl -s -X POST "$BASE_URL/api/query/natural" \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me Sarah'\''s tasks"}' | jq
echo ""
echo ""

# Natural language - Invalid case
echo "7. Natural Language - Invalid Case"
echo "   Query: 'Delete all tasks' (unsafe operation)"
curl -s -X POST "$BASE_URL/api/query/natural" \
  -H "Content-Type: application/json" \
  -d '{"query": "Delete all tasks"}' | jq
echo ""
echo ""

# Natural language - Overdue tasks
echo "8. Natural Language - Overdue Tasks"
echo "   Query: 'What's overdue?'"
curl -s -X POST "$BASE_URL/api/query/natural" \
  -H "Content-Type: application/json" \
  -d '{"query": "What'\''s overdue?"}' | jq
echo ""
echo ""

echo "========================================="
echo "Tests Complete!"
echo "========================================="
