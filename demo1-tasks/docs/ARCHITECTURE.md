# Demo 1: Architecture Overview

Visual guide to the natural language query parsing system.

## 📊 High-Level Architecture

### BEFORE: Traditional Approach (No AI)

```
┌─────────────┐
│   Frontend  │  Angular UI
│  (Angular)  │  - FilterBuilder component (100+ lines)
└──────┬──────┘  - 5 form controls (assignee, status, priority, dates)
       │          - Manual user input required for each field
       │
       │ HTTP POST /api/query/traditional
       │ {
       │   "assignee": "Sarah Chen",
       │   "priority": "high"
       │ }
       ▼
┌─────────────┐
│   Backend   │  Node.js + Express
│  (Express)  │  - API endpoints
└──────┬──────┘  - Data service only
       │
       │ Validate with Zod schema
       ▼
┌─────────────┐
│   Filter    │  Apply structured query to task data
│   Tasks     │  Return matching tasks
└─────────────┘
```

**Key Characteristics:**
- ❌ Complex UI: 5+ form controls, dropdowns, date pickers
- ❌ User must know exact field names and values
- ❌ Limited flexibility: Can only query predefined fields
- ✓ Fast: No LLM call, direct filtering (~10ms)
- ✓ Predictable: Structured input = structured output

---

### AFTER: Natural Language Approach (With AI)

```
┌─────────────┐
│   Frontend  │  Angular UI
│  (Angular)  │  - Single text input (10 lines)
└──────┬──────┘  - Natural language queries
       │
       │ HTTP POST /api/query/natural
       │ { query: "show me sarah's urgent tasks" }
       ▼
┌─────────────┐
│   Backend   │  Node.js + Express
│  (Express)  │  - API endpoints
└──────┬──────┘  - LLM service
       │
       │ Parse with LLM + Zod validation
       ▼
┌──────────────────────────────────────┐
│     Azure OpenAI (Single Call)       │
│  Natural Language → Structured Query │
└──────────────────────────────────────┘
       │
       │ Returns QueryResult (success/clarification/invalid)
       ▼
┌─────────────┐
│   Filter    │  Apply query to task data
│   Tasks     │  Return matching tasks
└─────────────┘
```

**Key Characteristics:**
- ✓ Simple UI: Single text input field
- ✓ Intuitive: Users express queries naturally
- ✓ Flexible: Open-ended query possibilities
- ✓ Smart: Handles ambiguity and unsafe requests
- ⚠️ Slower: LLM call adds ~500-1500ms latency
- ⚠️ Cost: ~$0.001 per query

---

## 📋 Data Model

The application works with two main entities: **Users** and **Tasks**. Tasks are assigned to users.

### Task Entity

```typescript
Task {
  id: string,              // Unique identifier (e.g., "task-1")
  title: string,           // Task description
  assignee: string | null, // User name (can be null for unassigned)
  status: enum,            // 'todo' | 'in-progress' | 'done'
  priority: enum,          // 'low' | 'medium' | 'high'
  dueDate: string,         // ISO format: YYYY-MM-DD
  createdAt: string        // ISO format: YYYY-MM-DD
}
```

**Example Task:**
```json
{
  "id": "task-1",
  "title": "Fix authentication bug",
  "assignee": "Sarah Chen",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2025-10-28",
  "createdAt": "2025-10-20"
}
```

### User Entity

```typescript
User {
  id: string,    // Unique identifier (e.g., "user-1")
  name: string,  // Full name
  email: string  // Email address
}
```

**Example Users:**
```json
[
  {
    "id": "user-1",
    "name": "John",
    "email": "john@example.com"
  },
  {
    "id": "user-3",
    "name": "Sarah Chen",
    "email": "sarah.chen@example.com"
  },
  {
    "id": "user-4",
    "name": "Sarah Williams",
    "email": "sarah.williams@example.com"
  }
]
```

### Relationship

```
┌─────────────┐
│    User     │
│  (5 users)  │
└──────┬──────┘
       │
       │ assignee (name match)
       │
       ▼
┌─────────────┐
│    Task     │
│  (N tasks)  │
└─────────────┘
```

