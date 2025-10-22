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

### 1. Start the Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Azure OpenAI credentials
npm run dev
```

Backend will run on `http://localhost:3000`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm start
```

Frontend will run on `http://localhost:4200`

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

## Technical Highlights

### Backend
- **Prompt Engineering**: Carefully crafted prompts with safety rules and examples
- **Zod Schemas**: Type-safe validation with discriminated unions
- **Lazy Initialization**: Azure OpenAI client initialized on first use
- **Ambiguity Detection**: Checks for multiple matches before querying

### Frontend
- **Component-Based**: Reusable TaskList, Clarification components
- **Reactive**: Observable-based HTTP communication
- **Type-Safe**: Full TypeScript with shared models
- **Responsive**: Mobile-friendly design

## API Endpoints

- `GET /health` - Health check
- `GET /api/tasks` - Get all tasks
- `GET /api/users` - Get all users
- `POST /api/query/traditional` - Traditional structured query (BEFORE)
- `POST /api/query/natural` - Natural language query (AFTER)

## Demo Flow (Presentation)

1. **Show BEFORE tab** (5 min)
   - Demonstrate complex filter builder
   - Show the tedious UX
   - Highlight the code complexity

2. **Show AFTER tab** (5 min)
   - Demonstrate natural language queries
   - Show instant results
   - Highlight the simplicity

3. **Live Code the Prompt** (10 min)
   - Start with basic prompt
   - Show it breaking/being unsafe
   - Iteratively add safety rules
   - Add examples to guide behavior
   - Show final prompt working safely

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

**Backend won't start**:
- Check that `.env` file exists with valid Azure OpenAI credentials
- Verify Node.js version (18+ recommended)
- Check port 3000 is not in use

**Frontend can't connect to backend**:
- Ensure backend is running on `http://localhost:3000`
- Check browser console for CORS errors
- Verify backend health endpoint: `curl http://localhost:3000/health`

**LLM queries failing**:
- Verify Azure OpenAI credentials in `.env`
- Check API quota/limits
- Review backend logs for detailed error messages

## Next Steps

- Add more complex query examples
- Implement query history
- Add user authentication
- Extend to other data types beyond tasks
- Add analytics on query patterns

## License

This is a demonstration project for educational purposes.
