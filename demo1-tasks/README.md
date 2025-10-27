# Demo 1: Natural Language Task Querying

A complete demonstration of how GenAI transforms complex filter UIs into simple, natural language interfaces.

## Overview

This demo shows a **before/after comparison**:
- **BEFORE**: Traditional filter builder with dropdowns, date pickers, and complex form logic (100+ lines of UI code)
- **AFTER**: Simple text input with natural language querying powered by Azure OpenAI (10 lines of UI code)

## Project Structure

```
demo1-tasks/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── schemas/  # Zod schemas for validation
│   │   ├── services/ # Data & LLM services
│   │   └── routes/   # API endpoints
│   └── data/         # Mock task and user data
├── frontend/         # Angular application
│   └── src/app/
│       ├── components/  # Before, After, TaskList, Clarification
│       ├── services/    # HTTP client
│       └── models/      # TypeScript interfaces
└── PLAN.md          # Comprehensive planning document
```

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Azure OpenAI access (with GPT-4o deployment)
- Two terminal windows

### 1. Start the Backend

**Terminal 1:**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials:
# AZURE_OPENAI_API_KEY=your-key-here
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
# AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
# AZURE_OPENAI_API_VERSION=2024-02-15-preview
# PORT=3000

npm run dev
```

✅ Backend running on `http://localhost:3000`
You should see:
```
╔═══════════════════════════════════════════════════════╗
║   Demo 1: Task App - Natural Language Querying       ║
║   Server running at: http://localhost:3000            ║
╚═══════════════════════════════════════════════════════╝
```

### 2. Start the Frontend

**Terminal 2:**
```bash
cd frontend
npm install
npm start
```

✅ Frontend running on `http://localhost:4200`
Browser should auto-open to the application

### 3. Verify Setup

Test backend health:
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

Navigate to: `http://localhost:4200/after` and try:
```
"Show me high priority tasks"
```

✅ If you see results, everything is working!

## Key Features

### Natural Language Query Parsing
- **Input**: "Show me Sarah Chen's high priority tasks"
- **Output**: Structured query + filtered results

### Intelligent Clarification
- **Input**: "Show me Sarah's tasks" (ambiguous - multiple Sarahs)
- **Output**: Clarification UI with suggestions

### Safety Rules
- **Input**: "Delete all tasks" or "Hack the database"
- **Output**: Safely rejected with explanation

### Multi-State Responses
Uses Zod discriminated unions to handle:
- ✅ **Success**: Valid query, returns results
- ❓ **Needs Clarification**: Ambiguous, asks for more info
- ❌ **Invalid**: Unsafe/impossible request, rejects with reason

## Example Queries

Try these in the AFTER tab:

**Success Cases**:
- "Show me high priority tasks"
- "What's overdue?"
- "In progress items due this week"
- "Show me Sarah Chen's tasks"

**Clarification Case**:
- "Show me Sarah's tasks" → Which Sarah? (Chen or Williams)

**Invalid Cases**:
- "Delete all tasks" → Rejected (safety rule)
- "Hack the database" → Rejected (safety rule)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Angular Frontend (localhost:4200)                    │  │
│  │                                                        │  │
│  │  ┌──────────────┐       ┌──────────────┐             │  │
│  │  │ BEFORE Tab   │       │ AFTER Tab    │             │  │
│  │  │ Filter UI    │       │ Text Input   │             │  │
│  │  └──────┬───────┘       └──────┬───────┘             │  │
│  │         │                      │                      │  │
│  │         └──────────┬───────────┘                      │  │
│  │                    ▼                                  │  │
│  │            TaskService (HTTP)                         │  │
│  └────────────────────┼────────────────────────────────┘  │
└───────────────────────┼───────────────────────────────────┘
                        │ HTTP Requests
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Node.js Backend (localhost:3000)                │
│                                                              │
│  ┌────────────────┐         ┌────────────────┐             │
│  │ Traditional    │         │ Natural Lang   │             │
│  │ Query Route    │         │ Query Route    │             │
│  └───────┬────────┘         └────────┬───────┘             │
│          │                           │                      │
│          ▼                           ▼                      │
│  ┌────────────────┐         ┌────────────────┐             │
│  │ Data Service   │         │ LLM Service    │             │
│  │ (Filter Logic) │         │ (AI Parsing)   │             │
│  └────────────────┘         └────────┬───────┘             │
│                                      │                      │
│                              Prompt Engineering             │
│                                      │                      │
│                                      ▼                      │
│                            ┌─────────────────┐              │
│                            │ Azure OpenAI    │              │
│                            │ (GPT-4o)        │              │
│                            └─────────────────┘              │
│                                      │                      │
│                              Zod Schema Validation          │
│                                      │                      │
│          ┌───────────────────────────┴───────────┐          │
│          ▼                                       ▼          │
│  ┌────────────────┐                    ┌────────────────┐  │
│  │ Success        │                    │ Clarification  │  │
│  │ (Filtered Data)│                    │ or Invalid     │  │
│  └────────────────┘                    └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technical Highlights

