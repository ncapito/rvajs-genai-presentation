# Demo 2: Receipt Parsing & Task Matching

## Part 1: Simple Receipt Parsing

### The Problem

**Manual receipt entry is tedious and error-prone:**
- Employees type in merchant, date, amount manually
- Typos and mistakes are common
- Takes 2-3 minutes per receipt
- No validation until later

**What if receipts could parse themselves?**

---

## The Solution: Vision API + Zod Schema

### A multimodal approach

```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2000,
  temperature: 0.0,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', data: imageData } },
        { type: 'text', text: RECEIPT_PARSING_PROMPT }
      ]
    }
  ]
});

// Validate with Zod schema
const validated = ReceiptParseResultSchema.parse(JSON.parse(response.content[0].text));
```

**Result:** Parses ANY receipt format in one call!

---

### The Prompt

```
Analyze this receipt image and extract structured data.

CRITICAL: Respond with ONLY raw JSON. Do NOT wrap in markdown code blocks.

IMPORTANT RULES:
- If this is clearly a receipt, parse it and return status: "success"
- If image quality is poor but you can read some fields, return status: "partial"
- If this is not a receipt (e.g., a document, random image), return status: "not_a_receipt"
- If image is completely unreadable, return status: "unreadable" with suggestions

For successful/partial parsing:
- Return all amounts as numbers (no currency symbols)
- Date in ISO format (YYYY-MM-DD)
- merchant: string (just the name, e.g. "Starbucks")
- category: one of: "food", "retail", "office", "travel", "entertainment", "other"
  * food: restaurants, cafes, grocery stores
  * retail: clothing, electronics, general stores
  * office: office supplies, business services
  * travel: gas stations, airlines, hotels
  * entertainment: movies, events, recreation
  * other: anything else
- confidence: "high", "medium", or "low" based on image quality
- items (if visible): array with "description", "price", "quantity"

EXACT JSON SCHEMA:

SUCCESS:
{
  "status": "success",
  "receipt": {
    "merchant": "Store Name",
    "date": "2025-10-31",
    "subtotal": 50.00,
    "tax": 4.50,
    "total": 54.50,
    "category": "food",
    "items": [{"description": "Coffee", "price": 5.50, "quantity": 2}],
    "confidence": "high"
  }
}

PARTIAL:
{
  "status": "partial",
  "receipt": { /* what we could read */ },
  "missingFields": ["subtotal", "items"],
  "message": "Bottom of receipt is faded",
  "suggestions": ["Retake photo with better lighting"]
}

NOT A RECEIPT:
{
  "status": "not_a_receipt",
  "reason": "This appears to be a menu, not a receipt"
}

UNREADABLE:
{
  "status": "unreadable",
  "reason": "Image is too blurry to read",
  "suggestions": ["Retake photo with better focus", "Ensure good lighting"]
}
```

---

## Why Zod Schema Validation?

### Type Safety + Runtime Validation

```typescript
const ReceiptDataSchema = z.object({
  merchant: z.string(),
  date: z.string(), // ISO format
  subtotal: z.number().optional(),
  tax: z.number(),
  total: z.number(),
  category: z.enum(['food', 'retail', 'office', 'travel', 'entertainment', 'other']),
  items: z.array(z.object({
    description: z.string(),
    price: z.number(),
    quantity: z.number().optional()
  })).optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional()
});
```

**Benefits:**
- ✅ **Enforces structure** - LLM must return correct format
- ✅ **Type safety** - TypeScript knows the shape
- ✅ **Runtime validation** - Catches unexpected responses
- ✅ **Clear contract** - LLM knows exactly what to return

---

## Graceful Error Handling

### Four Response States

```typescript
const ReceiptParseResultSchema = z.discriminatedUnion('status', [
  // ✅ Success: Clean, readable receipt
  z.object({
    status: z.literal('success'),
    receipt: ReceiptDataSchema,
    notes: z.string().optional()
  }),

  // ⚠️ Partial: Some fields missing but recoverable
  z.object({
    status: z.literal('partial'),
    receipt: ReceiptDataSchema,
    missingFields: z.array(z.string()),
    message: z.string(),
    suggestions: z.array(z.string()).optional()
  }),

  // ❌ Not a Receipt
  z.object({
    status: z.literal('not_a_receipt'),
    reason: z.string()
  }),

  // ❌ Unreadable
  z.object({
    status: z.literal('unreadable'),
    reason: z.string(),
    suggestions: z.array(z.string())
  })
]);
```

**Not just success/failure** - Handle real-world scenarios gracefully!

---

## Part 1 Demo

### Show These Scenarios:

1. **Grocery receipt** → `status: "success"`
2. **Restaurant receipt** → `status: "success"`
3. **Handwritten receipt** → `status: "success"` 🎉 **WOW moment!**
4. (Optional) **Faded receipt** → `status: "partial"` with suggestions

