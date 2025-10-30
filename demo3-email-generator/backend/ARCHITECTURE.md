# Demo 3: Architecture Overview

Visual guide to the email generation pipeline.

## 📊 High-Level Architecture

```
┌─────────────┐
│   Frontend  │  Angular UI
│  (Angular)  │  - User persona selector
└──────┬──────┘  - Email display
       │
       │ HTTP POST /api/generate-email
       │ { userId: "user-001" }
       ▼
┌─────────────┐
│   Backend   │  Node.js + Express
│  (Express)  │  - API endpoints
└──────┬──────┘  - Route to chains
       │
       │ Create chain & invoke
       ▼
┌──────────────────────────────────────┐
│     LangChain Orchestration          │
│  (4-Step Pipeline with RAG)          │
└──────────────────────────────────────┘
       │
       │ Returns { email, metadata }
       ▼
┌─────────────┐
│   Response  │  JSON with generated email
└─────────────┘
```

## 🔗 Chain Pipeline Flow

### Input Data Flow

```
User Profile + Task Activity Data
           │
           ▼
┌─────────────────────────────────────────────────┐
│  Step 1: Analyze Activity (LLM Call)            │
│  ────────────────────────────────────────────   │
│  Input:  { user, taskActivity, recentActivity } │
│  Does:   LLM analyzes and identifies key points │
│  Output: + activityAnalysis                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Step 2: Relevant Comments (RAG - Vector Store) │
│  ────────────────────────────────────────────   │
│  Input:  { user, activityAnalysis, ... }        │
│  Does:   Semantic search in vector store        │
│  Output: + collaborationContext                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Step 3: Determine Style (Business Logic)       │
│  ────────────────────────────────────────────   │
│  Input:  { user, collaborationContext, ... }    │
│  Does:   Map user type → email style            │
│  Output: + emailStyle                           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Step 4: Generate Email (LLM + Zod)             │
│  ────────────────────────────────────────────   │
│  Input:  { user, activityAnalysis,              │
│            collaborationContext, emailStyle }   │
│  Does:   Generate personalized email with LLM   │
│          Validate with Zod schema               │
│  Output: + email { subject, body, tone, ... }   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
             Final Result
    { email, emailStyle, metadata }
```

## 🎭 What Each Persona Gets

### Input (Same for All)
```json
{
  "taskActivity": {
    "completed": 5,
    "inProgress": 3,
    "overdue": 2,
    "commented": 7
  },
  "recentActivity": [...],
  "overdueTasks": [...],
  "collaborationContext": [
    "Sarah: Need your input on session handling",
    "John: Thoughts on Redis approach?"
  ]
}
```

### Output (Different for Each)

#### 📊 Sarah (Detail-Oriented)
```
Subject: Your Weekly Task Summary - Oct 7-14

Hey Sarah,

Here's your comprehensive breakdown for the week:

📈 OVERVIEW
- 12 tasks assigned
- 5 completed (42% completion rate ↑)
- 3 in progress
- 2 overdue (needs attention!)

🔴 URGENT: OVERDUE TASKS
1. Database migration (3 days overdue, HIGH priority)
   - Blocking: deployment pipeline
   ...
```
**Style**: Long, detailed, professional, stats-heavy

#### ⚡ Mike (Action-Focused)
```
Subject: Action Required: 2 Overdue Tasks

Mike,

Here's what needs your attention:

🔴 OVERDUE (do first):
• Database migration (3 days)
• Security audit (1 day)

💬 WAITING ON YOU:
• Sarah needs input on auth bug
• John needs Redis decision

That's it.
```
**Style**: Brief, direct, bullet points only

#### 💤 Alex (Inactive)
```
Subject: We miss you! Your team needs you

Hey Alex,

We noticed you haven't been active lately - everything okay?

Your team has been asking about you:
- Sarah needs your input on authentication
- John wants your thoughts on rate limiting
- The mobile architecture decision is waiting

We know you're busy, but your expertise is valued...
```
**Style**: Encouraging, motivational, team-focused

#### 😎 Jamie (Meme-Loving)
```
Subject: Task Update (Now with 100% more memes)

Yo Jamie! 👋

Time to emerge from the code cave and check your tasks.

*Insert "This is fine" dog meme* ← You with 2 overdue tasks

URGENT (narrator: it was urgent):
- Database migration (fashionably late by 3 days)
- Security audit (the security team is Sus™️)

Sarah is @'ing you harder than a Twitter ratio...
```
**Style**: Casual, humorous, meme references, still informative

## 🧩 Component Breakdown

### Chains (`chains/`)

```
index.ts
  ├─ Exports: createFullEmailChain()
  └─ Composes: all 4 chains with .pipe()

analyze-activity.chain.ts
  ├─ Type: LLM Chain
  ├─ Purpose: Analyze raw task data
  └─ Adds: activityAnalysis string

relevant-comments.chain.ts
  ├─ Type: RAG Chain
  ├─ Purpose: Retrieve collaboration context
  └─ Adds: collaborationContext array

determine-style.chain.ts
  ├─ Type: Business Logic
  ├─ Purpose: Map user type → email style
  └─ Adds: emailStyle config

generate-email.chain.ts
  ├─ Type: LLM + Zod Chain
  ├─ Purpose: Generate final personalized email
  └─ Adds: email object
```