**Key Notes:**
- **Relationship**: Tasks reference users by `name` (not by `id`)
- **Ambiguity Scenario**: Multiple users can have the same first name
  - Example: Query "sarah's tasks" matches both "Sarah Chen" AND "Sarah Williams"
  - System detects this and returns `needs_clarification` status
- **Nullable Assignee**: Tasks can be unassigned (`assignee: null`)
- **Date Format**: All dates use ISO 8601 format (YYYY-MM-DD)

### Query Fields Mapping

When parsing natural language queries, the LLM maps to these **exact fields**:

```
Natural Language      →  Data Field
─────────────────────────────────────
"sarah's tasks"       →  assignee: "Sarah Chen"
"urgent"/"high pri"   →  priority: "high"
"in progress"         →  status: "in-progress"
"overdue"             →  dueDate: { before: today }
"this week"           →  dueDate: { before: today+7 }
```

**Schema Enforcement:**
- Only these 4 fields can be queried: `assignee`, `status`, `priority`, `dueDate`
- Any attempt to query other fields (e.g., `id`, `title`) is prevented by Zod validation
- This prevents the LLM from hallucinating invalid query structures

---

## 🔗 Request Flow

### Traditional Query Flow (BEFORE)

```
User Action: Select filters from UI
           │
           ├─ Dropdown: Select "Sarah Chen"
           ├─ Dropdown: Select "high" priority
           ├─ Click "Apply Filters"
           │
           ▼
┌─────────────────────────────────────────────────┐
│  POST /api/query/traditional                    │
│  ────────────────────────────────────────────   │
│  Input:  { assignee: "Sarah Chen",              │
│            priority: "high" }                   │
│  Does:   Validate with Zod                      │
│  Calls:  dataService.filterTasks()              │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Data Service - Direct Filtering                │
│  ────────────────────────────────────────────   │
│  Input:  TaskQuery object                       │
│  Does:   Filter tasks array with JavaScript     │
│          tasks.filter(t =>                      │
│            t.assignee === query.assignee &&     │
│            t.priority === query.priority)       │
│  Output: Matching tasks array                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Return Response                                 │
│  ────────────────────────────────────────────   │
│  {                                               │
│    success: true,                               │
│    approach: 'traditional',                     │
│    query: { assignee: "...", priority: "..." }, │
│    data: [...tasks...],                         │
│    count: 5                                     │
│  }                                               │
└─────────────────────────────────────────────────┘
```

**Flow Characteristics:**
- ⚡ **Speed**: ~10ms (no LLM call, direct array filtering)
- 💰 **Cost**: $0 (no API calls)
- 🎯 **Accuracy**: 100% (direct field matching)
- 📊 **Predictable**: Same input always produces same output
- ❌ **UX**: Complex UI, requires 5+ user interactions
- ❌ **Rigid**: Can only query predefined field combinations

---

### Natural Language Query Flow (AFTER)

```
User Input: "show me sarah's urgent tasks"
           │
           ▼
┌─────────────────────────────────────────────────┐
│  POST /api/query/natural                        │
│  ────────────────────────────────────────────   │
│  Input:  { query: string }                      │
│  Does:   Validate input                         │
│  Calls:  llmService.parseNaturalLanguageQuery() │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  LLM Service (Single API Call)                  │
│  ────────────────────────────────────────────   │
│  Input:  Natural language string                │
│  Does:   Call Azure OpenAI with prompt          │
│          Parse JSON response                    │
│          Check for ambiguous names              │
│          Validate with Zod schema               │
│  Output: QueryResult (discriminated union)      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Handle Response by Status                      │
│  ────────────────────────────────────────────   │
│  Status: 'success'                              │
│    → Filter tasks with parsed query             │
│    → Return tasks + metadata                    │
│                                                  │
│  Status: 'needs_clarification'                  │
│    → Return clarification message + suggestions │
│                                                  │
│  Status: 'invalid'                              │
│    → Return error with reason                   │
└─────────────────────────────────────────────────┘
```

