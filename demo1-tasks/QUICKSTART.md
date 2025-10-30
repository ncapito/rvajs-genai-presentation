# Demo 1 Quick Start Guide

Get running in 5 minutes.

## Prerequisites
- Node.js 18+
- Azure OpenAI API key and endpoint

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

## Verify Setup

Test backend health:
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

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
```bash
cd backend && cat .env
```

**Frontend errors**: Clear and reinstall dependencies
```bash
cd frontend && rm -rf node_modules && npm install
```

**Queries failing**: Check backend terminal for error messages

## Next Steps

**For Presenters**: See [docs/demo/PRESENTER_CHEAT_SHEET.md](./docs/demo/PRESENTER_CHEAT_SHEET.md)

**For Technical Walkthrough**: See [docs/demo/DEMO_WALKTHROUGH.md](./docs/demo/DEMO_WALKTHROUGH.md)

**For Complete Documentation**: See [README.md](./README.md)
