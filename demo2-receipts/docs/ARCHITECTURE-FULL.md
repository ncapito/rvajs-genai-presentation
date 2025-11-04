# Demo 2 - Part 2: Receipt Parsing + Task Matching with RAG

**Architecture Overview** - LangChain Orchestration with Vector Store (RAG)

This document covers the **advanced approach**: using LangChain to orchestrate a multi-step workflow that parses receipts AND matches them to existing tasks using RAG (Retrieval-Augmented Generation).

---

## 📊 High-Level Architecture

### The Full System: Parse → Match → Reconcile

```
┌─────────────┐
│   Frontend  │  Angular UI
│  (Angular)  │  - Upload receipt image
└──────┬──────┘  - Display parsed data + matched task
       │
       │ HTTP POST /api/parse/chain
       │ FormData with IMAGE (receipt photo)
       ▼
┌───────────────────────────────────────┐
│          Backend Orchestration        │
│       (Node.js + Express)             │
└───────────────────────────────────────┘
       │
       │ Step 1: Parse Receipt
       ▼
┌───────────────────────────────────────┐
│  Claude Vision API                    │
│  Image → Receipt Data                 │
└──────────────┬────────────────────────┘
               │
               │ Receipt: "AWS - $150 - Cloud Infrastructure"
               ▼
┌───────────────────────────────────────┐
│      LangChain Orchestration          │
│      (4-Step Pipeline with RAG)       │
└───────────────────────────────────────┘
       │
       │ Step 2: Semantic Search (RAG)
       ▼
┌───────────────────────────────────────┐
│     Vector Store (Embeddings)         │
│  Query: "AWS cloud infrastructure"    │
│  Returns: 10 similar tasks            │
└──────────────┬────────────────────────┘
               │
               │ Step 3: Date Filter (Business Logic)
               ▼
┌───────────────────────────────────────┐
│   Filter by Date Range                │
│   Keep tasks where receipt date       │
│   falls between createdAt & dueDate   │
└──────────────┬────────────────────────┘
               │
               │ Step 4: Budget Rank (Business Logic)
               ▼
┌───────────────────────────────────────┐
│   Rank by Budget Fit                  │
│   Filter: receipt <= task budget      │
│   Sort by utilization %               │
└──────────────┬────────────────────────┘
               │
               │ Step 5: LLM Analysis
               ▼
┌───────────────────────────────────────┐
│   Claude Analyzes Top 3 Tasks         │
│   Picks best match + reasoning        │
│   Returns confidence score            │
└──────────────┬────────────────────────┘
               │
               ▼
┌───────────────────────────────────────┐
│   Final Result                        │
│   • Parsed receipt                    │
│   • Matched task (or null)            │
│   • Reasoning                         │
│   • Confidence score                  │
│   • Match reasons                     │
└───────────────────────────────────────┘
```

**Key Characteristics:**
- 🧩 **Orchestration**: LangChain pipes steps together
- 🔍 **RAG**: Vector store for semantic task search
- 🎯 **Hybrid**: Combines LLM intelligence + deterministic logic
- 🛡️ **Explainable**: Each step is logged and observable
- ⏱️ **Latency**: ~5-8 seconds (parse + RAG + LLM analysis)
- 💰 **Cost**: ~$0.02 per receipt (parse + embedding + LLM calls)

---

## 📋 Data Model

### Receipt Entity (Same as Part 1)

```typescript
ReceiptData {
  merchant: string,     // "Amazon Web Services"
  date: string,         // "2025-10-28"
  total: number,        // 150.00
  category: string,     // "office"
  notes?: string        // "Cloud infrastructure costs"
}
```

### Task Entity (New!)

```typescript
Task {
  taskId: string,          // "task-001"
  title: string,           // "AWS Infrastructure Migration"
  description?: string,    // "Migrate services to AWS"
  assignee: string | null, // "John Doe"
  budget: number,          // 500.00
  createdAt: string,       // "2025-10-15"
  dueDate: string,         // "2025-11-15"
}
```

### Task Match Result

```typescript
TaskMatch {
  taskId: string,
  title: string,
  description?: string,
  assignee: string | null,
  budget: number,
  createdAt: string,
  dueDate: string,
  confidenceScore: number,     // 0-100 from LLM
  matchReasons: string[]       // Why this task matched
}

MatchResult {
  reasoning: string,          // LLM's explanation
  match: TaskMatch | null     // Best matching task (or null)
}
```

