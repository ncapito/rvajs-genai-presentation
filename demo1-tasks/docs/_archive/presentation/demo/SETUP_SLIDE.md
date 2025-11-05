# Demo 1 Setup: Natural Language Task Search

## Quick Context (30 seconds before demo)

**The Challenge:**
Replace a complex filter UI (100+ lines) with a natural language text input (10 lines)

**The Stack (Don't overthink it!):**
- **Frontend:** Angular - just a text input
- **Backend:** Node.js + Express - one API route
- **LLM:** Azure OpenAI (GPT-4o) - the completions API you've already seen
- **Secret Sauce:** JSON Mode + Zod validation

---

## 3 Concepts You Need to Know

### 1. JSON Mode (15 seconds)
Modern LLMs can return structured JSON instead of plain text:
```javascript
response_format: { type: "json_object" }
```
→ You get: `{"status": "success", "query": {...}}`
→ Not: "Sure! Here's a query for you..."

### 2. Schema Validation with Zod (15 seconds)
TypeScript library that validates data shape at runtime:
```typescript
const QuerySchema = z.object({
  assignee: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional()
});
```
Like a contract: "I need EXACTLY these fields with EXACTLY these types"

### 3. Discriminated Unions (15 seconds)
Handle multiple response states with type safety:
```typescript
{ status: 'success', query: {...} }           // ✅ Return results
{ status: 'needs_clarification', message: ...} // ❓ Ask for more info
{ status: 'invalid', reason: ... }            // ❌ Reject unsafe requests
```

---

## Demo Flow (2 Parts)

### Part 1: Show It "Working" (5 min)
- Simple prompt, NO Zod validation
- Works for basic queries: "Sarah's tasks" ✅
- But watch what happens when we try:
  - Invalid status values
  - Injection attacks
  - Edge cases

**Takeaway:** LLMs are powerful but need guardrails!

### Part 2: Make It Production-Ready (5 min)
- Add Zod validation (line 67)
- Improve prompt with safety rules
- Add examples and constraints
- Handle ambiguity gracefully

**Takeaway:** Prompt engineering + validation = production-ready AI

---

## The Punchline

**Before:** 100+ lines of dropdowns, date pickers, form state
**After:** 10 lines of text input + one LLM call

**And it's more intuitive for users!** 🚀
