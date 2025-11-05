# Demo 1: Natural Language Task Querying

Transform complex filter UIs into simple, natural language interfaces using GenAI.

## Overview

**The Challenge**: Replace 100+ lines of complex UI code with a simple text input.

**Before**: Traditional filter builder with dropdowns, date pickers, complex form logic
```
┌─────────────────────────┐
│ Assignee:    [Select ▼] │
│ Status:      [Select ▼] │
│ Priority:    [Select ▼] │
│ Due Date:    [Picker]   │
│ [Apply Filter] [Clear]  │
└─────────────────────────┘
```

**After**: Natural language text input
```
┌─────────────────────────┐
│ "Show me Sarah's        │
│  overdue tasks"         │
│                         │
│ → 3 tasks found ✓       │
└─────────────────────────┘
```

**Result**: 100+ lines of UI code → 10 lines, dramatically better UX

---

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for 5-minute setup guide.

**TL;DR:**
```bash
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend
cd frontend && npm install && npm start

# Open browser to http://localhost:4200
```

---

## Demo Materials

### For Presenters
- **[Presenter Cheat Sheet](./docs/demo/PRESENTER_CHEAT_SHEET.md)** - Keep on second monitor during demo
- **[Test Queries](./docs/demo/DEMO_TEST_QUERIES.md)** - Pre-written queries to use during demo
- **[Setup Slide](./docs/demo/SETUP_SLIDE.md)** - Concepts to explain before showing code

### For Audience
- **[Code Walkthrough](./docs/demo/DEMO_WALKTHROUGH.md)** - Technical deep-dive to show during presentation

### For Planning
- **[Planning Document](./docs/planning/PLAN.md)** - Original design and objectives

---

## Project Structure

```
demo1-tasks/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── schemas/      # Zod validation schemas
│   │   ├── services/     # Data & LLM services
│   │   └── routes/       # API endpoints
│   └── data/             # Mock task/user data
├── frontend/             # Angular application
│   └── src/app/
│       ├── components/   # UI components
│       └── services/     # HTTP client
└── docs/                 # Documentation
    ├── demo/             # Presentation materials
    └── planning/         # Original planning docs
```

---

## Key Features

### 1. Natural Language Query Parsing
**Input**: "Show me Sarah Chen's high priority tasks"
**Output**: Structured query + filtered results

### 2. Intelligent Clarification
**Input**: "Show me Sarah's tasks" (multiple Sarahs exist)
**Output**: "I found multiple users named Sarah. Which one did you mean?"
- [Sarah Chen] [Sarah Williams]

### 3. Safety Guardrails
**Input**: "Delete all tasks"
**Output**: ❌ "I can only search and filter tasks, not modify or delete them"

### 4. Multi-State Responses (Discriminated Unions)
- ✅ **Success**: Valid query, returns results
- ❓ **Needs Clarification**: Ambiguous, asks for more info
- ❌ **Invalid**: Unsafe/impossible request, rejects with reason

---

## Architecture

```
User Input (Natural Language)
    ↓
Express API (/api/query/natural)
    ↓
LLM Service (Azure OpenAI GPT-4o)
    ↓
Zod Schema Validation
    ↓
Success / Clarification / Invalid
    ↓
Filtered Results
```

**Key Technologies:**
- **Frontend**: Angular 17+ (standalone components)
- **Backend**: Node.js + Express
- **LLM**: Azure OpenAI (GPT-4o)
- **Validation**: Zod schemas
- **Type Safety**: TypeScript throughout

---

## Example Queries

Try these in the **AFTER** tab (`http://localhost:4200/after`):

| Query | Result |
|-------|--------|
| `Show me high priority tasks` | ✅ Returns high priority tasks |
| `What's overdue?` | ✅ Returns tasks with due dates in the past |
| `In progress items due this week` | ✅ Returns in-progress tasks due within 7 days |
| `Show me Sarah's tasks` | ❓ Asks for clarification (Sarah Chen or Sarah Williams?) |
| `Delete all tasks` | ❌ Safely rejected with explanation |
| `Hack the database` | ❌ Safely rejected |