### Relationship

```
┌─────────────┐
│  Receipt    │  User uploads
│  (Image)    │
└──────┬──────┘
       │
       │ 1. Parse
       ▼
┌─────────────┐
│ Receipt     │  Structured data
│ Data        │
└──────┬──────┘
       │
       │ 2. Match via RAG
       ▼
┌─────────────┐       ┌──────────────┐
│ Vector      │◄──────┤ Task         │
│ Store       │       │ Embeddings   │
│ (Search)    │       └──────────────┘
└──────┬──────┘              ▲
       │                     │
       │ 3. Semantic matches │ Precomputed at startup
       ▼                     │
┌─────────────┐       ┌──────────────┐
│ Filtered +  │       │ Task         │
│ Ranked      │───────┤ Collection   │
│ Tasks       │       │ (JSON)       │
└──────┬──────┘       └──────────────┘
       │
       │ 4. LLM picks best
       ▼
┌─────────────┐
│ Best Task   │  Matched!
│ Match       │
└─────────────┘
```

---

## 🔗 Full Request Flow (Chain Approach)

### Multi-Step Orchestration Flow

```
User uploads receipt: "aws-receipt.jpg"
           │
           ▼
┌─────────────────────────────────────────────────┐
│  POST /api/parse/chain                          │
│  ────────────────────────────────────────────   │
│  Input:  FormData with image                    │
│  Calls:  visionService.parseReceipt()           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  STEP 1: Parse Receipt (Vision API)             │
│  ────────────────────────────────────────────   │
│  Input:  Receipt image                          │
│  Does:   Call Claude Vision                     │
│  Output: ReceiptData                            │
│          {                                      │
│            merchant: "AWS",                     │
│            total: 150.00,                       │
│            category: "office"                   │
│          }                                      │
└─────────────────┬───────────────────────────────┘
                  │
                  │ If parse fails → return error
                  │ If success → continue to matching
                  ▼
┌─────────────────────────────────────────────────┐
│  STEP 2: Semantic Search (RAG)                  │
│  ────────────────────────────────────────────   │
│  Input:  Receipt data                           │
│  Query:  "AWS office cloud infrastructure"      │
│  Does:   vectorStore.similaritySearch(query, 10)│
│  Output: 10 semantically similar tasks          │
│          [                                      │
│            {taskId: "t1", title: "AWS Migration"│
│             budget: 500, ...},                  │
│            {taskId: "t2", title: "Cloud Infra", │
│             budget: 300, ...},                  │
│            ...                                  │
│          ]                                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  STEP 3: Date Filter (Business Logic)           │
│  ────────────────────────────────────────────   │
│  Input:  Semantic matches + receipt date        │
│  Logic:  receipt.date >= task.createdAt         │
│          && receipt.date <= task.dueDate        │
│  Output: Filtered tasks (5 tasks remain)        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  STEP 4: Budget Rank (Business Logic)           │
│  ────────────────────────────────────────────   │
│  Input:  Date-filtered tasks + receipt amount   │
│  Logic:  Filter where receipt.total <= budget   │
│          Calculate utilization %                │
│          Sort by utilization DESC               │
│  Output: Ranked tasks (3 tasks remain)          │
│          [                                      │
│            {task: "t1", utilization: 30%},     │
│            {task: "t2", utilization: 50%},     │
│            {task: "t5", utilization: 20%}      │
│          ]                                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  STEP 5: LLM Analysis (Claude)                  │
│  ────────────────────────────────────────────   │
│  Input:  Top 3 ranked tasks + receipt details   │
│  Prompt: "Analyze these matches and pick best"  │
│  Does:   LLM reasons about context              │
│          Considers semantic + budget + dates    │
│          Assigns confidence score               │
│  Output: Best match + reasoning                 │
│          {                                      │
│            bestTaskId: "t1",                    │
│            confidence: 92,                      │
│            reasoning: "AWS Migration task is    │
│                       the best match because..." │
│          }                                      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Return Final Result                            │
│  ────────────────────────────────────────────   │
│  {                                               │
│    success: true,                               │
│    approach: 'chain',                           │
│    receipt: { /* parsed receipt */ },          │
│    matching: {                                  │
│      reasoning: "...",                          │
│      match: {                                   │
│        taskId: "t1",                            │
│        title: "AWS Infrastructure Migration",  │
│        budget: 500,                             │
│        confidenceScore: 92,                     │
│        matchReasons: [                          │
│          "Semantic match: AWS + infrastructure",│
│          "Budget fit: $150 of $500 (30%)",     │
│          "Date match: Receipt in task period"  │
│        ]                                        │
│      }                                          │
│    }                                            │
│  }                                               │
└─────────────────────────────────────────────────┘
```

