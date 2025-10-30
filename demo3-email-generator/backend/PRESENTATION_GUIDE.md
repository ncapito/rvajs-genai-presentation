# Demo 3: Presentation Guide

This guide helps you navigate the refactored codebase during your presentation.

## 🎯 Key Principle

**The code is now organized for teaching, not just for running.**

Each chain is in its own file, prompts are extracted and visible, and the orchestration is crystal clear.

## 📂 New Code Structure

```
backend/src/
├── chains/
│   ├── index.ts                      # 👈 START HERE - Shows full pipeline
│   ├── analyze-activity.chain.ts     # Step 1: Analyze task data (LLM)
│   ├── relevant-comments.chain.ts    # Step 2: RAG retrieval (Vector store)
│   ├── determine-style.chain.ts      # Step 3: Business logic (No LLM!)
│   └── generate-email.chain.ts       # Step 4: Generate email (LLM + Zod)
├── prompts/
│   └── email-generation.prompts.ts   # 👈 All prompts in one place!
├── schemas/
│   └── email.schema.ts               # Zod schemas for structured output
├── config/
│   ├── azure.config.ts               # Azure OpenAI setup
│   └── vectorstore.config.ts         # RAG vector store setup
├── data/
│   ├── users.json                    # 4 user personas
│   ├── tasks.json                    # Task activity data
│   └── comments.json                 # Comments for RAG
└── routes/
    └── email.routes.ts               # Clean API endpoints
```

## 🎬 Presentation Flow

### Part 1: Show the Pipeline (2 min)

**File to show**: `chains/index.ts`

```typescript
// This file shows the ENTIRE pipeline in ~20 lines!
export function createFullEmailChain(vectorStore: MemoryVectorStore) {
  const relevantCommentsChain = createRelevantCommentsChain(vectorStore);

  return analyzeActivityChain
    .pipe(relevantCommentsChain)  // RAG step
    .pipe(determineStyleChain)     // Business logic step
    .pipe(generateEmailChain);     // Final generation step
}
```

**Key points**:
- "This is LangChain orchestration - 4 steps chained together"
- "Each step adds context progressively"
- "Some steps call LLMs, some don't - use the right tool for the job"

### Part 2: Show the Prompts (3 min)

**File to show**: `prompts/email-generation.prompts.ts`

Scroll to the `getStyleGuidanceForUserType()` function to show how prompts differ by persona:

```typescript
'detail-oriented': `
- Use professional, comprehensive tone
- Include detailed statistics and breakdowns
- Organize with clear sections
...`

'action-focused': `
- Be direct and brief
- Lead with what needs immediate action
- Use bullet points, no fluff
...`

'meme-loving': `
- Use casual, humorous tone (internet culture)
- Include meme references and jokes
- Make them smile while conveying info
...`
```

**Key points**:
- "Same data, different prompts = wildly different emails"
- "Prompts are extracted so they're easy to read and modify"
- "This is where the personalization magic happens"

### Part 3: Demonstrate RAG (5 min) - LIVE CODE THIS!

**File to show**: `chains/relevant-comments.chain.ts`

This is your live coding opportunity! Show this simple, clean file:

```typescript
export function createRelevantCommentsChain(vectorStore: MemoryVectorStore) {
  return RunnableLambda.from(async (input) => {
    const { user } = input;

    // Semantic search for relevant comments
    const query = `Comments and mentions for ${user.name}`;
    const relevantComments = await vectorStore.similaritySearch(query, 5);

    return {
      ...input,
      collaborationContext: relevantComments.map((doc) => doc.pageContent),
    };
  });
}
```

**Live coding steps**:
1. Show the vector store setup in `config/vectorstore.config.ts`
2. Show the comments data in `data/comments.json`
3. Walk through the RAG chain code above
4. Show how it integrates in `chains/index.ts`: `.pipe(relevantCommentsChain)`
5. Generate an email and point out collaboration context in output

**Key points**:
- "RAG = Retrieval Augmented Generation"
- "Vector store holds embedded comments"
- "Semantic search finds relevant context at generation time"
- "This enriches the prompt with real data"

### Part 4: Show Business Logic (2 min)

**File to show**: `chains/determine-style.chain.ts`

```typescript
// Not every step needs an LLM!
const USER_TYPE_STYLE_MAP: Record<string, EmailStyle> = {
  'detail-oriented': {
    structure: 'comprehensive',
    tone: 'professional',
    includeStats: true,
    includeBreakdowns: true,
  },
  'action-focused': {
    structure: 'minimal',
    tone: 'direct',
    includeStats: false,
    bulletPointsOnly: true,
  },
  // ...
};
```

**Key points**:
- "This step is pure business logic - no LLM call!"
- "Faster, cheaper, deterministic"
- "Use LLMs for creativity, use logic for rules"

### Part 5: Show Structured Output (3 min)

**File to show**: `schemas/email.schema.ts`