---

## Key Code Locations

### Backend
- **Prompt Engineering**: `backend/src/services/llm.service.ts:136-175`
- **Zod Schemas**: `backend/src/schemas/query.schema.ts:18-36`
- **Natural Language Route**: `backend/src/routes/tasks.routes.ts:68-122`
- **Ambiguity Detection**: `backend/src/services/data.service.ts:45-59`

### Frontend
- **Natural Language UI**: `frontend/src/app/components/after/`
- **Traditional Filter UI**: `frontend/src/app/components/before/`
- **Clarification UI**: `frontend/src/app/components/clarification/`

---

## API Endpoints

- `GET /health` - Health check
- `GET /api/tasks` - Get all tasks
- `GET /api/users` - Get all users
- `POST /api/query/traditional` - Traditional structured query (BEFORE approach)
- `POST /api/query/natural` - Natural language query (AFTER approach)

---

## Learning Outcomes

After this demo, participants will understand:
- ✅ How LLMs can replace complex UIs
- ✅ Importance of prompt engineering for safety
- ✅ Using Zod schemas to constrain LLM outputs
- ✅ Handling ambiguity with intelligent clarification
- ✅ Discriminated unions for multiple response states
- ✅ The dramatic improvement in UX and code simplicity (100+ lines → 10 lines)

---

## Technical Highlights

### Prompt Engineering
The system uses carefully crafted prompts with:
- Clear field constraints
- Enum value specifications
- Safety rules (reject dangerous operations)
- Date format specifications
- Examples for guidance
- Context (current date)

### Schema-First Design
Zod schemas define the exact structure of valid queries, ensuring:
- Type safety at runtime
- Protection against hallucinations
- Clear API contracts

### Graceful Degradation
The system handles:
- Ambiguous queries → Ask for clarification
- Invalid requests → Reject with explanation
- Edge cases → Conservative interpretation

---

## Troubleshooting

**Backend won't start**
```bash
# Check .env file exists with all Azure OpenAI credentials
cd backend && cat .env
```

**Frontend errors**
```bash
cd frontend && rm -rf node_modules && npm install
```

**Queries failing**
- Check backend terminal for error messages
- Verify Azure OpenAI deployment name matches
- Test with simple query: "Show me tasks"

**Clarification not triggering**
- Use query: "Show me Sarah's tasks" (not "Sarah Chen")
- Verify `backend/data/users.json` has both Sarah Chen and Sarah Williams

See [QUICKSTART.md](./QUICKSTART.md) for more troubleshooting tips.

---

## What Makes This Effective

1. **Clear Before/After Contrast** - Side-by-side tabs show dramatic difference
2. **Real Patterns** - Production-ready techniques (discriminated unions, Zod validation)
3. **Interactive** - Live queries with clarification and safety demos
4. **Measurable Impact** - 100+ lines → 10 lines is quantifiable
5. **Progressive Complexity** - Start simple, show intelligence, demonstrate safety

---

## Next Steps

### Extend This Demo
- Add query history
- Support voice input (Web Speech API)
- Add export functionality (CSV/Excel)
- Build query suggestion system

### Move to Production
- Add rate limiting and caching
- Implement error monitoring
- Add user feedback mechanism
- Build A/B testing framework
- Implement authentication/authorization
- Add audit logging

### Related Demos
- **Demo 2**: Receipt parsing with vision (multimodal AI)
- **Demo 3**: Email personalization with RAG

---

## Resources

- [QUICKSTART.md](./QUICKSTART.md) - 5-minute setup guide
- [Code Walkthrough](./docs/demo/DEMO_WALKTHROUGH.md) - Technical deep-dive
- [Presenter Guide](./docs/demo/PRESENTER_CHEAT_SHEET.md) - Demo execution guide
- [Azure OpenAI Docs](https://learn.microsoft.com/azure/ai-services/openai/)
- [Zod Documentation](https://zod.dev/)

---

**Ready to present? See [PRESENTER_CHEAT_SHEET.md](./docs/demo/PRESENTER_CHEAT_SHEET.md) for your guide.**