**Flow Characteristics:**
- 🧠 **Intelligent**: Understands natural language and context
- 🎯 **Flexible**: Open-ended query possibilities
- 🛡️ **Safe**: Validates, clarifies ambiguous requests, rejects unsafe operations
- ⚠️ **Slower**: ~500-1500ms (includes LLM API call)
- 💰 **Cost**: ~$0.001 per query (Azure OpenAI API)
- ✅ **UX**: Single text input, intuitive, no training required

---

## 🎭 Query Result States (Discriminated Union)

The system uses a **discriminated union** based on the `status` field to handle three different outcomes:

### 1. Success ✅
```json
{
  "status": "success",
  "query": {
    "assignee": "Sarah Chen",
    "priority": "high"
  },
  "explanation": "High priority tasks assigned to Sarah"
}
```
**Action**: Filter tasks and return results

### 2. Needs Clarification ❓
```json
{
  "status": "needs_clarification",
  "message": "I found multiple users named 'Sarah'. Which one did you mean?",
  "suggestions": [
    "Sarah Chen",
    "Sarah Williams"
  ]
}
```
**Action**: Ask user to clarify their intent

### 3. Invalid ❌
```json
{
  "status": "invalid",
  "reason": "I can only search and filter tasks, not modify or delete them"
}
```
**Action**: Reject unsafe or impossible requests

## 🧩 Component Breakdown

### Schemas (`schemas/`)

```
query.schema.ts
  ├─ TaskQuerySchema
  │   ├─ assignee?: string
  │   ├─ status?: 'todo' | 'in-progress' | 'done'
  │   ├─ dueDate?: { after, before }
  │   └─ priority?: 'low' | 'medium' | 'high'
  │
  └─ QueryResultSchema (Discriminated Union)
      ├─ Success: { status: 'success', query, explanation }
      ├─ Clarification: { status: 'needs_clarification', message, suggestions }
      └─ Invalid: { status: 'invalid', reason }
```

**Benefits:**
- Type-safe LLM outputs
- Validation at runtime
- TypeScript inference
- Prevents hallucination (only defined fields allowed)
- Handles ambiguous/unsafe queries gracefully

### Services (`services/`)

```
llm.service.ts
  ├─ parseNaturalLanguageQuery()
  │   ├─ Calls Azure OpenAI with structured prompt
  │   ├─ Validates response with Zod
  │   ├─ Checks for ambiguous names
  │   └─ Returns QueryResult
  │
  └─ buildPrompt()
      ├─ System prompt: role definition
      ├─ User prompt: examples + rules
      └─ Current date for date calculations

data.service.ts
  ├─ getAllTasks()
  ├─ getAllUsers()
  ├─ filterTasks(query)
  └─ isAmbiguousName(name)
      └─ Checks for multiple users with same first name
```

### Routes (`routes/`)

```
tasks.routes.ts
  ├─ GET /api/tasks
  │   └─ Returns all tasks
  │
  ├─ GET /api/users
  │   └─ Returns all users
  │
  ├─ POST /api/query/traditional (BEFORE)
  │   └─ Expects structured TaskQuery object
  │
  └─ POST /api/query/natural (AFTER)
      └─ Expects { query: string }
      └─ Parses with LLM
      └─ Returns results or clarification
```

## 🔄 Before vs After Comparison

### BEFORE: Traditional Filter UI

```typescript
// Frontend: Complex FilterBuilder component (100+ lines)
filterForm = {
  assignee: new FormControl(''),
  status: new FormControl(''),
  priority: new FormControl(''),
  dueDateAfter: new FormControl(''),
  dueDateBefore: new FormControl('')
}

// Backend: Direct structured query
POST /api/query/traditional
{
  "assignee": "Sarah Chen",
  "priority": "high"
}
```

**User Experience:**
- 5 dropdown/input fields
- Must know exact field names
- Manual date selection
- No flexibility in expression

### AFTER: Natural Language Input

```typescript
// Frontend: Simple text input (10 lines)
<input type="text"
       placeholder="Ask me anything... (e.g., 'show me overdue tasks')">

// Backend: Natural language parsing
POST /api/query/natural
{
  "query": "show me sarah's urgent tasks"
}
```

**User Experience:**
- Single text field
- Natural expression
- No UI complexity
- Flexible, intuitive queries

## 🎨 Prompt Engineering Strategy

