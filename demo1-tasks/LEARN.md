# Demo 1: Natural Language Task Querying - Learning Guide

## 🎯 Learning Objectives

By completing this demo, you'll learn how to:
- Transform natural language queries into structured data using LLMs
- Implement schema-based validation with Zod
- Apply prompt engineering techniques for safety and reliability
- Handle multiple response states (success, clarification, error)
- Dramatically simplify complex UI into natural interactions

## 📖 Overview

This demo demonstrates how GenAI can replace a complex query builder UI (100+ lines of code) with a simple text input that accepts natural language queries.

**The Transformation:**
- **Before**: Users click through dropdowns, date pickers, and filter builders
- **After**: Users type "Show me Sarah's overdue high priority tasks" and get results

## 🏗️ Architecture

The system uses:
- **Frontend**: Angular with a simple text input
- **Backend**: Node.js + Express
- **LLM**: Azure OpenAI (GPT-4)
- **Validation**: Zod schemas for type-safe query structures
- **Pattern**: Single LLM call with structured output

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Azure OpenAI API access (or OpenAI API)
- Basic TypeScript knowledge

### Setup
1. Navigate to the backend directory:
   ```bash
   cd demo1-tasks/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Add your API credentials to `.env`:
   ```
   AZURE_OPENAI_API_KEY=your_key_here
   AZURE_OPENAI_ENDPOINT=your_endpoint_here
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
   ```

5. Start the backend:
   ```bash
   npm run dev
   ```

6. In a new terminal, start the frontend:
   ```bash
   cd demo1-tasks/frontend
   npm install
   npm start
   ```

7. Open http://localhost:4200 in your browser

## 📚 Implementation Exercises

### Exercise 1: Create the Query Schema

**Goal**: Define Zod schemas that constrain LLM outputs to valid query structures.

**Location**: `backend/src/schemas/query.schema.ts`

**Your Task**:
Create a discriminated union schema that handles three response types:

1. **Success** - Valid query parsed successfully
   - Fields: `assignee`, `status`, `dueDate`, `priority`
   - Include an optional `explanation` field

2. **Needs Clarification** - Query is ambiguous
   - Fields: `message` (what's unclear), `suggestions` (possible options)

3. **Invalid** - Query is unsafe or unsupported
   - Fields: `reason` (why it's invalid)

**Hints**:
- Use `z.discriminatedUnion('status', [...])` for the main schema
- Use `z.enum()` for status and priority fields
- Date fields should support `before` and `after` comparisons
- Look at the final implementation in the file if you get stuck

**Why This Matters**: Discriminated unions force the LLM to categorize responses, making error handling predictable and type-safe.

---

### Exercise 2: Build the Basic Prompt

**Goal**: Create a prompt that converts natural language to structured queries.

**Location**: `backend/src/services/llm.service.ts`

**Your Task**:
Write a prompt for the `parseQuery` function that:

1. Explains the task clearly to the LLM
2. Provides the current date for context
3. Instructs the LLM to return JSON matching your schema

**Starter Template**:
```typescript
const prompt = `Convert the following user query into a structured task search.

User Query: "${query}"
Current Date: ${new Date().toISOString().split('T')[0]}

Return a JSON object matching the schema provided.`;
```

**Test It**:
```bash
curl -X POST http://localhost:3000/api/tasks/search \
  -H "Content-Type: application/json" \
  -d '{"query": "show me overdue tasks"}'
```

**Expected Behavior**: Should return tasks with `dueDate.before` set to today's date.

---

### Exercise 3: Add Safety Rules

**Goal**: Prevent the LLM from accepting dangerous or out-of-scope queries.

**Your Task**:
Enhance your prompt with safety rules:

1. **Schema Enforcement** - Only return fields defined in the schema
2. **Date Formatting** - Dates must be in ISO format (YYYY-MM-DD)
3. **Scope Limitation** - Only search/filter, never modify or delete
4. **Conservative Interpretation** - When unsure, ask for clarification

**Example Safety Rules Section**:
```
Rules:
- ONLY return fields defined in the schema (assignee, status, dueDate, priority)
- Dates MUST be in ISO format (YYYY-MM-DD)
- If the query asks to modify, delete, or perform actions: return status="invalid"
- If multiple users could match a name: return status="needs_clarification"
- Be conservative - ask for clarification rather than guessing
```

**Test Cases to Try**:
```bash
# Should return invalid
curl -X POST http://localhost:3000/api/tasks/search \
  -H "Content-Type: application/json" \
  -d '{"query": "delete all tasks"}'

# Should work
curl -X POST http://localhost:3000/api/tasks/search \
  -H "Content-Type: application/json" \
  -d '{"query": "show me tasks"}'