**Flow Characteristics:**
- 🔄 **Sequential**: Each step feeds into the next
- 🎯 **Hybrid**: LLM + deterministic logic
- 📊 **Observable**: Each step logs progress
- 🧠 **Intelligent**: RAG for semantic matching
- ⚖️ **Balanced**: Combine vector search + business rules
- ⏱️ **Latency**: ~5-8 seconds total

---

## 🧩 Component Breakdown

### Services

```
vision.service.ts (Step 1)
  └─ parseReceipt(imagePath)
      └─ Single Claude Vision call

chain.service.ts (Steps 2-5)
  ├─ matchReceiptToTask(receipt)
  │   └─ Orchestrates 4-step chain
  │
  ├─ semanticSearchStep()      [Step 2]
  │   └─ Vector store similarity search
  │
  ├─ dateFilterStep()           [Step 3]
  │   └─ Filter by createdAt ≤ date ≤ dueDate
  │
  ├─ budgetRankStep()           [Step 4]
  │   └─ Filter receipt ≤ budget, rank by %
  │
  └─ llmAnalysisStep()          [Step 5]
      └─ Claude picks best match + reasons
```

### Vector Store Configuration

```
vectorstore.config.ts
  ├─ initializeVectorStore()
  │   ├─ Load tasks from JSON
  │   ├─ Generate embeddings (Azure OpenAI)
  │   ├─ Create MemoryVectorStore
  │   └─ Cache for subsequent queries
  │
  └─ getVectorStore()
      └─ Return cached instance
```

**How RAG Works Here:**

1. **Startup**: Load all tasks, generate embeddings, store in vector DB
2. **Query Time**:
   - Receipt: "AWS - $150 - Cloud Infrastructure"
   - Create embedding for query
   - Find k=10 most similar task embeddings
   - Return matched tasks

**Why RAG?**
- Semantic matching: "AWS" matches "Amazon Web Services" or "Cloud Provider"
- No exact string matching needed
- Understands synonyms and context
- Scales to thousands of tasks

### Chains (LangChain Constructs)

```typescript
// Build chain with explicit steps
const semanticSearchStep = RunnableLambda.from(this.semanticSearchStep.bind(this));
const dateFilterStep = RunnableLambda.from(this.dateFilterStep.bind(this));
const budgetRankStep = RunnableLambda.from(this.budgetRankStep.bind(this));
const llmAnalysisStep = RunnableLambda.from(this.llmAnalysisStep.bind(this));

// Compose with .pipe()
return semanticSearchStep
  .pipe(dateFilterStep)
  .pipe(budgetRankStep)
  .pipe(llmAnalysisStep)
  .invoke({ receipt });
```

**LangChain Benefits:**
- Explicit workflow control
- Observable (log each step)
- Composable (mix and match steps)
- Testable (test each step independently)
- Type-safe (TypeScript inference)

---

## 🎨 Design Decisions

### Why LangChain Orchestration?

**Chain Approach:**
```typescript
// Developer controls the exact sequence
Step 1 → Step 2 → Step 3 → Step 4 → Step 5
Parse → Search → Filter → Rank → Analyze
```

**Benefits:**
- ✓ Explicit control: You decide the order
- ✓ Observable: See each step executing
- ✓ Deterministic: Same input = same path
- ✓ Business logic: Inject non-LLM steps (filter, rank)
- ✓ Team collaboration: Different devs own different steps
- ✓ Debugging: Easy to isolate failures

**Trade-offs:**
- ⚠️ More code to write
- ⚠️ Less flexible than tool calling
- ⚠️ Developer must design workflow

### Why Not Just a Single LLM Call?