### System Prompt
```
Role: "You are a helpful assistant that converts natural
       language queries into structured task queries."

Format: "Always respond with valid JSON matching the schema provided."
```

### User Prompt Structure

1. **User Input**: Original natural language query
2. **Safety Rules**:
   - Only return defined schema fields
   - Reject modification/deletion requests
   - Be conservative with interpretation
3. **Examples**: Demonstrate success, clarification, invalid cases
4. **Schema Definition**: Clear field constraints
5. **Current Date**: For date calculations (overdue, this week, etc.)

### Prompt Safety Features

```
❌ REJECTED QUERIES:
- "delete all tasks"
- "hack the database"
- "give me admin access"

✓ ACCEPTED QUERIES:
- "show me overdue tasks"
- "what's sarah working on?"
- "in progress items due this week"

❓ CLARIFICATION TRIGGERS:
- Ambiguous names: "sarah" → Sarah Chen or Sarah Williams?
- Unclear timeframes: "soon" → how many days?
```

## 📈 Example Query Transformations

| Natural Language | Structured Query | Notes |
|-----------------|------------------|-------|
| "show me sarah's urgent tasks" | `{ assignee: "Sarah Chen", priority: "high" }` | Maps "urgent" → "high" priority |
| "what's overdue?" | `{ status: "todo", dueDate: { before: "2025-11-03" } }` | Calculates today's date |
| "in progress items due this week" | `{ status: "in-progress", dueDate: { before: "2025-11-10" } }` | Calculates 7 days from today |
| "delete all tasks" | `{ status: "invalid", reason: "..." }` | Rejects unsafe operation |
| "tasks for sarah" | `{ status: "needs_clarification", ... }` | Multiple "Sarah" users found |

## 🛡️ Safety Mechanisms

### 1. Schema Validation (Zod)
```typescript
// LLM can only return fields defined in TaskQuerySchema
TaskQuerySchema = z.object({
  assignee: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  dueDate: z.object({...}).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});
```

**Prevents:**
- Hallucinated fields
- Invalid enum values
- Type mismatches
- Injection attempts

### 2. Prompt-Based Safety
```
"If the request is unsafe or tries to modify/delete data,
 return status: 'invalid'"
```

**Prevents:**
- Destructive operations
- Database modification attempts
- Privilege escalation

### 3. Ambiguity Detection
```typescript
// Check if name matches multiple users
if (isAmbiguous) {
  return {
    status: "needs_clarification",
    message: "I found multiple users named...",
    suggestions: ["Sarah Chen", "Sarah Williams"]
  };
}
```

**Prevents:**
- Incorrect filtering
- Confusion between similar names
- Unintended results

## 🔍 Error Handling Strategy

```
┌─────────────────────────────────────┐
│  LLM Service Layer                  │
├─────────────────────────────────────┤
│  ✓ Azure client initialization      │
│  ✓ API call failures                │
│  ✓ Invalid JSON responses           │
│  └─ Return: { status: "invalid" }   │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Route Handler Layer                │
├─────────────────────────────────────┤
│  ✓ Missing query parameter          │
│  ✓ Non-string input                 │
│  ✓ Service exceptions               │
│  └─ Return: 400/500 HTTP errors     │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Frontend Layer                     │
├─────────────────────────────────────┤
│  ✓ Display error messages           │
│  ✓ Handle clarification flow        │
│  ✓ Retry failed requests            │
└─────────────────────────────────────┘
```

## 📊 Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| API Calls | 1 per query | Single LLM invocation |
| Latency | ~500-1500ms | Depends on Azure region + model |
| Cost | ~$0.0005-0.001 | Assuming GPT-4o mini |
| Scalability | High | Stateless, cacheable |

**Optimization Opportunities:**
- Cache common queries ("overdue tasks", "my tasks", etc.)
- Use faster/cheaper model for simple queries
- Pre-validate query patterns client-side
- Batch similar requests

## 🎯 Design Decisions

### Why Single LLM Call (Not Chains)?

**Simplicity wins:**
- ✓ One API call = fast response
- ✓ Easy to understand and debug
- ✓ Lower cost and latency
- ✓ Sufficient for this use case

