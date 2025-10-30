# Live Coding Guide: Adding RAG to the Pipeline

This guide walks you through live coding the RAG integration during your demo.

## 📚 Quick Links

- **LIVE_CODING_SETUP.md** - How to prepare files before demo (READ THIS FIRST!)
- **LIVE_CODING_CHEATSHEET.md** - Print this for quick reference during demo

## 🎯 Goal

Show how to add the Relevant Comments Chain (RAG) to the email generation pipeline.

**Time**: 5-7 minutes

## 📋 Prerequisites

✅ **Before demo**: Copy `index.DEMO_START.ts` to `index.ts` (see LIVE_CODING_SETUP.md)
✅ Vector store is initialized at server startup
✅ Comments are embedded and searchable
✅ Chain structure is modular
✅ You're ready to add RAG!

## 🎬 Live Coding Script

### Step 1: Show the Problem (1 min)

**Say**: "Right now, emails mention that people commented, but don't show WHAT they said. Let's fix that with RAG."

**Show**: Open `data/comments.json`

```json
{
  "author": "Sarah",
  "text": "Nick, need your input on the session handling approach",
  "mentions": ["nick"]
}
```

**Say**: "These comments are in our vector store. We want to pull relevant ones into the email."

### Step 2: Show the Vector Store (1 min)

**Show**: Open `config/vectorstore.config.ts` (scroll to line ~40)

```typescript
// Create vector store from documents
vectorStoreInstance = await MemoryVectorStore.fromDocuments(
  documents,
  embeddings
);
```

**Say**: "At startup, we embed all comments and store them. Now we can search them semantically."

### Step 3: Show the RAG Chain (2 min)

**Show**: Open `chains/relevant-comments.chain.ts`

**Walk through the code**:

```typescript
export function createRelevantCommentsChain(vectorStore: MemoryVectorStore) {
  return RunnableLambda.from(async (input) => {
    const { user } = input;

    // 1. Construct search query
    const query = `Comments and mentions for ${user.name}`;

    // 2. Perform semantic search
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
- "We search for comments mentioning the user"
- "Semantic search - not keyword matching"
- "Returns top 5 most relevant comments"
- "Adds them to the context for the next chain"

### Step 4: Show the Pipeline Integration (1 min)

**Show**: Open `chains/index.ts`

```typescript
export function createFullEmailChain(vectorStore: MemoryVectorStore) {
  const relevantCommentsChain = createRelevantCommentsChain(vectorStore);

  return analyzeActivityChain
    .pipe(relevantCommentsChain)  // 👈 HERE! RAG step
    .pipe(determineStyleChain)
    .pipe(generateEmailChain);
}
```

**Say**: "The RAG chain slots right into the pipeline with `.pipe()`. Data flows through each step."

### Step 5: Show How It's Used in Generation (1 min)

**Show**: Open `prompts/email-generation.prompts.ts` (scroll to line ~105)

```typescript
Collaboration Context (comments where user was mentioned):
${collaborationContext.length > 0
  ? collaborationContext.join('\n\n')
  : 'No recent mentions'}
```

**Say**: "The retrieved comments are injected into the prompt. The LLM now has real conversation context!"

### Step 6: Live Demo (1-2 min)

**Terminal**: Generate an email

```bash
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}'
```

**Say**: "Watch the backend logs..."

**Backend logs will show**:
```
Generating email for Sarah Chen (detail-oriented)...
Email generated in 3542ms for Sarah Chen
```

**Show the response** - scroll to the email body and point out:
- "See? The email now includes Sarah's actual comment about session handling"
- "That came from the vector store via semantic search"
- "RAG = Retrieval Augmented Generation"

### Step 7: Wrap Up (30 sec)

**Say**:
- "This is the RAG pattern: retrieve relevant data, augment the prompt, generate"
- "Scalable - we only search for what's relevant"
- "Dynamic - new comments are automatically searchable"
- "This is how you build production AI systems"

## 🗣️ Key Talking Points

### Why RAG?
- **Scalability**: Can't fit all data in prompt (context limits)
- **Freshness**: New data is immediately available
- **Relevance**: Only inject what matters for this request
- **Cost**: Smaller prompts = lower token costs

### Why Vector Store?
- **Semantic search**: "Sarah's comment" finds "Sarah commented: ..."
- **Fast**: Sub-100ms search across thousands of documents
- **Flexible**: Works with any text data

### Why LangChain?
- **Composability**: Chains snap together with `.pipe()`
- **Modularity**: RAG chain is separate, testable
- **Flexibility**: Easy to add/remove/reorder steps

## 🎨 Visual Aid (Draw on Whiteboard)

```
[Task Data] ──┐
              ├──> [Analyze] ──> [RAG] ──> [Style] ──> [Generate] ──> [Email]
              │                   ↑
              └─────────────> [Vector Store]
                              (Search relevant
                               comments)