### Prompts (`prompts/`)

```
email-generation.prompts.ts
  ├─ getAnalyzeActivitySystemPrompt()
  ├─ getAnalyzeActivityUserPrompt()
  ├─ getEmailGenerationSystemPrompt()
  ├─ getEmailGenerationUserPrompt()
  └─ getStyleGuidanceForUserType()
```

**Why separate?**
- Easy to read and modify prompts
- Can version control prompt changes
- Great for demos - show prompts without chain logic
- A/B testing different prompts

### Schemas (`schemas/`)

```typescript
EmailSchema = {
  subject: string,
  body: string,
  format: 'text' | 'html',
  tone: 'professional' | 'casual' | ...,
  priorityActions?: string[]
}
```

**Benefits:**
- Type-safe LLM outputs
- Validation at runtime
- TypeScript inference
- Prevents hallucination

### Vector Store (`config/vectorstore.config.ts`)

```
Comments (JSON)
      ↓
  Embeddings
      ↓
Vector Store (In-Memory)
      ↓
Semantic Search
      ↓
Relevant Comments
```

**RAG Flow:**
1. Load comments from `data/comments.json`
2. Generate embeddings with Azure OpenAI
3. Store in MemoryVectorStore
4. At generation time: semantic search
5. Inject relevant comments into prompt

## 🔄 Request/Response Lifecycle

### Single Email Generation

```
1. POST /api/generate-email { userId: "user-001" }
   └─> Express route handler

2. Load user profile from users.json
   └─> Find Sarah Chen

3. Get vector store instance
   └─> Already initialized at server startup

4. Create email chain
   └─> createFullEmailChain(vectorStore)

5. Prepare input
   └─> { user, taskActivity, recentActivity, ... }

6. Invoke chain
   └─> result = await emailChain.invoke(input)

7. Chain executes 4 steps:
   Step 1: LLM analyzes activity      (~1-2s)
   Step 2: Vector store search        (~100ms)
   Step 3: Business logic             (~1ms)
   Step 4: LLM generates email        (~2-3s)
   ────────────────────────────────────────
   Total:                             ~3-5s

8. Return response
   └─> { email, metadata, generationTime }
```

### Batch Email Generation

```
1. POST /api/generate-email-batch
   └─> Express route handler

2. Load all user profiles
   └─> 4 users from users.json

3. Generate all emails in parallel
   └─> Promise.all([...4 chains...])

4. Each chain runs independently
   ├─> Sarah's email chain
   ├─> Mike's email chain
   ├─> Alex's email chain
   └─> Jamie's email chain

5. Aggregate results
   └─> Array of 4 emails

6. Return batch response
   └─> { results[], metadata }

Parallel execution: ~3-5s (vs 12-20s sequential!)
```

## 🎨 Design Decisions

### Why split chains into files?
- **Modularity**: Each chain can be tested independently
- **Readability**: Focus on one concern at a time
- **Reusability**: Mix and match chains
- **Teaching**: Easy to show specific parts

### Why extract prompts?
- **Visibility**: Prompts are the key to personalization
- **Maintainability**: Change prompts without touching logic
- **Experimentation**: A/B test different prompts easily
- **Presentation**: Show prompts without code noise

### Why use business logic (Step 3)?
- **Speed**: No API call = instant
- **Cost**: No tokens used
- **Determinism**: Same input = same output
- **Simplicity**: Easy to test and understand

### Why Zod schemas?
- **Type safety**: TypeScript types from runtime validation
- **Validation**: Ensures LLM output matches expectations
- **Documentation**: Schema = contract
- **Error prevention**: Catch issues before they propagate

## 📈 Performance Characteristics

| Step | Type | Time | Cost | Cacheable |
|------|------|------|------|-----------|
| Analyze Activity | LLM | 1-2s | ~$0.001 | No |
| Relevant Comments | Vector Search | 100ms | $0 | Yes* |
| Determine Style | Business Logic | 1ms | $0 | N/A |
| Generate Email | LLM + Parse | 2-3s | ~$0.003 | No |
| **Total** | | **~3-5s** | **~$0.004** | |

*Vector store is in-memory, so already cached

**Optimization opportunities:**
- Cache activity analysis for same time period
- Pre-compute style configurations
- Batch similar requests
- Stream LLM responses for perceived speed

## 🛡️ Error Handling

```
Each chain has graceful fallbacks:

Step 1: Analyze Activity
  └─ Error: Return raw data summary

Step 2: Relevant Comments (RAG)
  └─ Error: Continue with empty context array

Step 3: Determine Style
  └─ Error: Default to 'action-focused' style

Step 4: Generate Email
  └─ Parse Error: Return basic email with raw LLM output
  └─ LLM Error: Throw (caught by route handler)
```

## 🔍 Observability

### Logging Points
- Chain invocation start/end
- Vector store search results
- LLM token usage
- Generation time per step
- Total request time

### Debug Information
- User type and preferences
- Style configuration applied
- Collaboration context retrieved
- Schema validation results

---

**Key Takeaway**: This architecture demonstrates modern AI application patterns - orchestration, RAG, structured outputs, and graceful degradation - all in a real, working system.