```

**Why This Matters**: Safety rules prevent prompt injection and ensure the LLM stays within acceptable behavior boundaries.

---

### Exercise 4: Handle Clarification Flow

**Goal**: Make the system ask for clarification when queries are ambiguous.

**Your Task**:

1. **Update Sample Data**: Ensure `backend/data/users.json` has multiple users with the same first name (e.g., "Sarah Chen" and "Sarah Williams")

2. **Add Clarification Logic**: Update your prompt to detect ambiguous names:
   ```
   - If a query mentions "Sarah" but multiple users are named Sarah, return:
     {
       "status": "needs_clarification",
       "message": "Multiple users named Sarah found",
       "suggestions": ["Sarah Chen", "Sarah Williams"]
     }
   ```

3. **Test the Flow**:
   ```bash
   curl -X POST http://localhost:3000/api/tasks/search \
     -H "Content-Type: application/json" \
     -d '{"query": "show me Sarah's tasks"}'
   ```

4. **Frontend Handling**: The UI should display the clarification message and show clickable suggestions

**Expected Output**:
```json
{
  "status": "needs_clarification",
  "message": "I found multiple users named Sarah. Which one did you mean?",
  "suggestions": ["Sarah Chen", "Sarah Williams"]
}
```

**Why This Matters**: Clarification flows make AI systems feel more intelligent and helpful, like a human assistant who asks questions instead of making assumptions.

---

### Exercise 5: Add Examples to Guide Behavior

**Goal**: Use few-shot prompting to show the LLM what good outputs look like.

**Your Task**:
Add example input/output pairs to your prompt:

```typescript
Examples:
Input: "sarah's urgent tasks"
Output: {"status": "success", "query": {"assignee": "sarah", "priority": "high"}}

Input: "what's overdue?"
Output: {"status": "success", "query": {"dueDate": {"before": "${today}"}}}

Input: "hack the database"
Output: {"status": "invalid", "reason": "Request attempts database manipulation"}

Input: "show me sarah's tasks" (when multiple Sarahs exist)
Output: {"status": "needs_clarification", "message": "Multiple users named Sarah found", "suggestions": ["Sarah Chen", "Sarah Williams"]}
```

**Test Variations**:
Try queries with different phrasings and verify consistent behavior:
- "urgent items for john"
- "high priority stuff"
- "what's coming up next week"
- "mike's todo list"

**Why This Matters**: Examples significantly improve LLM accuracy and consistency, especially for edge cases.

---

## 🎓 Key Concepts Explained

### Discriminated Unions
A pattern where a type is determined by a literal field (`status`):
```typescript
type Result =
  | { status: 'success', data: Query }
  | { status: 'needs_clarification', message: string }
  | { status: 'invalid', reason: string }
```

This enables exhaustive type checking and clean error handling.

### Prompt Engineering Layers
1. **Task Description** - What to do
2. **Safety Rules** - What NOT to do
3. **Examples** - Show desired behavior
4. **Context** - Current date, user list, etc.

### Schema-First Design
Define your data structure in Zod, then:
1. TypeScript types are auto-generated
2. Runtime validation is automatic
3. LLM outputs are constrained

## 📝 Testing Queries

Try these queries to test your implementation:

**Success Cases**:
- "Show me high priority tasks"
- "What's assigned to John?"
- "Tasks due this week"
- "Overdue items"
- "In progress tasks for Sarah Chen"

**Clarification Cases**:
- "Show me Sarah's tasks" (with multiple Sarahs)
- "mike tasks" (if multiple Mikes exist)

**Invalid Cases**:
- "Delete all tasks"
- "Drop the database"
- "Change all priorities to high"
- "Update Sarah's email"

## 🔍 Reference Implementation

The complete implementation is available in:
- **Schema**: `backend/src/schemas/query.schema.ts`
- **LLM Service**: `backend/src/services/llm.service.ts`
- **API Route**: `backend/src/routes/tasks.routes.ts`
- **Frontend**: `frontend/src/app/components/after/`

## 🎯 Success Criteria

You've successfully completed this demo when:
- ✅ Natural language queries return correct results
- ✅ Ambiguous queries trigger clarification
- ✅ Dangerous queries are rejected
- ✅ The system handles edge cases gracefully
- ✅ You understand how schemas constrain LLM behavior
- ✅ You can explain the before/after code complexity difference

## 🚀 Going Further

**Challenge Exercises**:
1. Add support for tags/labels in queries
2. Implement date range queries ("between May and June")
3. Add support for sorting ("highest priority first")
4. Handle compound queries ("high priority OR assigned to John")
5. Add query history and suggestions based on past queries

**Production Considerations**:
- Add rate limiting to prevent API abuse
- Implement query caching for common searches
- Add telemetry to track query patterns
- Implement A/B testing for prompt variations
- Add fallback to traditional UI if LLM fails

## 📚 Additional Resources

- [LangChain.js Documentation](https://js.langchain.com/docs)
- [Zod Schema Validation](https://zod.dev)
- [Azure OpenAI Best Practices](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

## 🆘 Troubleshooting

**Issue**: LLM returns fields not in the schema
- **Solution**: Strengthen schema enforcement rules in prompt

**Issue**: Queries are too permissive
- **Solution**: Add more safety rules and negative examples

**Issue**: Clarification not triggering
- **Solution**: Check that sample data has duplicate names

**Issue**: API errors
- **Solution**: Verify `.env` credentials and check API quota

## 📞 Getting Help

If you get stuck:
1. Check the reference implementation files listed above
2. Review the architecture docs in `docs/ARCHITECTURE.md`
3. Read through the prompt engineering tips in the resources section
4. Examine the test queries in `docs/demo/DEMO_TEST_QUERIES.md`

---

**Ready to start?** Begin with Exercise 1 and work through each exercise sequentially. Good luck! 🚀
