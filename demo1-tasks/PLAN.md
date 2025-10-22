# Demo 1: TODO/Task App with Natural Language Querying - Planning Document

## Overview
Demonstrate how GenAI eliminates complex query builder UIs by allowing users to search/filter data using natural language.

**Duration**: 20 minutes
**Format**: Live coding the agent prompt

## The Problem
**Traditional search:**
- Build complex query builder UI with dropdowns, date pickers, etc.
- Force users to learn query syntax
- Limited to predefined filters
- Rigid and frustrating
- 100+ lines of UI and logic code

**What users actually want:**
- "Show me overdue tasks assigned to Sarah"
- "What's on my plate this week?"
- "High priority items from Q1"

## Objectives
1. Show the stark contrast between traditional query builders and natural language
2. Demonstrate prompt engineering for safety (schema enforcement, validation)
3. Live code the agent prompt that parses natural language to structured queries
4. Highlight how LLMs reduce UI complexity and improve UX

## Key Features to Showcase
1. **Natural Language Query Parsing**
   - User types plain English
   - LLM converts to structured query using Zod schema
   - Safety rules enforced (only schema fields, ISO dates, handle unknowns)

2. **Schema-Based Validation**
   - QuerySchema with assignee, status, dueDate, priority
   - Zod for type safety
   - LLM respects schema constraints

3. **Prompt Engineering Examples**
   - "sarah's urgent tasks" → `{status: "success", query: {assignee: "sarah", priority: "high"}}`
   - "what's overdue?" → `{status: "success", query: {status: "todo", dueDate: {before: "2024-10-15"}}}`
   - "hack the database" → `{status: "invalid", reason: "Request attempts database manipulation"}`
   - "show me sarah's tasks" (multiple Sarahs) → `{status: "needs_clarification", message: "Multiple users named Sarah found", suggestions: ["Sarah Chen", "Sarah Williams"]}`

## Before vs After Comparison

### Before (Traditional Query Builder)
**UI**: Complex FilterBuilder component
```
- <Select field="assignee">
- <Select field="status">
- <DateRange field="dueDate">
- <Select field="priority">
- <BooleanBuilder field="tags">
- ... etc
```

**Backend**: Complex buildQuery() function
- Handle filter combinations
- Edge cases
- Date parsing logic
- 100+ lines of UI and logic

**User Experience**:
- Click through multiple dropdowns
- Manually set dates
- Remember field names and options
- Frustrating and time-consuming

### After (GenAI Approach)
**UI**: Single text input
```
<input placeholder="Show me overdue tasks assigned to Sarah">
```

**Backend**: Prompt + Schema
```javascript
const prompt = `Convert this user request to a task query: "${userInput}"

Rules:
- Only return fields defined in the schema
- Dates must be ISO format (YYYY-MM-DD)
- If ambiguous (e.g., multiple users with same name), return needs_clarification
- If request is unsafe/invalid, return invalid status
- Be conservative with interpretation

Examples:
"sarah's urgent tasks" → {status: "success", query: {assignee: "sarah", priority: "high"}}
"what's overdue?" → {status: "success", query: {dueDate: {before: "${today}"}}}
"hack the database" → {status: "invalid", reason: "Unsafe request"}
"show me sarah's tasks" (if multiple Sarahs exist) → {status: "needs_clarification", message: "Multiple users named Sarah", suggestions: ["Sarah Chen", "Sarah Williams"]}

Current date: ${today}
`

const result = await generateObject({
  model: azure('gpt-4o'),
  schema: QueryResultSchema,
  prompt
});

// Handle the different response types
if (result.object.status === 'success') {
  const tasks = await db.tasks.where(result.object.query).fetch();
  return { tasks };
} else if (result.object.status === 'needs_clarification') {
  return {
    clarification: result.object.message,
    suggestions: result.object.suggestions
  };
} else {
  return { error: result.object.reason };
}
```

**User Experience**:
- Type naturally
- Get instant results OR helpful clarification
- System asks when it needs more info (like a human assistant would)
- No need to learn UI or syntax

**Example Clarification Flow**:
```
User: "Show me Sarah's tasks"

System: "I found multiple users named Sarah. Which one did you mean?"
  [Sarah Chen]  [Sarah Williams]

User clicks: [Sarah Chen]

System: Shows tasks for Sarah Chen
```