**Key Point:** Same code handles all formats!

---

## Part 2: Receipt Matching to Tasks

### The Problem

**After parsing, employees still manually match receipts to project tasks:**
- "Was this coffee for the marketing project or client meeting?"
- "Which budget code should I use?"
- Look through 50+ active tasks
- Takes 5 minutes, error-prone

**What if receipts could match themselves to tasks?**

---

## The Challenge: Semantic Matching

**We need to:**
1. Parse the receipt (Step 1 ✅)
2. Search tasks semantically ("Starbucks" → "Team coffee" task)
3. Filter by date (receipt date within task period)
4. Rank by budget fit (receipt amount vs task budget)
5. Let AI pick the best match

**Two architectural approaches:**
- **Approach 2a:** Developer controls the workflow (LangChain)
- **Approach 2b:** LLM controls the workflow (Tool Calling)

---

## Approach 2a: LangChain Orchestration

### Developer Controls the Workflow

```typescript
private runMatchingChain(receipt: ReceiptData): Promise<MatchResult> {
  const semanticSearchStep = RunnableLambda.from(this.semanticSearchStep.bind(this));
  const dateFilterStep = RunnableLambda.from(this.dateFilterStep.bind(this));
  const budgetRankStep = RunnableLambda.from(this.budgetRankStep.bind(this));
  const llmAnalysisStep = RunnableLambda.from(this.llmAnalysisStep.bind(this));

  return semanticSearchStep
    .pipe(dateFilterStep)
    .pipe(budgetRankStep)
    .pipe(llmAnalysisStep)
    .invoke({ receipt });
}
```

**Flow:** Parse → Search → Filter → Rank → Decide

---

## Step 1: Semantic Search

### Developer Decides Query Construction

```typescript
private async semanticSearchStep(input: { receipt: ReceiptData }) {
  const vectorStore = getVectorStore();

  // 🔑 KEY: Developer hardcodes query construction
  const query = `${input.receipt.merchant} ${input.receipt.category || ''} ${input.receipt.notes || ''}`;

  console.log(`[Chain Step 1/4] Semantic search with query: ${query}`);
  const results = await vectorStore.similaritySearch(query, 10);

  return { ...input, semanticMatches: results };
}
```

**Example:** Receipt from "Starbucks" → Query: `"Starbucks food"`

---

## Step 2: Date Filtering

### Deterministic Business Logic (No LLM)

```typescript
private async dateFilterStep(input: { receipt: ReceiptData; semanticMatches: any[] }) {
  console.log('[Chain Step 2/4] Filtering by date range...');

  const receiptDate = new Date(input.receipt.date);
  const filtered = input.semanticMatches.filter(task => {
    const createdAt = new Date(task.createdAt);
    const dueDate = new Date(task.dueDate);
    return receiptDate >= createdAt && receiptDate <= dueDate;
  });

  return { ...input, dateFiltered: filtered };
}
```

**Pure code logic** - Fast, deterministic, no API call

---

## Step 3: Budget Ranking

### Business Logic for Budget Fit

```typescript
private async budgetRankStep(input: { receipt: ReceiptData; dateFiltered: any[] }) {
  const ranked = input.dateFiltered
    .filter(task => input.receipt.total <= task.budget)
    .map(task => {
      const utilization = (input.receipt.total / task.budget) * 100;
      return {
        ...task,
        utilizationPercentage: parseFloat(utilization.toFixed(2)),
        remaining: task.budget - input.receipt.total
      };
    })
    .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

  return { ...input, rankedTasks: ranked };
}
```

**Example:** $45 receipt → Task with $150 budget = 30% utilization (good fit!)

---

## Step 4: LLM Analysis

### AI Picks Best Match

```typescript
private async llmAnalysisStep(input: { receipt: ReceiptData; rankedTasks: any[] }) {
  const prompt = `Analyze these matches and pick the best one:

Receipt: ${input.receipt.merchant} - $${input.receipt.total}

Top Matches:
${input.rankedTasks.slice(0, 3).map((task, i) => `
${i + 1}. ${task.title} - $${task.budget} (${task.utilizationPercentage}% utilization)
`).join('\n')}

Respond with JSON: { "bestTaskId": "task-XX", "confidence": 85, "reasoning": "..." }`;

  const response = await model.invoke([new HumanMessage({ content: prompt })]);
  const analysis = JSON.parse(response.content);

  return { reasoning: analysis.reasoning, match: findTask(analysis.bestTaskId) };
}
```

**LLM decides** which of the filtered candidates is best

---

## Approach 2b: Tool Calling

### LLM Controls the Workflow

```typescript
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_tasks_semantic',
    description: 'Search for tasks using semantic similarity',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Semantic search query' },
        limit: { type: 'number', default: 10 }
      },
      required: ['query']
    }
  },
  {
    name: 'filter_by_date_range',
    description: 'Filter tasks by receipt date',
    // ...
  },
  {
    name: 'rank_by_budget_match',
    description: 'Rank tasks by budget fit',
    // ...
  }
];
```