```

## 🐛 If Something Goes Wrong

### Vector store not initialized
**Error**: "Vector store not initialized"
**Fix**: Check backend logs - did vectorstore.config.ts run at startup?
**Fallback**: "In production, we'd have retry logic, but for the demo, let me restart the server"

### Search returns no results
**Expected**: Some users might not have relevant comments
**Say**: "For this user, no relevant comments were found. The chain gracefully continues with empty context. Watch the fallback..."

### LLM timeout
**Fallback**: Have a screenshot of a successful generation ready
**Say**: "Looks like Azure is being slow. Here's what it generated earlier..."

## 🎓 Questions You Might Get

**Q: "How are comments embedded?"**
A: "At startup, we use Azure OpenAI's text-embedding-ada-002 model. Each comment becomes a vector. Semantic search compares query vector to stored vectors."

**Q: "What if there are thousands of comments?"**
A: "Great question! We'd use a persistent vector store like Pinecone or Weaviate. In-memory works for demos, but production needs persistence and scale."

**Q: "How do you know which comments are relevant?"**
A: "The vector store returns similarity scores. We take top 5, but you could add filtering by date, author, task, etc."

**Q: "Can you show the actual embedding vectors?"**
A: "They're 1536-dimensional floating point arrays - not human-readable! The magic is that similar meanings have similar vectors."

**Q: "Does this work for other languages?"**
A: "Yes! Embeddings work across languages. You could search in English and find relevant comments in Spanish."

## 📝 Code Snippets to Have Ready

### Creating vector store (if needed to show)
```typescript
const embeddings = new OpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiEmbeddingsDeploymentName: 'text-embedding-ada-002',
});

const vectorStore = await MemoryVectorStore.fromDocuments(
  documents,
  embeddings
);
```

### Searching vector store (if needed to show)
```typescript
const results = await vectorStore.similaritySearch(
  "Comments mentioning Sarah",
  5  // top 5 results
);
```

### Alternative: Similarity search with scores
```typescript
const results = await vectorStore.similaritySearchWithScore(
  "Comments mentioning Sarah",
  5
);
// Returns: [{ document, score }, ...]
```

## 🎯 Success Criteria

By the end of this live coding section, the audience should understand:
- ✅ What RAG is and why it's useful
- ✅ How vector stores enable semantic search
- ✅ How to integrate RAG into a LangChain pipeline
- ✅ When to use RAG vs putting everything in the prompt

## ⏱️ Timing Checkpoints

- **1:00** - Shown the problem and data
- **2:00** - Explained vector store
- **4:00** - Walked through RAG chain code
- **5:00** - Shown pipeline integration
- **6:00** - Generated email live
- **7:00** - Wrapped up and answered questions

## 💡 Pro Tips

1. **Keep terminal visible**: Show backend logs during generation
2. **Zoom in**: Make sure code is readable from the back
3. **Highlight lines**: Use cursor to guide attention
4. **Slow down**: Pause after each concept for comprehension
5. **Check in**: "Does this make sense so far?"

---

**Remember**: You know this code inside and out now. Be confident, go slow, and have fun showing off what you built!
