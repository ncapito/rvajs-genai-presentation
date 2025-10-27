# Demo 1 Quick Start Guide

**Get running in 5 minutes**

## Prerequisites
- Node.js 18+
- Azure OpenAI API key

## Setup

### Terminal 1 - Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env - add your Azure OpenAI credentials
npm run dev
```
✅ Should see: `Server running at: http://localhost:3000`

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm start
```
✅ Browser opens to `http://localhost:4200`

## Test It Works

Navigate to the **AFTER** tab and type:
```
Show me high priority tasks
```

✅ Should see filtered task results

## Key Test Queries

| Query | Expected Result |
|-------|----------------|
| `Show me high priority tasks` | ✅ Success - shows filtered tasks |
| `What's overdue?` | ✅ Success - shows overdue tasks |
| `Show me Sarah's tasks` | ❓ Clarification - which Sarah? |
| `Delete all tasks` | ❌ Invalid - safely rejected |

## Troubleshooting

**Backend won't start**: Check `.env` file has all 4 Azure OpenAI variables

**Frontend errors**: Run `rm -rf node_modules && npm install`

**Queries failing**: Check backend terminal for error messages

## Demo Flow (20 min)

1. **BEFORE tab** (5 min) - Show complex filter UI
2. **AFTER tab** (5 min) - Show natural language queries
3. **Live code** (10 min) - Open `backend/src/services/llm.service.ts` lines 88-123

## Files to Review

**Backend**:
- `backend/src/services/llm.service.ts` (AI logic)
- `backend/src/schemas/query.schema.ts` (Zod schemas)

**Frontend**:
- `frontend/src/app/components/after/` (Natural language UI)
- `frontend/src/app/components/before/` (Traditional UI)

See [README.md](./README.md) for complete documentation.