**Could we ask Claude to:**
```
"Given this receipt and these 100 tasks, find the best match"
```

**Problems:**
1. **Context Limits**: 100 tasks × 500 tokens each = 50k tokens (expensive!)
2. **Hallucination**: LLM might pick task not in the list
3. **No Observability**: Black box decision
4. **Inefficient**: Embedding search is faster than LLM reading all tasks

**Solution: Hybrid Approach**
- Use vector search to narrow to 10 candidates (fast, cheap)
- Use business logic to filter/rank (deterministic, free)
- Use LLM for final decision on top 3 (intelligent, explainable)

### Chain vs Tool Calling: When to Use Which?

| Criteria | Chain (This Demo) | Tool Calling |
|----------|-------------------|--------------|
| Control | Developer decides workflow | LLM decides tools/order |
| Observability | High (explicit steps) | Medium (LLM thinking) |
| Determinism | High (same path) | Low (LLM may vary) |
| Flexibility | Low (fixed workflow) | High (LLM adapts) |
| Debugging | Easy (step-by-step) | Harder (trace LLM calls) |
| Use When | Workflow is known | Workflow varies by input |

**Demo 2 uses Chain because:**
- Workflow is predictable: parse → search → filter → rank → analyze
- We want explicit logging at each step
- Business logic (date filter, budget rank) is deterministic
- Teaching moment: show how to build workflows

**When to use Tool Calling instead:**
- Workflow varies based on receipt content
- Want LLM to decide which steps to take
- More autonomous, less predictable

---

## 🔍 RAG Deep Dive

### Vector Store Initialization

```typescript
// At server startup
async function initializeVectorStore() {
  // 1. Load tasks from JSON
  const tasks = JSON.parse(readFileSync('data/tasks.json'));

  // 2. Create documents for embedding
  const docs = tasks.map(task => new Document({
    pageContent: `${task.title} ${task.description || ''}`,
    metadata: {
      taskId: task.taskId,
      title: task.title,
      budget: task.budget,
      createdAt: task.createdAt,
      dueDate: task.dueDate,
      // ... other fields
    }
  }));

  // 3. Generate embeddings + store
  const vectorStore = await MemoryVectorStore.fromDocuments(
    docs,
    new AzureOpenAIEmbeddings({...})
  );

  return vectorStore;
}
```

### Semantic Search

```typescript
// At query time
const query = `${receipt.merchant} ${receipt.category} ${receipt.notes}`;
// Example: "AWS office cloud infrastructure"

const results = await vectorStore.similaritySearch(query, 10);
// Returns 10 most semantically similar tasks
```

**How Similarity Works:**
1. Receipt query → embedding (1536-dim vector)
2. Compare with all task embeddings (cosine similarity)
3. Return top k matches by similarity score
4. No exact string matching needed!

**Example Matches:**
```
Receipt: "AWS - Cloud Infrastructure"
Matches:
  1. "AWS Infrastructure Migration" (score: 0.92)
  2. "Amazon Web Services Setup" (score: 0.89)
  3. "Cloud Provider Evaluation" (score: 0.78)
  4. "Server Hosting Costs" (score: 0.65)
```

**Why This Works:**
- "AWS" and "Amazon Web Services" have similar embeddings
- "Cloud" and "Infrastructure" are semantically related
- Embedding model understands domain context

---

## 📊 Performance Analysis

### Latency Breakdown

| Step | Operation | Time | Cumulative |
|------|-----------|------|------------|
| 1 | Parse Receipt (Vision API) | ~2-4s | ~3s |
| 2 | Semantic Search (Vector) | ~100ms | ~3.1s |
| 3 | Date Filter (Logic) | ~5ms | ~3.1s |
| 4 | Budget Rank (Logic) | ~10ms | ~3.1s |
| 5 | LLM Analysis (Claude) | ~1-2s | ~5s |
| **Total** | | | **~5-8s** |

**Optimization Opportunities:**
- ✓ Vector search is already fast (pre-computed embeddings)
- ✓ Business logic steps are negligible
- Bottleneck: API calls (parse + final LLM)
- Could parallelize if we had the parsed receipt cached

### Cost Breakdown