**LLM decides:** Which tools to use, when, and with what inputs

---

## Tool Calling Loop

### LLM Orchestrates

```typescript
let response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  tools: TOOLS,
  messages: [{ role: 'user', content: prompt }]
});

// Tool calling loop
while (response.stop_reason === 'tool_use') {
  const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');

  // Execute each tool
  for (const toolUse of toolUseBlocks) {
    sendSSE(res, 'tool_call', { name: toolUse.name, input: toolUse.input });

    const result = await executeTool(toolUse.name, toolUse.input);

    sendSSE(res, 'tool_result', { name: toolUse.name, result });
  }

  // Continue conversation with results
  response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    tools: TOOLS,
    messages: [...messages, { role: 'user', content: toolResults }]
  });
}
```

**Streams progress via SSE** - User sees AI reasoning in real-time

---

### The Prompt (Tool Calling)

```
You are a helpful assistant that matches expense receipts to project tasks.

Given this receipt:
- Merchant: ${receipt.merchant}
- Amount: $${receipt.total}
- Date: ${receipt.date}
- Category: ${receipt.category || 'unknown'}

Your goal is to find the best matching task for this expense.

You have access to tools for semantic search, date filtering, and budget matching.
Use these tools intelligently - you may not need all of them.

After analyzing, provide your final recommendation as JSON in this EXACT format:

{
  "taskId": "task-26",
  "confidence": 85,
  "reasons": [
    "Semantic match: Receipt for AWS matches 'Setup AWS cloud infrastructure' task",
    "Budget fit: $127.43 of $150.00 budget (85% utilization)",
    "Date match: Receipt date falls within task work period"
  ]
}

If no good match exists, use "taskId": null and explain why in reasons.
```

---

## 🔑 KEY DIFFERENCE: Query Construction

### Approach 2a: Chain (Developer Controlled)

```typescript
// Step 1: Semantic Search
const query = `${input.receipt.merchant} ${input.receipt.category || ''} ${input.receipt.notes || ''}`;
// Query: "Starbucks food "
```

**Developer hardcodes** the query logic

---

### Approach 2b: Tool Calling (LLM Controlled)

```typescript
// Claude decides to call: search_tasks_semantic
// Claude constructs query: "Coffee shop food and beverage expenses"
// (More semantic, context-aware!)
```

**LLM constructs** the query based on understanding

---

## Demo Moment

**Run same receipt through both approaches:**

**Chain Service:**
```
[Chain Step 1/4] Semantic search with query: "Starbucks food "
Found 8 tasks
```

**Matching Service:**
```
Claude is thinking...
Tool call: search_tasks_semantic
  Input: { query: "Coffee and beverage expenses for office team" }
Found 5 tasks (more relevant!)
```

**Point out:** Same receipt, different queries → LLM builds **smarter, more contextual** queries!

---

## When to Use Which Approach

| Scenario | Best Approach |
|----------|---------------|
| **Simple parsing only** | Vision API (Part 1) |
| **Need explicit control** | LangChain (Approach 2a) |
| **Complex decisions** | Tool Calling (Approach 2b) |
| **Show progress to user** | Tool Calling + SSE (Approach 2b) |
| **Speed is critical** | LangChain (Approach 2a) |
| **Deterministic workflow** | LangChain (Approach 2a) |
| **Dynamic workflow** | Tool Calling (Approach 2b) |

---

## Key Takeaways

### ✅ Part 1: Simple Parsing
- Vision + Zod schema = Structured extraction
- Handles any format (printed, handwritten)
- Graceful error handling (4 states)
- Single API call, production-ready

### ✅ Part 2: Complex Workflow
- Parse → Search → Filter → Rank → Match
- **Two patterns:** Developer control vs LLM control
- **Key difference:** Query construction
- Real-time streaming shows AI reasoning

### ✅ When to Use What
- Simple task? → Single API call
- Complex workflow, explicit control? → LangChain
- Complex workflow, let AI decide? → Tool Calling

---

## 🎯 Demo Flow

**Part 1: Parsing (5 min)**
1. Show Vision API parsing code
2. Show Zod schema enforcement
3. Parse grocery receipt → Success
4. Parse restaurant receipt → Success
5. **Parse handwritten receipt → WOW!** 🎉

**Part 2: Matching (10 min)**
6. Introduce the problem (manual task matching)
7. Show Chain approach (4 steps)
8. Show Tool Calling approach
9. **Compare query construction** (the key difference!)
10. Show SSE streaming in action

---

## The Power of Vision + Structure

**Before:** Manual entry, error-prone, slow
**After:** Snap photo, AI handles everything

**Before:** Manual task matching, 5 minutes
**After:** AI suggests best match instantly

### This is production-ready AI! 🚀
