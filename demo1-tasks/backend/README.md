# Demo 1 Backend - Natural Language Task Querying

Backend API for demonstrating the power of natural language query parsing with LLMs.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Azure OpenAI credentials:
```bash
cp .env.example .env
```

3. Edit `.env` with your Azure OpenAI configuration:
```
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview
PORT=3000
```

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### GET /health
Health check endpoint

### GET /api/tasks
Get all tasks

### GET /api/users
Get all users

### POST /api/query/traditional
**BEFORE implementation** - Traditional structured query

Request body:
```json
{
  "assignee": "John",
  "status": "todo",
  "priority": "high"
}
```

### POST /api/query/natural
**AFTER implementation** - Natural language query with LLM

Request body:
```json
{
  "query": "Show me Sarah's high priority tasks"
}
```

## Example Queries

### Success Cases
```bash
# High priority tasks for Sarah Chen
curl -X POST http://localhost:3000/api/query/natural \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me Sarah Chen'\''s high priority tasks"}'

# Overdue tasks
curl -X POST http://localhost:3000/api/query/natural \
  -H "Content-Type: application/json" \
  -d '{"query": "What'\''s overdue?"}'

# In-progress items
curl -X POST http://localhost:3000/api/query/natural \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me in progress items"}'
```

### Clarification Case
```bash
# Ambiguous name (multiple Sarahs)
curl -X POST http://localhost:3000/api/query/natural \
  -H "Content-Type: application/json" \
  -d '{"query": "Show me Sarah'\''s tasks"}'
```

Expected response:
```json
{
  "success": true,
  "needsClarification": true,
  "message": "I found multiple users named \"Sarah\". Which one did you mean?",
  "suggestions": ["Sarah Chen", "Sarah Williams"]
}
```

### Invalid Case
```bash
# Unsafe request
curl -X POST http://localhost:3000/api/query/natural \
  -H "Content-Type: application/json" \
  -d '{"query": "Delete all tasks"}'
```

Expected response:
```json
{
  "success": false,
  "error": "I can only search and filter tasks, not modify or delete them"
}
```

## Architecture

- **schemas/** - Zod schemas for validation
  - `task.schema.ts` - Task and User data structures
  - `query.schema.ts` - Query structures with discriminated unions

- **services/** - Business logic
  - `data.service.ts` - Traditional data filtering (BEFORE)
  - `llm.service.ts` - Natural language parsing (AFTER)

- **routes/** - API endpoints
  - `tasks.routes.ts` - All task-related endpoints