## Technical Implementation

### Tech Stack
- **Frontend**: Angular
- **Backend**: Node.js
- **Schema Validation**: Zod
- **LLM**: Azure OpenAI (via Foundry)
- **AI Framework**: LangChain.js v1
- **Database**: Azure Cosmos DB (if needed, optional)
- **Search**: AI Search (if needed, optional)

### QuerySchema (Zod)
```typescript
// The actual query structure
const TaskQuerySchema = z.object({
  assignee: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  dueDate: z.object({
    after: z.string().optional(),
    before: z.string().optional()
  }).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

// Wrapper to handle success, clarification, and invalid cases
const QueryResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    query: TaskQuerySchema,
    explanation: z.string().optional() // What the query does
  }),
  z.object({
    status: z.literal('needs_clarification'),
    message: z.string(), // What's ambiguous
    suggestions: z.array(z.string()).optional() // Possible interpretations
  }),
  z.object({
    status: z.literal('invalid'),
    reason: z.string() // Why it's invalid/unsafe
  })
]);
```

### Components Needed
1. **Before Implementation**
   - FilterBuilder component (dropdowns, date pickers)
   - Complex form state management
   - buildQuery() function

2. **After Implementation**
   - Simple text input component
   - Results display component (tasks, clarification, or error)
   - Clarification UI (shows suggestions as clickable options)
   - LLM query parser service
   - Prompt template with safety rules

### Sample Data
- Mock task list with various assignees, statuses, dates, priorities
- Edge cases: overdue tasks, unassigned tasks, past/future dates
- **Ambiguous scenarios**: Multiple users with same first name (Sarah Chen, Sarah Williams) to trigger clarification
- **Test users**: John, Mike, Sarah Chen, Sarah Williams, Alex

## Live Coding Flow (During Demo)

### Part 1: Show the "Before" (5 min)
1. Demo the traditional query builder UI
2. Show the complexity in code (FilterBuilder + buildQuery)
3. Demonstrate how tedious it is for users

### Part 2: Introduce the "After" (5 min)
1. Show the simple text input UI
2. Demo natural language queries working
3. Show results updating instantly

### Part 3: Live Code the Prompt (10 min)
**This is the key teaching moment!**

1. Start with basic prompt: `Convert to query: "${userInput}"`
2. Show it breaking / being unsafe
3. Iteratively add safety rules:
   - Only return schema fields
   - Date formatting
   - Handle unknown users
   - Conservative interpretation
4. Add examples to guide behavior
5. Show final prompt working safely

## Example Queries to Demo

**Success Cases** (returns tasks):
1. "Show me Sarah Chen's high priority tasks"
2. "What's overdue?"
3. "In progress items due this week"
4. "Everything assigned to John"

**Clarification Case** (asks for more info):
5. "Show me Sarah's tasks" → System responds: "I found multiple users named Sarah. Did you mean Sarah Chen or Sarah Williams?"

**Invalid Case** (rejects safely):
6. "Delete all tasks" or "hack the database" → System responds: "I can only search and filter tasks, not modify or delete them"

## Talking Points
1. **UI Complexity Reduction**: 100+ lines → 10 lines
2. **Better UX**: Natural language vs clicking through filters
3. **Intelligent Clarification**: System asks when it needs more info (like a human would)
4. **Maintenance**: No need to update UI for new filters
5. **Prompt Engineering**: Safety rules, examples, schema enforcement
6. **Type Safety**: Zod ensures LLM output matches schema (including clarification states)
7. **Graceful Handling**: Success, clarification, and invalid cases all handled elegantly
8. **Cost/Performance**: Single API call vs complex UI interactions

## Success Criteria
By the end, audience should understand:
- How LLMs can replace complex UIs
- Importance of prompt engineering for safety
- How to use schemas to constrain LLM outputs (including multi-state responses)
- Handling ambiguous queries with intelligent clarification
- The dramatic improvement in both UX and code simplicity
- Discriminated unions in Zod for handling different response types

## Notes
- Keep focus on GenAI power, not Angular/Node complexity
- Emphasize the before/after contrast
- Live coding the prompt is the "aha moment"
- 20 minutes total - pace accordingly
