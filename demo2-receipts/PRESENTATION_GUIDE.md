# Demo 2: Receipt Parsing - Presentation Guide

This guide provides all the code snippets and talking points you need for the demo WITHOUT having to jump between files in your code editor.

**Duration**: 15-20 minutes
**Format**: Live demo + live coding (tax percentage)

---

## 📋 Table of Contents

1. [Quick Overview](#quick-overview)
2. [The Problem: Traditional Parsing](#the-problem-traditional-parsing)
3. [Implementation 1: Simple Vision API (PRIMARY)](#implementation-1-simple-vision-api-primary)
4. [Implementation 2: LangChain Orchestration (TEACHING)](#implementation-2-langchain-orchestration-teaching)
5. [Implementation 3: Tool Calling with Streaming (ADVANCED)](#implementation-3-tool-calling-with-streaming-advanced)
6. [Key Differences: Chain vs Tool Calling](#key-differences-chain-vs-tool-calling)
7. [Live Coding: Adding Tax Percentage](#live-coding-adding-tax-percentage)
8. [Receipt-to-Task Matching](#receipt-to-task-matching)
9. [Talking Points](#talking-points)

---

## Quick Overview

**Demo 2 shows three architectural approaches to receipt parsing:**

1. **Simple (Vision Service)**: Single Claude Vision API call → Perfect for straightforward parsing
2. **Orchestrated (Chain Service)**: Multi-step LangChain pipeline → When you need explicit control
3. **Intelligent (Matching Service)**: Tool calling + SSE streaming → When LLM should decide the workflow

**The big teaching moment**: Show when to use which approach!

---

## The Problem: Traditional Parsing

### Before: Brittle Text-Only Parsing

**File**: `N/A (pseudo-code for demonstration)`

```typescript
// Traditional approach - PSEUDO CODE TO SHOW AUDIENCE
function parseReceipt(text: string): Receipt {
  // Assume specific format - BREAKS EASILY!
  const lines = text.split('\n');

  // Find total - fragile regex!
  const totalLine = lines.find(l =>
    l.includes('Total') || l.includes('TOTAL')
  );
  const total = parseFloat(
    totalLine?.match(/\$?(\d+\.\d{2})/)?.[1] || '0'
  );

  // Find date - breaks on different formats!
  const dateLine = lines.find(l =>
    /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(l)
  );
  const date = dateLine?.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)?.[0];

  // Find tax - assumes "Tax:" label exists
  const taxLine = lines.find(l => l.toLowerCase().includes('tax'));
  const tax = parseFloat(
    taxLine?.match(/\$?(\d+\.\d{2})/)?.[1] || '0'
  );

  // ... 50 more lines of brittle regex ...

  // ❌ Can't handle images at all!
  // ❌ Can't handle handwritten receipts!
  // ❌ Breaks on new formats!
  // ❌ No error handling - just crashes or returns garbage

  return { total, date, tax };
}
```

**Talking Points:**
- ❌ Only works for **text input** (no images)
- ❌ **Format-specific** assumptions (breaks on new layouts)
- ❌ **Brittle regex** patterns (Total vs TOTAL vs total)
- ❌ **No handwriting support** (impossible with regex)
- ❌ **No error handling** (crashes or returns bad data)
- ❌ **High maintenance** (every new format needs new code)
- ❌ 100+ lines of if/else statements for common formats

---

## Implementation 1: Simple Vision API (PRIMARY)

**File**: `backend/src/services/vision.service.ts`

This is your **primary demo** - simple, fast, production-ready.

### The Code

```typescript
import Anthropic from '@anthropic-ai/sdk';

export class VisionService {
  private client: Anthropic;

  async parseReceipt(imageData: string, mimeType: string): Promise<any> {
    // Single Claude Vision API call with structured output
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.0,  // Deterministic for data extraction
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageData,
              },
            },
            {
              type: 'text',
              text: RECEIPT_PARSING_PROMPT  // See prompts section below
            }
          ],
        },
      ],
    });

    // Parse JSON response
    const parsed = JSON.parse(response.content[0].text);

    // Validate with Zod schema
    const validated = ReceiptParseResultSchema.parse(parsed);

    return validated;
  }
}
```

### The Prompt

**File**: `backend/src/shared/prompts/receipt.prompt.ts`

```typescript
export const RECEIPT_PARSING_PROMPT = `
Analyze this image and extract receipt data.

CRITICAL: Respond with ONLY raw JSON. Do NOT wrap in markdown code blocks.

Rules:
- If this is clearly a receipt, parse it and return status: "success"
- If image quality is poor but you can read some fields, return status: "partial"
  with what you found + missingFields array
- If this is not a receipt (e.g., invoice, bill), return status: "not_a_receipt"
- If image is completely unreadable, return status: "unreadable" with suggestions

For successful/partial parsing:
- Return all amounts as numbers (no currency symbols)
- Date in ISO format (YYYY-MM-DD)
- Categorize based on merchant type (food/retail/office/travel/entertainment/other)
- Calculate tax percentage: (tax/subtotal)*100, round to 2 decimals
- Set confidence level: high (clear), medium (some uncertainty), low (poor quality)
- If handwritten, read carefully

Response JSON format for SUCCESS:
{
  "status": "success",
  "receipt": {
    "merchant": "Joe's Coffee Shop",
    "date": "2024-10-15",
    "subtotal": 12.50,
    "tax": 1.13,
    "taxPercentage": 9.04,
    "total": 13.63,
    "category": "food",
    "items": [
      { "description": "Coffee", "price": 8.00, "quantity": 2 },
      { "description": "Muffin", "price": 4.50, "quantity": 1 }
    ],
    "paymentMethod": "Credit Card",
    "confidence": "high"
  },
  "notes": "Handwritten receipt, all fields clearly legible"
}

Response JSON format for PARTIAL:
{
  "status": "partial",
  "receipt": {
    "merchant": "Corner Store",
    "total": 25.43,
    "category": "retail",
    "confidence": "medium"
  },
  "missingFields": ["date", "tax", "items"],
  "message": "Bottom portion of receipt is faded and unreadable",
  "suggestions": [
    "Retake photo with better lighting",
    "Try to flatten the receipt"
  ]
}

Response JSON format for NOT_A_RECEIPT:
{
  "status": "not_a_receipt",
  "reason": "This appears to be an invoice or bill, not a point-of-sale receipt",
  "suggestion": "Please upload a receipt from a purchase transaction"
}

Response JSON format for UNREADABLE:
{
  "status": "unreadable",
  "reason": "Image is too blurry and dark to read any text",
  "suggestions": [
    "Take photo in better lighting",
    "Hold camera steady to avoid blur",
    "Move closer to the receipt"
  ]
}
`;
```

### The Schema (Discriminated Union)

**File**: `backend/src/schemas/receipt.schema.ts`

```typescript
import { z } from 'zod';

// Base receipt data structure
export const ReceiptDataSchema = z.object({
  merchant: z.string(),
  date: z.string(), // ISO format YYYY-MM-DD
  subtotal: z.number().optional(),
  tax: z.number(),
  taxPercentage: z.number().optional(), // 👈 LIVE CODE THIS!
  total: z.number(),
  category: z.enum(['food', 'retail', 'office', 'travel', 'entertainment', 'other']),
  items: z.array(z.object({
    description: z.string(),
    price: z.number(),
    quantity: z.number().optional()
  })).optional(),
  paymentMethod: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional()
});

// Discriminated union for multi-state responses
export const ReceiptParseResultSchema = z.discriminatedUnion('status', [
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

  // ❌ Not a Receipt: Wrong document type
  z.object({
    status: z.literal('not_a_receipt'),
    reason: z.string(),
    suggestion: z.string().optional()
  }),

  // ❌ Unreadable: Image quality too poor
  z.object({
    status: z.literal('unreadable'),
    reason: z.string(),
    suggestions: z.array(z.string())
  })
]);
```

### Talking Points for Implementation 1

**Why this approach:**
- ✅ **Single API call** - fast (2-3 seconds), simple
- ✅ **Production-ready** - reliable, low failure points
- ✅ **Claude Vision + reasoning** in one step
- ✅ **Graceful error handling** - 4 distinct states
- ✅ **Actionable feedback** - specific suggestions for fixing issues
- ✅ **Easy to explain** - no complex orchestration

**When to use:**
- Simple, direct tasks (like receipt parsing)
- Speed matters
- Single model can handle everything
- Lower cost/complexity preferred

**Demo Flow:**
1. Show 3 different **printed receipts** (grocery, restaurant, retail) → All parse perfectly
2. Show **handwritten receipt** → WOW moment! 🎉
3. (Optional) Show **faded receipt** → Partial success with missing fields
4. (Optional) Show **non-receipt image** → "not_a_receipt" with helpful message

---

## Implementation 2: LangChain Orchestration (TEACHING)

**File**: `backend/src/services/chain.service.ts`

This shows **when and why to use orchestration** - explicit control over each step.

### The 4-Step Chain

```typescript
import { RunnableLambda } from '@langchain/core/runnables';

export class ChainService {
  /**
   * Match receipt to task using LangChain orchestration
   * Demonstrates explicit step-by-step workflow control
   */
  async matchReceiptToTask(receipt: ReceiptData): Promise<MatchResult> {
    // Build and execute the chain
    const result = await this.runMatchingChain(receipt);
    return result;
  }

  /**
   * Build the matching chain (4 explicit steps)
   */
  private runMatchingChain(receipt: ReceiptData): Promise<MatchResult> {
    // Create runnable steps from methods
    const semanticSearchStep = RunnableLambda.from(this.semanticSearchStep.bind(this));
    const dateFilterStep = RunnableLambda.from(this.dateFilterStep.bind(this));
    const budgetRankStep = RunnableLambda.from(this.budgetRankStep.bind(this));
    const llmAnalysisStep = RunnableLambda.from(this.llmAnalysisStep.bind(this));

    // Compose the chain: semantic search → date filter → budget rank → LLM analysis
    return semanticSearchStep
      .pipe(dateFilterStep)
      .pipe(budgetRankStep)
      .pipe(llmAnalysisStep)
      .invoke({ receipt });
  }
}
```

### Step 1: Semantic Search (Vector Store)

```typescript
/**
 * Step 1: Semantic search using vector store
 */
private async semanticSearchStep(input: { receipt: ReceiptData }) {
  const vectorStore = getVectorStore();

  // 🔑 KEY DIFFERENCE: Hardcoded query construction
  const query = `${input.receipt.merchant} ${input.receipt.category || ''} ${input.receipt.notes || ''}`;

  console.log(`[Chain Step 1/4] Semantic search with query: ${query}`);
  const results = await vectorStore.similaritySearch(query, 10);

  const tasks = results.map(doc => ({
    taskId: doc.metadata.taskId,
    title: doc.metadata.title,
    description: doc.metadata.description,
    budget: doc.metadata.budget,
    createdAt: doc.metadata.createdAt,
    dueDate: doc.metadata.dueDate,
    assignee: doc.metadata.assignee,
  }));

  console.log(`  Found ${tasks.length} semantically similar tasks`);
  return { ...input, semanticMatches: tasks };
}
```

### Step 2: Date Filtering (Business Logic)

```typescript
/**
 * Step 2: Filter by date range (deterministic business logic)
 */
private async dateFilterStep(input: { receipt: ReceiptData; semanticMatches: any[] }) {
  console.log('[Chain Step 2/4] Filtering by date range...');

  const receiptDate = new Date(input.receipt.date);
  const filtered = input.semanticMatches.filter(task => {
    const createdAt = new Date(task.createdAt);
    const dueDate = new Date(task.dueDate);
    return receiptDate >= createdAt && receiptDate <= dueDate;
  });

  console.log(`  ${filtered.length} tasks match date range`);
  return { ...input, dateFiltered: filtered };
}
```

### Step 3: Budget Ranking (Business Logic)

```typescript
/**
 * Step 3: Rank by budget match (deterministic business logic)
 */
private async budgetRankStep(input: { receipt: ReceiptData; dateFiltered: any[] }) {
  console.log('[Chain Step 3/4] Ranking by budget match...');

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

  console.log(`  ${ranked.length} tasks ranked by budget fit`);
  return { ...input, rankedTasks: ranked };
}
```

### Step 4: LLM Analysis (Intelligent Decision)

```typescript
/**
 * Step 4: LLM analyzes and picks best match (intelligent decision)
 */
private async llmAnalysisStep(input: { receipt: ReceiptData; rankedTasks: any[] }): Promise<MatchResult> {
  console.log('[Chain Step 4/4] LLM analyzing results...');

  if (input.rankedTasks.length === 0) {
    return {
      reasoning: 'No tasks found matching receipt criteria',
      match: null
    };
  }

  const prompt = `You are analyzing expense receipt matching results.

Receipt Details:
- Merchant: ${input.receipt.merchant}
- Amount: $${input.receipt.total}
- Date: ${input.receipt.date}
- Category: ${input.receipt.category || 'unknown'}

Top Matching Tasks:
${input.rankedTasks.slice(0, 3).map((task, i) => `
${i + 1}. ${task.title}
   - Task ID: ${task.taskId}
   - Budget: $${task.budget} (${task.utilizationPercentage}% utilization)
   - Description: ${task.description || 'N/A'}
   - Period: ${task.createdAt} to ${task.dueDate}
   - Assignee: ${task.assignee || 'Unassigned'}
`).join('\n')}

Analyze these matches and determine:
1. Which task is the best match and why
2. Confidence score (0-100)
3. Key reasons for the match

Respond with JSON:
{
  "bestTaskId": "task-XX",
  "confidence": 85,
  "reasoning": "Brief explanation..."
}`;

  const model = getAnthropicModel();
  const message = new HumanMessage({ content: prompt });
  const response = await model.invoke([message]);

  const analysis = JSON.parse(response.content as string);

  const bestTask = input.rankedTasks.find(t => t.taskId === analysis.bestTaskId);

  if (!bestTask) {
    return { reasoning: 'Could not determine best match', match: null };
  }

  return {
    reasoning: analysis.reasoning,
    match: {
      taskId: bestTask.taskId,
      title: bestTask.title,
      description: bestTask.description,
      assignee: bestTask.assignee,
      budget: bestTask.budget,
      createdAt: bestTask.createdAt,
      dueDate: bestTask.dueDate,
      confidenceScore: analysis.confidence,
      matchReasons: [
        `Semantic match: Receipt matches task "${bestTask.title}"`,
        `Budget fit: $${input.receipt.total.toFixed(2)} of $${bestTask.budget.toFixed(2)} (${bestTask.utilizationPercentage}% utilization)`,
        `Date match: Receipt date falls within task work period`
      ]
    }
  };
}
```

### Talking Points for Implementation 2

**Why this approach:**
- ✅ **Explicit control** - developer decides exact sequence
- ✅ **Modularity** - each step is testable, swappable
- ✅ **Observability** - see each step executing with logs
- ✅ **Business logic** - deterministic filtering/ranking in code
- ✅ **Different models** - could use Claude for vision, GPT for analysis

**When to use:**
- Complex workflows with multiple steps
- Need deterministic business logic between LLM calls
- Want observability (see each step)
- Team collaboration (different devs own different steps)
- Advanced error handling (retry/fallback per step)

**Trade-offs:**
- ⚠️ More code to write and maintain
- ⚠️ You control the logic (pro and con)
- ⚠️ More latency (multiple steps)
- ⚠️ More failure points

---

## Implementation 3: Tool Calling with Streaming (ADVANCED)

**File**: `backend/src/services/matching.service.ts`

This shows **modern AI architecture** - let the LLM decide the workflow!

### The Tool Definitions

```typescript
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_tasks_semantic',
    description:
      'Search for tasks using semantic similarity based on merchant name, description, or category.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Semantic search query (e.g., "AWS cloud infrastructure", "office supplies")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'filter_by_date_range',
    description:
      'Filter tasks where the receipt date falls between task createdAt and dueDate.',
    input_schema: {
      type: 'object',
      properties: {
        taskIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of task IDs to filter',
        },
        receiptDate: {
          type: 'string',
          description: 'Receipt date in ISO format (YYYY-MM-DD)',
        },
      },
      required: ['taskIds', 'receiptDate'],
    },
  },
  {
    name: 'rank_by_budget_match',
    description:
      'Rank tasks by how well the receipt amount fits within the task budget.',
    input_schema: {
      type: 'object',
      properties: {
        taskIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of task IDs to rank',
        },
        receiptAmount: {
          type: 'number',
          description: 'Total amount from the receipt',
        },
      },
      required: ['taskIds', 'receiptAmount'],
    },
  },
];
```

### The Matching Logic (Tool Calling Loop)

```typescript
async matchReceiptToTask(receipt: ReceiptData, res: Response): Promise<void> {
  const client = this.getClient();

  sendSSE(res, 'progress', {
    step: 'start',
    message: `Starting analysis for ${receipt.merchant} - $${receipt.total}`,
  });

  const prompt = `You are a helpful assistant that matches expense receipts to project tasks.

Given this receipt:
- Merchant: ${receipt.merchant}
- Amount: $${receipt.total}
- Date: ${receipt.date}
- Category: ${receipt.category || 'unknown'}

Your goal is to find the best matching task for this expense.

You have access to tools for semantic search, date filtering, and budget matching.
Use these tools intelligently - you may not need all of them.

After analyzing, provide your final recommendation as JSON:
{
  "taskId": "task-26",
  "confidence": 85,
  "reasons": [
    "Semantic match: Receipt for AWS matches 'Setup AWS cloud infrastructure' task",
    "Budget fit: $127.43 of $150.00 budget (85% utilization)",
    "Date match: Receipt date falls within task work period"
  ]
}

If no good match exists, use "taskId": null and explain why.`;

  let messages: Anthropic.MessageParam[] = [{ role: 'user', content: prompt }];

  sendSSE(res, 'progress', {
    step: 'thinking',
    message: 'Claude is analyzing the receipt and deciding which tools to use...',
  });

  let response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    tools: TOOLS,
    messages,
  });

  // Tool calling loop
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (block) => block.type === 'tool_use'
    ) as Anthropic.ToolUseBlock[];

    // Extract reasoning (text blocks)
    const textBlocks = response.content.filter(
      (block) => block.type === 'text'
    ) as Anthropic.TextBlock[];

    if (textBlocks.length > 0) {
      const reasoning = textBlocks.map((block) => block.text).join('\n');
      sendSSE(res, 'reasoning', { text: reasoning });
    }

    // Execute each tool call
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      sendSSE(res, 'tool_call', {
        name: toolUse.name,
        input: toolUse.input,
      });

      let result: any;
      switch (toolUse.name) {
        case 'search_tasks_semantic':
          result = await this.searchTasksSemantic(toolUse.input, res);
          break;
        case 'filter_by_date_range':
          result = await this.filterByDateRange(toolUse.input, res);
          break;
        case 'rank_by_budget_match':
          result = await this.rankByBudgetMatch(toolUse.input, res);
          break;
      }

      sendSSE(res, 'tool_result', { name: toolUse.name, result });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    // Continue conversation with tool results
    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    sendSSE(res, 'progress', {
      step: 'thinking',
      message: 'Claude is analyzing the results...',
    });

    response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      tools: TOOLS,
      messages,
    });
  }

  // Extract final recommendation
  const match = this.extractBestMatch(reasoning, toolCalls);

  sendSSE(res, 'complete', { reasoning, toolCalls, match });
  res.end();
}
```

### Talking Points for Implementation 3

**Why this approach:**
- ✅ **LLM decides workflow** - intelligent tool selection
- ✅ **Real-time streaming** - shows reasoning via SSE
- ✅ **Flexible** - Claude can skip unnecessary steps
- ✅ **Transparent** - see exactly what the AI is doing
- ✅ **User experience** - live progress updates

**When to use:**
- User-facing applications (show progress)
- Complex decisions (let AI choose tools)
- Need transparency (audit trail)
- Workflow varies by input (not always same steps)

**🔑 KEY DIFFERENCE from Chain Service:**
- **Chain**: Developer hardcodes query: `merchant + category + notes`
- **Tool Calling**: LLM constructs query dynamically based on receipt analysis

---

## Key Differences: Chain vs Tool Calling

This is the **critical teaching moment** - showing the difference between developer-controlled and LLM-controlled workflows.

### Side-by-Side Comparison

| Aspect | Chain Service (Orchestrated) | Matching Service (Tool Calling) |
|--------|------------------------------|----------------------------------|
| **Control** | Developer decides sequence | LLM decides which tools to use |
| **Query Construction** | Hardcoded: `merchant + category + notes` | LLM constructs query from receipt analysis |
| **Flexibility** | Fixed 4-step pipeline | Dynamic - can skip steps |
| **Observability** | Console logs per step | SSE streaming with reasoning |
| **Execution** | Always runs all 4 steps | Only runs tools LLM deems necessary |
| **Best For** | Predictable workflows | Variable workflows |

### Visual Example: Query Construction

#### Chain Service (Developer Controlled)
```typescript
// Step 1: Semantic Search
const query = `${input.receipt.merchant} ${input.receipt.category || ''} ${input.receipt.notes || ''}`;
// Query: "Starbucks food "
const results = await vectorStore.similaritySearch(query, 10);
```

#### Matching Service (LLM Controlled)
```typescript
// Claude decides to call: search_tasks_semantic
// Claude constructs query: "Coffee shop food and beverage expenses"
// (More semantic, context-aware than simple concatenation)
```

**Show this in your demo:**
1. Run same receipt through both implementations
2. Show backend logs:
   - Chain: Shows hardcoded query
   - Tool Calling: Shows LLM-constructed query (often more intelligent)
3. Point out: "Claude built a better query by understanding context!"

---

## Live Coding: Adding Tax Percentage

This is your **main live coding moment** - shows how easy it is to add computed fields.

### Before State

**File**: `backend/src/schemas/receipt.schema.ts`

```typescript
export const ReceiptDataSchema = z.object({
  merchant: z.string(),
  date: z.string(),
  subtotal: z.number().optional(),
  tax: z.number(),
  // taxPercentage: NOT HERE YET 👈
  total: z.number(),
  category: z.enum(['food', 'retail', 'office', 'travel', 'entertainment', 'other']),
  items: z.array(z.object({
    description: z.string(),
    price: z.number(),
    quantity: z.number().optional()
  })).optional(),
  paymentMethod: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional()
});
```

### Live Coding Steps

**Step 1: Add field to schema**
```typescript
export const ReceiptDataSchema = z.object({
  merchant: z.string(),
  date: z.string(),
  subtotal: z.number().optional(),
  tax: z.number(),
  taxPercentage: z.number().optional(), // 👈 ADD THIS LINE
  total: z.number(),
  // ... rest of schema
});
```

**Step 2: Update prompt (already there, just point it out)**

**File**: `backend/src/shared/prompts/receipt.prompt.ts`

```typescript
// Already in prompt:
// "- Calculate tax percentage: (tax/subtotal)*100, round to 2 decimals"
```

**Step 3: Re-run a receipt**
```bash
# Upload a receipt via the UI or curl
curl -X POST http://localhost:3002/api/parse/simple \
  -F "file=@grocery-receipt.jpg"
```

**Step 4: Show output**
```json
{
  "status": "success",
  "receipt": {
    "merchant": "Whole Foods",
    "date": "2024-10-15",
    "subtotal": 42.50,
    "tax": 3.83,
    "taxPercentage": 9.01,  // 👈 NEW FIELD!
    "total": 46.33,
    "category": "food",
    "confidence": "high"
  }
}
```

### Talking Points for Live Coding

**Say this:**
- "Let's add a computed field - tax percentage"
- "Step 1: Add `taxPercentage` to the Zod schema"
- "Step 2: The prompt already tells Claude to calculate it"
- "Step 3: Re-run a receipt... and look!"
- "The LLM did the math: (3.83 / 42.50) * 100 = 9.01%"
- "This is the power of structured outputs + LLMs"
- "Same pattern as Demo 1 with query parsing"

**Key Insights:**
- ✅ LLMs can do math (within reason)
- ✅ Can derive fields from other fields
- ✅ Structured outputs enforce this
- ✅ No need to write calculation logic yourself
- ✅ Schema + prompt = type-safe computed fields

---

## Receipt-to-Task Matching

Shows how we connect receipts to the task app from Demo 1.

### Vector Store Setup

**File**: `backend/src/config/vectorstore.config.ts`

```typescript
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';

let vectorStoreInstance: MemoryVectorStore | null = null;

export async function initializeVectorStore() {
  console.log('Initializing vector store...');

  // Load tasks from Demo 1
  const tasks = loadTasksFromDemo1();

  // Filter to tasks with budgets (expense-trackable)
  const tasksWithBudgets = tasks.filter(task => task.budget);

  // Create documents for embedding
  const documents = tasksWithBudgets.map(task => ({
    pageContent: `${task.title} ${task.description || ''}`,
    metadata: {
      taskId: task.id,
      title: task.title,
      description: task.description,
      budget: task.budget,
      createdAt: task.createdAt,
      dueDate: task.dueDate,
      assignee: task.assignee,
    },
  }));

  // Create embeddings
  const embeddings = new OpenAIEmbeddings({
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME,
    azureOpenAIApiEmbeddingsDeploymentName: 'text-embedding-ada-002',
    azureOpenAIApiVersion: '2024-02-01',
  });

  // Create vector store
  vectorStoreInstance = await MemoryVectorStore.fromDocuments(
    documents,
    embeddings
  );

  console.log(`✓ Vector store initialized with ${documents.length} tasks`);
}

export function getVectorStore(): MemoryVectorStore | null {
  return vectorStoreInstance;
}
```

### Matching Workflow

**Full flow: Receipt → Parse → Search → Filter → Rank → Match**

1. **Parse Receipt**: Vision API extracts merchant, amount, date, category
2. **Semantic Search**: Find tasks similar to receipt (by merchant/category)
3. **Date Filter**: Keep only tasks active on receipt date
4. **Budget Rank**: Sort by budget utilization (receipt amount / task budget)
5. **LLM Decision**: Claude picks best match with confidence score

**Example:**
- Receipt: Starbucks $45.23 on 2024-10-15
- Search finds: "Team coffee supplies", "Office snacks", "Client meeting catering"
- Date filter: Only "Office snacks" was active on 10/15
- Budget rank: $45.23 / $150 = 30% utilization (good fit!)
- LLM decision: "High confidence match to 'Office snacks' task"

---

## Talking Points

### Core Messages

**Vision + Structured Output = Game Changer**
- Traditional: 100+ lines of brittle regex
- AI: Single API call handles ANY format
- Handwritten receipts? ✅ No problem!

**When to Use Which Approach**
- **Simple tasks**: Single API call (Vision Service)
- **Complex workflows**: Orchestration (Chain Service)
- **Dynamic workflows**: Tool calling (Matching Service)

**Discriminated Unions for Real-World UX**
- Not just success/failure
- 4 states: success, partial, not_a_receipt, unreadable
- Actionable feedback: "Retake photo with better lighting"
- Confidence levels: high, medium, low

**LLMs Can Compute**
- Tax percentage = (tax/subtotal) * 100
- LLM does the math reliably
- Schema + prompt = computed fields

### Decision Tree for Audience

```
Is the task straightforward?
  ├─ Yes → Single API call (Vision Service)
  └─ No → Consider orchestration

Do you need explicit control over each step?
  ├─ Yes → LangChain pipeline (Chain Service)
  └─ No → Let LLM decide (Tool Calling)

Do users need to see progress in real-time?
  ├─ Yes → SSE streaming (Matching Service)
  └─ No → Background processing

Do you have deterministic business logic?
  ├─ Yes → Code it explicitly (Chain Service)
  └─ No → Let LLM handle reasoning (Tool Calling)
```

### Connection to Demo 1

**Full circle moment!**
- Demo 1: Task app with natural language querying
- Demo 2: Receipt parsing that MATCHES to those tasks
- Same data source (tasks.json)
- Vector store enables semantic matching

**Mention during demo:**
"Remember the task app from Demo 1? These receipts are getting matched to those tasks. The vector store lets us find the right task semantically - 'Starbucks' matches 'Office coffee supplies' even though the words are different."

---

## Demo Checklist

### Before Presentation

- [ ] Pre-test all receipt images (printed + handwritten)
- [ ] Verify vector store initializes correctly
- [ ] Test both chain and tool calling approaches
- [ ] Have backup screenshots of successful parses
- [ ] Prepare handwritten receipt (clear, tested photo)
- [ ] Test live coding (add taxPercentage field)
- [ ] Verify backend logging is visible
- [ ] Check that SSE streaming works (for tool calling demo)

### During Presentation

- [ ] Show brittle regex pseudo-code first (the "before")
- [ ] Demo simple vision parsing (3 printed receipts)
- [ ] Reveal handwritten receipt (WOW moment)
- [ ] Live code tax percentage addition
- [ ] Compare chain vs tool calling (query construction difference)
- [ ] Show SSE streaming if time permits
- [ ] Connect back to Demo 1 task app

---

## Success Criteria

By the end of Demo 2, your audience should understand:

- ✅ Vision + structured output transforms impossible → trivial
- ✅ Discriminated unions for multi-state responses
- ✅ When to use simple vs orchestrated vs tool calling
- ✅ Prompt engineering for structured extraction
- ✅ LLMs can compute derived fields
- ✅ Vector stores enable semantic matching
- ✅ The key difference: developer-controlled vs LLM-controlled workflows

---

**Remember**: Keep it simple, focus on before/after contrast, and have fun with the handwritten receipt reveal! 🎉