```typescript
export const EmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  format: z.enum(['text', 'html']),
  tone: z.enum(['professional', 'casual', 'humorous', 'encouraging']),
  priorityActions: z.array(z.string()).optional(),
});
```

**Then show**: `chains/generate-email.chain.ts` (lines ~40-50)

```typescript
// Create parser from Zod schema
const parser = StructuredOutputParser.fromZodSchema(EmailSchema);

// LLM generates, parser validates
const response = await azureLLM.invoke(messages);
const email = await parser.parse(response.content);
```

**Key points**:
- "Zod schemas ensure type safety"
- "LLM output is validated against schema"
- "Prevents hallucination and unexpected outputs"
- "We get TypeScript types for free!"

## 🗂️ Quick Reference: Which File to Show When

| Topic | File to Show | What to Highlight |
|-------|-------------|-------------------|
| Full pipeline | `chains/index.ts` | The pipe() composition |
| Prompts | `prompts/email-generation.prompts.ts` | Style guidance function |
| RAG | `chains/relevant-comments.chain.ts` | Semantic search |
| Business logic | `chains/determine-style.chain.ts` | Style map (no LLM) |
| Structured output | `schemas/email.schema.ts` | Zod schemas |
| LLM generation | `chains/generate-email.chain.ts` | Parser usage |
| User personas | `data/users.json` | 4 different user types |
| Task data | `data/tasks.json` | Same data for all users |
| Comments | `data/comments.json` | RAG source data |

## 💡 Teaching Points by File

### `chains/index.ts`
- LangChain orchestration with pipe()
- Progressive context building
- Clean separation of concerns

### `chains/relevant-comments.chain.ts`
- RAG pattern (retrieve → enrich → generate)
- Vector store semantic search
- Graceful fallback on errors

### `chains/determine-style.chain.ts`
- Not everything needs an LLM!
- Business logic for deterministic outcomes
- Configuration-driven behavior

### `chains/generate-email.chain.ts`
- Structured output with Zod
- Comprehensive prompt engineering
- Error handling with fallback

### `prompts/email-generation.prompts.ts`
- Prompt engineering for personalization
- Style guidance per user type
- Clear prompt structure (system + user)

## 🎤 Suggested Talking Points

### When showing the pipeline:
> "This is what modern AI orchestration looks like. We chain together multiple steps - some call LLMs, some don't. Each step adds more context, building up to the final generation."

### When showing prompts:
> "The prompts are the secret sauce. Same data, but look how different these prompts are for each user type. This is how we get wildly different emails from the same input."

### When showing RAG:
> "RAG is retrieval augmented generation. Instead of putting all data in the prompt, we search for relevant pieces at generation time. This is scalable and keeps prompts focused."

### When showing business logic:
> "Not every step needs an LLM. This style determination is pure logic - faster, cheaper, deterministic. Use the right tool for each job."

### When showing structured output:
> "Zod schemas are critical. They ensure the LLM returns exactly what we expect, with proper types. This prevents errors and makes the output predictable."

## 🔥 The "WOW" Moments

1. **Side-by-side comparison**: Generate all 4 emails and show them together
2. **Jamie's meme email**: The humorous tone will get laughs
3. **RAG in action**: Show a comment being pulled and used in the email
4. **Same data, different results**: Emphasize this repeatedly

## 📝 Common Questions & Answers

**Q: "How long does each generation take?"**
A: "Typically 3-5 seconds per email. Most of that is LLM API latency."

**Q: "Can you add more user types?"**
A: "Absolutely! Just add to the style map in determine-style.chain.ts and update the prompts."

**Q: "What if the vector store search fails?"**
A: "Graceful fallback - see line X in relevant-comments.chain.ts. It continues with empty context."

**Q: "How do you ensure the LLM follows the schema?"**
A: "Zod schemas + StructuredOutputParser. The parser validates and throws if invalid."

## 🎯 Pre-Presentation Checklist

- [ ] Test all 4 email generations
- [ ] Verify RAG retrieval works (check logs for "collaboration context")
- [ ] Have backup screenshots ready
- [ ] Open key files in editor tabs:
  - `chains/index.ts`
  - `prompts/email-generation.prompts.ts`
  - `chains/relevant-comments.chain.ts`
- [ ] Run the frontend so side-by-side view is ready
- [ ] Practice transitioning between files smoothly

## 🚀 Demo Commands

```bash
# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm start

# Test single email (Terminal 3)
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}'

# Test batch generation
curl -X POST http://localhost:3003/api/generate-email-batch
```

## 📚 Additional Resources

- LangChain Docs: https://js.langchain.com/docs/
- Zod Docs: https://zod.dev/
- RAG Pattern: https://js.langchain.com/docs/modules/data_connection/

---

**Remember**: The code is clean and well-commented now. Don't be afraid to open files and read through them during the demo. The audience will appreciate seeing real, working code!
