# Live Coding Setup Guide

This guide explains how to set up for the live coding demo where you add RAG to the pipeline.

## 🎯 Strategy

You'll demonstrate adding the RAG chain to an existing pipeline, showing:
1. **Before**: Emails without collaboration context
2. **Live code**: Adding the RAG chain (2-3 minutes)
3. **After**: Emails enriched with actual comment content

## 📂 Files You Now Have

```
backend/src/chains/
├── index.ts                 # Current working version (with RAG)
├── index.COMPLETE.ts        # ✅ Backup of complete version
├── index.DEMO_START.ts      # 🎬 Starting point for demo (without RAG)
└── relevant-comments.chain.ts  # The RAG chain to add
```

## 🔧 Technical Note: Optional RAG Context

The codebase is designed to work **with or without** the RAG chain:

- `collaborationContext` is **optional** in the type chain (`RelevantCommentsOutput`)
- Email generation gracefully handles missing context: `"No recent mentions"`
- This allows the demo pipeline to work in the "Before" state without errors

**Why this matters:** You can safely comment out the RAG chain for your demo without breaking the pipeline. The emails will simply show "No recent mentions" instead of actual comment content.

## 🔄 Setup Before Your Demo

### Option 1: Replace the file (Recommended)

**Before your presentation starts:**

```bash
cd backend/src/chains

# Backup the complete version (already done)
# It's saved as index.COMPLETE.ts

# Replace with demo start version
cp index.DEMO_START.ts index.ts
```

**What this does:**
- Replaces `index.ts` with version WITHOUT RAG
- Emails will be generated without collaboration context
- You'll add RAG back during the demo

### Option 2: Use git (If you're comfortable with git)

```bash
# Create a demo branch
git checkout -b demo-live-coding

# Replace the file
cp backend/src/chains/index.DEMO_START.ts backend/src/chains/index.ts

# Commit
git add backend/src/chains/index.ts
git commit -m "Demo start: Remove RAG for live coding"
```

**After demo:**
```bash
# Restore complete version
git checkout main backend/src/chains/index.ts
# or
git checkout main
```

## 🎬 During Your Demo

### Part 1: Show the "Before" (2 min)

**Say**: "Let me show you the current pipeline."

**Open**: `backend/src/chains/index.ts`

**Point out**:
```typescript
export function createFullEmailChain(vectorStore: MemoryVectorStore) {
  return (
    analyzeActivityChain
      // ← No RAG here!
      .pipe(determineStyleChain)
      .pipe(generateEmailChain)
  );
}
```

**Say**: "This works, but emails are missing collaboration context. Let me generate one to show you."

**Generate an email** (use frontend or curl):
```bash
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}'
```

**Point out**: "See? It mentions there are comments, but doesn't say WHAT people said. Let's fix that with RAG."

### Part 2: Show the Data (1 min)

**Open**: `backend/src/data/comments.json`

**Say**: "Here are the comments in our system. Sarah said 'Nick, need your input on session handling...' This data is embedded in our vector store."

**Open**: `backend/src/config/vectorstore.config.ts` (scroll to bottom)

**Say**: "At startup, we embed these comments and store them. Now we can search them semantically."

### Part 3: Live Code the RAG Chain (3-4 min)

**Open**: `backend/src/chains/relevant-comments.chain.ts`