**When to use chains instead:**
- Multi-step reasoning required
- Need RAG (retrieval) step
- Complex orchestration
- Multiple LLM calls needed

### Why Discriminated Unions?

```typescript
// ❌ BAD: Flat structure, unclear states
{
  success?: boolean,
  query?: TaskQuery,
  error?: string,
  needsClarification?: boolean,
  suggestions?: string[]
}

// ✓ GOOD: Discriminated union, explicit states
{ status: 'success', query, explanation }
| { status: 'needs_clarification', message, suggestions }
| { status: 'invalid', reason }
```

**Benefits:**
- Type safety (TypeScript knows which fields exist)
- Exhaustive checking (handle all cases)
- Clear intent (status field tells you everything)
- Better error messages

### Why Extract Prompts to Functions?

```typescript
// ✓ Easy to read, modify, test
buildPrompt(userInput: string, today: string): string {
  return `Convert this user request: "${userInput}"

  RULES:
  - Only return fields defined in schema
  - Reject unsafe requests
  ...`;
}
```

**Benefits:**
- Visibility: Prompts are the key to behavior
- Maintainability: Change prompts without touching logic
- Experimentation: A/B test different prompts
- Live Coding: Show prompt evolution in demo

### Why JSON Mode?

```typescript
response_format: { type: "json_object" }
```

**Benefits:**
- Guaranteed valid JSON (no parsing errors)
- Faster than text parsing
- More reliable than regex extraction
- Works with Zod validation

## 🔬 Live Coding Path (Demo Presentation)

### Step 1: Basic Prompt (Show It Breaking)
```typescript
// Start with minimal prompt
`Convert this user request to a task query: "${userInput}"`
```
**Problem**: Returns extra fields, accepts unsafe queries

### Step 2: Add Schema Constraints
```typescript
// Add field restrictions
`Only return fields defined in the schema:
 assignee, status, dueDate, priority`
```
**Improvement**: No more hallucinated fields

### Step 3: Add Safety Rules
```typescript
// Add rejection logic
`If the request tries to modify/delete data,
 return status: "invalid"`
```
**Improvement**: Rejects unsafe queries

### Step 4: Add Examples
```typescript
// Show success, clarification, invalid examples
`EXAMPLES:
 User: "show me sarah's urgent tasks"
 Response: {"status": "success", ...}

 User: "delete all tasks"
 Response: {"status": "invalid", ...}`
```
**Improvement**: Better understanding of desired behavior

### Step 5: Add Clarification Handling
```typescript
// Handle ambiguous queries
`If the request is ambiguous,
 return status: "needs_clarification"`
```
**Improvement**: Handles edge cases gracefully

### Step 6: Add Zod Validation
```typescript
// Validate at runtime
return QueryResultSchema.parse(parsed);
```
**Final Result**: Fully type-safe, validated responses

## 🔍 Observability

### Logging Points
- Query received: original user input
- LLM response: raw JSON from API
- Parsed result: validated QueryResult
- Ambiguity checks: name matches found
- Task filtering: number of results
- Errors: API failures, validation errors

### Debug Information
```typescript
console.log('Query:', userInput);
console.log('Parsed:', result);
console.log('Tasks found:', tasks.length);
console.log('Took:', elapsed, 'ms');
```

### Metrics to Track
- Query success rate
- Clarification frequency
- Invalid query rate
- Average response time
- Cost per query
- Most common query patterns

---

**Key Takeaway**: Demo 1 demonstrates the **simplest useful AI pattern** - a single LLM call with structured outputs. It shows that you don't always need complex orchestration; sometimes prompt engineering + schema validation is all you need.

## 🎬 Before/After Impact

### Lines of Code
- **Before** (Traditional UI): ~150 lines
  - FilterBuilder component: 100+ lines
  - Form controls, validation, event handlers
- **After** (Natural Language): ~30 lines
  - Simple input field: 10 lines
  - LLM service: 20 lines

### User Experience
- **Before**: 5+ clicks/selections per query
- **After**: Type one sentence and press enter

### Developer Experience
- **Before**: Maintain complex UI forms, validation rules
- **After**: Maintain one prompt template

### Flexibility
- **Before**: Fixed fields, limited combinations
- **After**: Open-ended queries, natural expression