| Step | API | Cost per Call |
|------|-----|---------------|
| Parse Receipt | Claude Vision | ~$0.01 |
| Embeddings | Azure OpenAI | ~$0.0001 (cached) |
| Final Analysis | Claude | ~$0.005 |
| **Total** | | **~$0.015** |

**Optimization:**
- Embeddings are cached at startup (one-time cost)
- Could use cheaper model for final analysis
- Batch multiple receipts to amortize costs

---

## 🛡️ Error Handling

### Graceful Degradation

```
┌─────────────────────────────────────┐
│  Step 1: Parse Receipt              │
├─────────────────────────────────────┤
│  Error: Vision API failure          │
│  └─ Return: Parse error to user     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Step 2: Semantic Search            │
├─────────────────────────────────────┤
│  No matches: No similar tasks       │
│  └─ Continue: Maybe budget will help│
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Step 3: Date Filter                │
├─────────────────────────────────────┤
│  Empty result: Receipt date outside │
│  └─ Return: No active tasks found   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Step 4: Budget Rank                │
├─────────────────────────────────────┤
│  Empty result: Receipt > all budgets│
│  └─ Return: No tasks within budget  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Step 5: LLM Analysis               │
├─────────────────────────────────────┤
│  Error: Invalid JSON from LLM       │
│  └─ Fallback: Pick highest ranked   │
└─────────────────────────────────────┘
```

**Design Principle**: Fail gracefully at each step with actionable messages.

---

## 🔬 Live Coding Demonstration

### Show Chain Execution Step-by-Step

**Step 1: Upload Receipt**
```bash
curl -X POST http://localhost:3002/api/parse/chain \
  -F "receipt=@aws-receipt.jpg"
```

**Step 2: Watch Console Logs**
```
[Chain Service] Starting receipt-to-task matching...
  Receipt: AWS - $150 on 2025-10-28

[Chain Step 1/4] Semantic search for matching tasks
  Query: AWS office cloud infrastructure
  Found 10 semantically similar tasks

[Chain Step 2/4] Filtering by date range...
  5 tasks match date range

[Chain Step 3/4] Ranking by budget match...
  3 tasks ranked by budget fit

[Chain Step 4/4] LLM analyzing results...
  Analysis: Task "AWS Infrastructure Migration" is best match

[Chain Service] ✓ Matching complete
```

**Step 3: Show Result**
```json
{
  "success": true,
  "approach": "chain",
  "receipt": {
    "merchant": "AWS",
    "total": 150,
    "category": "office"
  },
  "matching": {
    "reasoning": "AWS Infrastructure Migration is the best match...",
    "match": {
      "taskId": "task-001",
      "title": "AWS Infrastructure Migration",
      "budget": 500,
      "confidenceScore": 92,
      "matchReasons": [
        "Semantic match: AWS infrastructure keywords",
        "Budget fit: $150 of $500 (30% utilization)",
        "Date match: Receipt within task work period"
      ]
    }
  }
}
```

**WOW Moment**: The system automatically matched the receipt to the right task using semantic understanding + business logic!

---

## 🎯 Key Takeaways

### Part 1 vs Part 2 Comparison

| Aspect | Part 1 (Simple) | Part 2 (Full Chain) |
|--------|-----------------|---------------------|
| **Task** | Parse receipt only | Parse + match to task |
| **Complexity** | Single API call | 5-step orchestration |
| **AI Components** | Vision API | Vision + Embeddings + LLM |
| **RAG** | No | Yes (vector store) |
| **Business Logic** | None | Date filter + budget rank |
| **Latency** | ~2-4s | ~5-8s |
| **Cost** | ~$0.01 | ~$0.015 |
| **Use Case** | Receipt digitization | Expense reconciliation |

### When to Use Simple vs Chain

**Use Simple (Part 1) When:**
- Task is straightforward (just parse)
- Speed matters
- No additional context needed
- Single LLM call sufficient

**Use Chain (Part 2) When:**
- Multi-step workflow
- Need RAG for context retrieval
- Want to inject business logic
- Need observability at each step
- Teaching complex AI workflows

---

**Key Takeaway**: Demo 2 (Part 2) shows how to **orchestrate complex AI workflows** by combining vision, embeddings (RAG), business logic, and LLM reasoning into a cohesive pipeline using LangChain. This pattern applies to many real-world scenarios where you need hybrid intelligence (AI + rules).