**Walk through the code** (don't type it, just explain):

```typescript
export function createRelevantCommentsChain(vectorStore: MemoryVectorStore) {
  return RunnableLambda.from(async (input) => {
    const { user } = input;

    // 1. Construct semantic search query
    const query = `Comments and mentions for ${user.name}`;

    // 2. Search vector store
    const relevantComments = await vectorStore.similaritySearch(query, 5);

    // 3. Add to context
    return {
      ...input,
      collaborationContext: relevantComments.map((doc) => doc.pageContent),
    };
  });
}
```

**Say**:
- "Semantic search - not just keyword matching"
- "Returns top 5 most relevant comments"
- "Adds them to the context for the next chain"

### Part 4: Add RAG to the Pipeline (2 min - LIVE TYPE THIS!)

**Back to**: `backend/src/chains/index.ts`

**Step 1**: Uncomment the import (type this live)

```typescript
import { createRelevantCommentsChain } from './relevant-comments.chain.js';  // ← Type this!
```

**Step 2**: Create the RAG chain (type this live)

```typescript
export function createFullEmailChain(vectorStore: MemoryVectorStore) {
  const relevantCommentsChain = createRelevantCommentsChain(vectorStore);  // ← Type this!

  return (
    analyzeActivityChain
      // ← About to add RAG here...
```

**Step 3**: Add to pipeline (type this live)

```typescript
  return (
    analyzeActivityChain
      .pipe(relevantCommentsChain)  // ← Type this! Add collaboration context via RAG
      .pipe(determineStyleChain)
      .pipe(generateEmailChain)
  );
```

**Step 4**: Export it (type this live)

```typescript
export {
  analyzeActivityChain,
  createRelevantCommentsChain,  // ← Type this!
  determineStyleChain,
  generateEmailChain,
};
```

**Say**: "Let me save this... the backend will auto-reload with tsx watch."

### Part 5: Show the "After" (2 min)

**Generate another email**:
```bash
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}'
```

**Point out**: "NOW look at the email! It includes Sarah's actual comment: 'Nick, need your input on session handling approach.' That came from the vector store via RAG!"

**Say**: "This is Retrieval Augmented Generation:
- Retrieve relevant data at generation time
- Augment the prompt with that context
- Generate enriched output

This is how you build scalable AI systems."

## 🎯 What You're Typing Live

Here's exactly what to type during the demo:

### 1. Import (Line 3)
```typescript
import { createRelevantCommentsChain } from './relevant-comments.chain.js';
```

### 2. Create chain (Line 52)
```typescript
  const relevantCommentsChain = createRelevantCommentsChain(vectorStore);
```

### 3. Add to pipeline (Line 59)
```typescript
      .pipe(relevantCommentsChain) // Add collaboration context via RAG
```

### 4. Export (Line 68)
```typescript
  createRelevantCommentsChain,
```

**Total typing**: ~4 lines, should take 1-2 minutes

## 🛡️ Safety Net (If Something Goes Wrong)

### If typing goes wrong

**Have this ready in a text file to copy-paste:**

```typescript
import { createRelevantCommentsChain } from './relevant-comments.chain.js';

// In function:
const relevantCommentsChain = createRelevantCommentsChain(vectorStore);

// In pipeline:
.pipe(relevantCommentsChain)

// In exports:
createRelevantCommentsChain,
```

**Say**: "Let me just paste this to save time..."

### If server crashes

**Quickly restore complete version:**
```bash
cp backend/src/chains/index.COMPLETE.ts backend/src/chains/index.ts
```

**Say**: "Let me restart the server with the complete version..."

### If generation fails

**Have a screenshot ready** showing the "after" email with RAG context

**Say**: "Here's what it generated earlier with RAG..."

## 🎨 Visual Aid (Optional)

Draw this on a whiteboard while talking:

```
Before:
[Task Data] → [Analyze] → [Style] → [Generate] → [Email]
                                        ↑
                                     "Missing
                                      context!"

After:
[Task Data] → [Analyze] → [RAG] → [Style] → [Generate] → [Email]
                           ↑
                    [Vector Store]
                    (Search relevant
                     comments)
```

## ⏱️ Timing

- **Before demo**: 2 min
- **Show data**: 1 min
- **Explain RAG chain**: 3 min
- **Live type**: 2 min
- **After demo**: 2 min
- **Total**: ~10 min (fits in your 5-7 min slot with flexibility)

## 📋 Pre-Demo Checklist

- [ ] Copy `index.DEMO_START.ts` to `index.ts`
- [ ] Restart backend server to verify it works without RAG
- [ ] Test generating an email to see "before" state
- [ ] Have `index.COMPLETE.ts` open in a tab as reference
- [ ] Have copy-paste snippet ready as backup
- [ ] Have screenshot of "after" email ready
- [ ] Practice typing the 4 additions smoothly

## 🔄 After Your Demo

**Restore the complete version:**

```bash
cp backend/src/chains/index.COMPLETE.ts backend/src/chains/index.ts
```

Or if using git:
```bash
git checkout main backend/src/chains/index.ts
```

## 💡 Pro Tips

1. **Type slowly**: Better to be clear than fast
2. **Narrate as you type**: "Now I'm importing the RAG chain..."
3. **Show the auto-reload**: "Watch the terminal - tsx is recompiling..."
4. **Point with cursor**: Guide audience attention
5. **Pause for comprehension**: "Does this make sense?"

## 🎓 Key Messages

As you code, emphasize:
- ✅ "This is modular - RAG chain is separate, testable"
- ✅ "LangChain makes composition easy with `.pipe()`"
- ✅ "RAG scales better than putting all data in prompts"
- ✅ "Each chain adds context progressively"

## 🎤 Opening Line

"Right now, our emails mention that people commented, but they don't show WHAT was said. Let's add RAG to pull actual comment content from our vector store. This will take about 2 minutes to code."

## 🎤 Closing Line

"And that's RAG! Three lines of code to add semantic search and context retrieval to our pipeline. This pattern works for any data - docs, code, messages, whatever you need to search and inject into prompts."

---

**You're ready to nail this live coding demo! 🚀**