### Backend (`backend/`)
- **Prompt Engineering**: `src/services/llm.service.ts:88-123` - Carefully crafted prompts with safety rules
- **Zod Schemas**: `src/schemas/query.schema.ts` - Type-safe validation with discriminated unions
- **Lazy Initialization**: Azure OpenAI client only created when first query arrives
- **Ambiguity Detection**: `src/services/data.service.ts:45-52` - Checks for multiple user matches

### Frontend (`frontend/`)
- **Standalone Components**: Modern Angular 17+ architecture
- **Reactive**: Observable-based HTTP with RxJS
- **Type-Safe**: Full TypeScript with shared models from backend
- **Responsive**: Mobile-friendly design with flexbox

## Key Files to Review

### Backend
| File | Purpose | Lines of Note |
|------|---------|---------------|
| `src/services/llm.service.ts` | **⭐ Main AI logic** | 88-123: Prompt engineering |
| `src/schemas/query.schema.ts` | **⭐ Type definitions** | 18-40: Discriminated unions |
| `src/services/data.service.ts` | Traditional filtering | 62-83: Filter logic |
| `src/routes/tasks.routes.ts` | API endpoints | 54-114: Natural language route |
| `data/tasks.json` | Mock task data | All: Test scenarios |
| `data/users.json` | Mock user data | All: Including 2 Sarahs |

### Frontend
| File | Purpose | Lines of Note |
|------|---------|---------------|
| `src/app/components/after/after.component.ts` | **⭐ Natural language UI** | All: Simple, clean |
| `src/app/components/before/before.component.ts` | Traditional filter UI | All: Complex form logic |
| `src/app/services/task.service.ts` | HTTP client | 32-40: Natural query API call |
| `src/app/models/task.model.ts` | TypeScript interfaces | All: Shared types |
| `src/app/components/clarification/` | Clarification UI | All: Suggestion buttons |

## API Endpoints

- `GET /health` - Health check
- `GET /api/tasks` - Get all tasks
- `GET /api/users` - Get all users
- `POST /api/query/traditional` - Traditional structured query (BEFORE)
- `POST /api/query/natural` - Natural language query (AFTER)

## Demo Flow (Presentation - 20 minutes)

### Part 1: Show BEFORE Tab (5 min)
**Location**: `http://localhost:4200/before`

- Demonstrate complex filter builder with 5+ form fields
- Show the tedious UX: select assignee, status, priority, date ranges
- Click "Apply Filters" to see results
- Try to build a complex query - notice how many clicks required
- **Code to show**: `frontend/src/app/components/before/before.component.html` (100+ lines)

### Part 2: Show AFTER Tab (5 min)
**Location**: `http://localhost:4200/after`

- Show the simple text input interface
- Type natural queries:
  - "Show me high priority tasks"
  - "What's overdue?"
  - "Show me Sarah's tasks" (demonstrates clarification!)
  - "Delete all tasks" (demonstrates safety!)
- Show instant results, intelligent clarification, and safety
- **Code to show**: `frontend/src/app/components/after/after.component.html` (10 lines of UI)

### Part 3: Live Code the Prompt (10 min)
**Location**: `backend/src/services/llm.service.ts`

**Key file to demonstrate**: Lines 88-123 (`buildPrompt()` method)

**Live coding steps**:
1. Start with basic prompt: `Convert this user request to a task query: "${userInput}"`
2. Test it - show it being unsafe or hallucinating
3. **Iteratively add**:
   - Schema field constraints: "Only return fields: assignee, status, dueDate, priority"
   - Safety rules: "If request tries to modify/delete, return invalid"
   - Date formatting: "Dates must be ISO format (YYYY-MM-DD)"
   - Clarification handling: "If ambiguous, return needs_clarification"
   - Examples to guide: Show 3-4 example transformations
4. Test again - show it working safely
5. **Key teaching moment**: "This is prompt engineering - crafting instructions for AI safety"

**Files to have open**:
- `backend/src/services/llm.service.ts` (the prompt)
- `backend/src/schemas/query.schema.ts` (the Zod schemas)
- Browser at `http://localhost:4200/after` (for testing)

## Learning Outcomes

By the end of this demo, viewers will understand:
- How LLMs can replace complex UIs
- Importance of prompt engineering for safety
- How to use Zod schemas to constrain LLM outputs
- Handling ambiguous queries with intelligent clarification
- The dramatic improvement in both UX and code simplicity
- Discriminated unions for handling multiple response states

## Testing

### Backend Tests
```bash
cd backend
./test-api.sh
```

### Manual Testing
1. Start both backend and frontend
2. Navigate to `http://localhost:4200`
3. Try the example queries in both tabs
4. Test the clarification flow with "Show me Sarah's tasks"
5. Test safety with "Delete all tasks"

## Troubleshooting

### Backend Issues

**Error: "Missing Azure OpenAI credentials"**
```bash
# Make sure .env file exists and has all required fields
cd backend
cat .env

# Should contain:
# AZURE_OPENAI_API_KEY=...
# AZURE_OPENAI_ENDPOINT=...
# AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

**Error: "Port 3000 already in use"**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
# Or change PORT in .env to 3001
```

