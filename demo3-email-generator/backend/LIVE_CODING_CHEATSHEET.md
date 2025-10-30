# Live Coding Cheat Sheet

Print this or keep on second monitor during demo!

## 🚀 Quick Setup

```bash
# Before demo starts
cd backend/src/chains
cp index.DEMO_START.ts index.ts
cd ../../..
npm run dev  # Restart server
```

## ⌨️ What to Type (in order)

### 1. Import (Line ~3)
```typescript
import { createRelevantCommentsChain } from './relevant-comments.chain.js';
```

### 2. Create chain (Line ~52)
```typescript
  const relevantCommentsChain = createRelevantCommentsChain(vectorStore);
```

### 3. Add to pipeline (Line ~59)
```typescript
      .pipe(relevantCommentsChain) // Add collaboration context via RAG
```

### 4. Export (Line ~68)
```typescript
  createRelevantCommentsChain,
```

## 🎤 What to Say

### When starting
> "Right now emails mention comments but don't show WHAT was said. Let's add RAG to fix that."

### When showing comments.json
> "These comments are embedded in our vector store at startup."

### When showing relevant-comments.chain.ts
> "This chain does semantic search - not keyword matching. It finds the 5 most relevant comments and adds them to context."

### When typing
> "I'm importing the RAG chain... creating it with the vector store... piping it into the pipeline... and exporting it."

### When done
> "Watch the terminal - tsx is auto-reloading. Let's generate an email..."

### After generation
> "NOW it includes Sarah's actual comment! That's RAG - retrieve, augment, generate."

## 🛡️ Emergency Copy-Paste

If typing fails, paste this:

```typescript
import { createRelevantCommentsChain } from './relevant-comments.chain.js';

// Inside createFullEmailChain:
const relevantCommentsChain = createRelevantCommentsChain(vectorStore);

// In pipeline:
.pipe(relevantCommentsChain)

// In exports:
createRelevantCommentsChain,
```

## 🔥 Emergency Restore

```bash
cp backend/src/chains/index.COMPLETE.ts backend/src/chains/index.ts
```

## 📍 Files to Have Open

1. `backend/src/chains/index.ts` (where you'll type)
2. `backend/src/chains/relevant-comments.chain.ts` (to show)
3. `backend/src/data/comments.json` (to show)
4. `backend/src/chains/index.COMPLETE.ts` (reference)

## 🧪 Test Commands

```bash
# Generate email (before RAG)
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}'

# Generate email (after RAG)
# Same command - compare results!
```

## ✅ Success Signs

- [ ] Backend restarts without errors
- [ ] "Before" email mentions comments generically
- [ ] "After" email quotes actual comment text
- [ ] Backend logs show "Vector store initialized"

## ⏱️ Timing (10 min total)

- 0:00-2:00 - Show before, generate email
- 2:00-3:00 - Show comments.json data
- 3:00-6:00 - Explain relevant-comments.chain.ts
- 6:00-8:00 - Live type the 4 additions
- 8:00-10:00 - Generate email, show after

## 🎯 Key Points to Hit

✅ "RAG = Retrieval Augmented Generation"
✅ "Semantic search, not keyword search"
✅ "Vector store holds embedded comments"
✅ "Chains compose with .pipe()"
✅ "Each step adds context progressively"
✅ "Scalable - only retrieve what's relevant"

## 🎓 If Asked Questions

**"How are comments embedded?"**
> "Azure OpenAI text-embedding-ada-002 at startup. Each comment becomes a 1536-dim vector."

**"What if thousands of comments?"**
> "Production uses persistent vector stores like Pinecone. In-memory is fine for demos."

**"Can you show the vectors?"**
> "They're 1536 floating point numbers - not human readable! Magic is semantic similarity."

---

## 🎬 You Got This!

Remember:
- Type slowly and clearly
- Pause for comprehension
- Show don't tell
- Have fun with it!

**Opening**: "Let's add RAG to pull real comment content."
**Closing**: "That's RAG - 4 lines of code to add semantic search!"