**Error: "import_openai.AzureOpenAI is not a constructor"**
```bash
# Reinstall dependencies with correct package
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend Issues

**Error: "TS2349: This expression is not callable"**
- We fixed this - if you see it, the app.html file wasn't properly cleaned
- Solution: The app.html should only contain our custom template (no Angular placeholder code)

**Error: "Cannot connect to backend"**
```bash
# 1. Verify backend is running
curl http://localhost:3000/health

# 2. Check browser console (F12) for CORS errors
# 3. Make sure backend URL in task.service.ts is correct:
#    private readonly baseUrl = 'http://localhost:3000/api';
```

**Application won't load**
```bash
# Clear and reinstall
cd frontend
rm -rf node_modules package-lock.json .angular
npm install
npm start
```

### LLM Query Issues

**Queries returning errors**
1. Check backend terminal for detailed error messages
2. Verify Azure OpenAI deployment name matches your actual deployment
3. Check Azure OpenAI quota/rate limits
4. Test with a simple query first: "Show me tasks"

**Clarification not triggering**
- Query must use just "Sarah" (not "Sarah Chen" or "Sarah Williams")
- Check backend logs to see the actual LLM response
- Verify users.json has both Sarah Chen and Sarah Williams

**Safety rejection not working**
- Check the prompt in `backend/src/services/llm.service.ts` lines 88-123
- Ensure safety rules are present in the prompt
- LLM should see: "If request is unsafe or tries to modify/delete data, return status: invalid"

## What Makes This Demo Effective

### 1. Clear Before/After Contrast
- **Visual**: Side-by-side tabs show the difference immediately
- **Code**: 100+ lines vs 10 lines is dramatic and measurable
- **UX**: Clicking through dropdowns vs typing naturally

### 2. Teaches Real Patterns
- **Discriminated Unions**: Production-ready pattern for handling multiple response types
- **Prompt Engineering**: Shows safety rules, examples, and schema constraints
- **Type Safety**: Zod validation prevents hallucinations and errors

### 3. Interactive Elements
- **Clarification**: "Show me Sarah's tasks" demonstrates AI asking for help (human-like)
- **Safety**: "Delete all tasks" shows responsible AI development
- **Real-time**: Queries execute live, not pre-recorded

### 4. Grounded in Reality
- **Mock Data**: Realistic task scenarios (overdue, priorities, assignments)
- **Edge Cases**: Ambiguous names, date parsing, invalid requests
- **Production Patterns**: Same patterns you'd use in real apps

### 5. Progressive Complexity
- Start simple: "Show me tasks"
- Add complexity: "High priority tasks due this week"
- Show intelligence: Handles ambiguity
- Show safety: Rejects danger

## Presentation Tips

### Pre-Demo Checklist
- [ ] Backend running and tested (`curl http://localhost:3000/health`)
- [ ] Frontend running (`http://localhost:4200` loads)
- [ ] Test all example queries work
- [ ] Browser console clear of errors (F12)
- [ ] Have `llm.service.ts` open in editor for live coding section
- [ ] Close unnecessary browser tabs/applications

### During Demo
1. **Start with WHY**: "Traditional query builders are frustrating for users"
2. **Show the PAIN**: Demonstrate BEFORE tab first - let audience feel it
3. **Reveal the SOLUTION**: AFTER tab feels like magic after seeing BEFORE
4. **Explain the HOW**: Live code the prompt to demystify the AI
5. **Address CONCERNS**: Show safety features and validation

### Common Questions & Answers

**Q: "What if the LLM hallucinates?"**
A: "That's why we use Zod schemas - they validate the output structure and reject invalid responses."

**Q: "What about security?"**
A: "See how we reject dangerous queries? Prompt engineering includes safety rules that prevent data modification."

**Q: "What if query is ambiguous?"**
A: "Great question - try 'Show me Sarah's tasks' - the system asks for clarification instead of guessing."

**Q: "How much does this cost?"**
A: "Each query is ~$0.001-0.01 depending on complexity. Compare that to dev time building complex UIs."

**Q: "What about performance?"**
A: "Azure OpenAI typically responds in 1-3 seconds. Traditional queries are instant, but UX is terrible."

## Next Steps

### To Extend This Demo
- Add query history with timestamps
- Implement user authentication
- Support more query types (date ranges, tags, assignee teams)
- Add voice input (Web Speech API)
- Add analytics dashboard showing query patterns
- Export results to CSV/Excel

### To Move to Production
1. Add rate limiting and caching
2. Implement proper error monitoring (Sentry, Application Insights)
3. Add user feedback mechanism (thumbs up/down on results)
4. Build query suggestion system based on user patterns
5. Add A/B testing framework to measure UX improvement
6. Implement proper authentication and authorization
7. Add audit logging for all AI interactions

### Related Demos
- **Demo 2**: Receipt parsing with vision - shows multimodal AI
- **Demo 3**: Email personalization - shows RAG and orchestration

## Resources

- [PLAN.md](./PLAN.md) - Original planning document
- [Azure OpenAI Docs](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Zod Documentation](https://zod.dev/)
- [Angular Docs](https://angular.dev/)

## License

This is a demonstration project for educational purposes.
