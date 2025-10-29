# Demo 3: Email Personalization with RAG

**Core Message**: Same data, personalized experiences - emails that people actually want to read

## Overview

This demo showcases AI-powered email personalization using LangChain orchestration and RAG (Retrieval Augmented Generation). The same task activity data generates wildly different emails based on user preferences and personality types.

**Duration**: 20 minutes

## The Problem

**Traditional Approach (Before)**:
- Static templates with `{{placeholder}}` variables
- Same email structure for everyone
- Generic, robotic, ignored (12% open rate)
- No context awareness

**AI-Powered Approach (After)**:
- Dynamic personalization based on user type
- RAG for pulling relevant collaboration context
- Emails that match user preferences (58%+ open rate)
- Context-aware, engaging, actionable

## The Demo

### 4 User Personas (Same Data, Different Emails)

1. **📊 Sarah Chen** (Detail-Oriented)
   - Comprehensive stats and breakdowns
   - Professional tone
   - Full visibility into everything

2. **⚡ Mike Rodriguez** (Action-Focused)
   - Brief and direct
   - Just what needs attention
   - Skip the fluff

3. **💤 Alex Kumar** (Inactive)
   - Motivational and encouraging
   - Emphasize team needs
   - Re-engagement focused

4. **😎 Jamie Taylor** (Meme-Loving) - **THE WOW**
   - Humorous and casual
   - Meme references and internet culture
   - Makes them smile while informing

### Same Task Data For All

```json
{
  "completed": 5,
  "inProgress": 3,
  "overdue": 2,
  "commented": 7,
  "assigned": 12,
  "created": 4
}
```

**The key**: Same data, but emails adapt to each user's preferences!

## Architecture

### LangChain Multi-Step Orchestration

```typescript
const fullEmailChain =
  analyzeActivityChain          // Step 1: Analyze (GPT-4o)
    .pipe(relevantCommentsChain)     // Step 2: RAG (GPT-4o)
    .pipe(determineStyleChain)       // Step 3: Business logic
    .pipe(generateEmailChain)        // Step 4: Generate content (GPT-4o)
    .pipe(convertToHTMLChain);       // Step 5: Generate HTML (Grok Code Fast) ✨
```

**NEW Features**:
- **Multi-Model Pipeline**: Uses **Grok Code Fast** for HTML/code generation (Step 5) and **GPT-4o** for content (Steps 1, 2, 4). Demonstrates model selection for different tasks! See [GROK_INTEGRATION.md](./GROK_INTEGRATION.md).
- **HTML Conversion**: Converts markdown to beautiful, email-safe HTML with inline styles. Perfect for live coding demonstrations! See [HTML_CONVERSION_GUIDE.md](./HTML_CONVERSION_GUIDE.md).

### RAG Integration

Comments are stored in a vector store for semantic search:

```typescript
// Retrieve relevant comments where user is mentioned
const query = `Comments mentioning ${user.name}`;
const relevantComments = await vectorStore.similaritySearch(query, 5);

// Enrich prompt with real collaboration context
const email = await generateEmail({
  user,
  taskActivity,
  collaborationContext: relevantComments
});
```

### Structured Output with Zod

```typescript
const EmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  format: z.enum(['text', 'html']),
  tone: z.enum(['professional', 'casual', 'humorous', 'encouraging']),
  priorityActions: z.array(z.string()).optional(),
});
```

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Angular (standalone components)
- **AI Framework**: LangChain.js v1
- **LLM**: Azure OpenAI (GPT-4o via Foundry)
- **Vector Store**: LangChain MemoryVectorStore
- **Schema Validation**: Zod
- **Embeddings**: Azure OpenAI (text-embedding-ada-002)

## Project Structure

```
demo3-email-generator/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── chains/       # LangChain orchestration
│   │   ├── config/       # Azure OpenAI + vector store setup
│   │   ├── data/         # Mock users, tasks, comments
│   │   ├── routes/       # API endpoints
│   │   ├── schemas/      # Zod schemas
│   │   └── server.ts     # Express server
│   └── README.md
├── frontend/             # Angular app
│   ├── src/
│   │   └── app/
│   └── README.md
├── PLAN.md              # Comprehensive planning document
└── README.md            # This file
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Azure OpenAI API key (GPT-4o + embeddings deployment)

### 1. Setup Backend

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Azure OpenAI credentials

# Start backend
npm run dev
```

Backend runs on `http://localhost:3003`

### 2. Setup Frontend

```bash
cd frontend
npm install

# Start frontend
npm start
```

Frontend runs on `http://localhost:4203`

### 3. Use the Demo

1. Open `http://localhost:4203` in your browser
2. Select a user persona
3. Click "Generate Email" to see personalized output
4. Try "Side-by-Side Comparison" to generate all 4 at once
5. Notice how the same data produces wildly different emails!

## Demo Flow (20 minutes)

### Part 1: The "Before" - Static Templates (3 min)
- Show generic template code
- Display boring, lifeless email
- Talk about low engagement rates

### Part 2: Introduce User Profiles (2 min)
- Show 4 personas side-by-side
- Highlight the SAME task data for all
- "Different people need different things"

### Part 3: Generate Personalized Emails (8 min)
- Generate Sarah's email (detail-oriented)
- Generate Mike's email (action-focused)
- Generate Alex's email (re-engagement)
- **Show side-by-side**: Same data, wildly different emails!

### Part 4: Live Code - RAG for Collaboration Context (5 min)

**Before**: Emails mention collaborators generically
```typescript
"Sarah commented on your task"
```

**After**: Pull actual comment content via RAG
```typescript
"Sarah commented: 'Nick, need your input on session handling approach'"
```

**Live coding steps**:
1. Show comment data structure
2. Show vector store creation (pre-done)
3. Add `relevantCommentsChain` to pipeline (LIVE CODE THIS)
4. Re-generate email with richer context

### Part 5: The "WOW" - Meme-Loving Developer (2 min)
- Show Jamie's profile with `includeMemes: true`
- Generate the humorous email
- Audience laughs
- "Same task data, completely different vibe!"

## Key Teaching Points

### 1. Orchestration vs Single Call
- **Demo 1**: Single LLM call (simple)
- **Demo 3**: Multi-step orchestration (complex)
- **Decision**: Use chains when you need multiple steps, business logic, or RAG

### 2. RAG for Dynamic Context
- Pull relevant data at generation time
- Semantic search for collaboration context
- Enriches prompts with real information

### 3. Structured Outputs
- Zod schemas ensure type safety
- Prevents hallucination
- Makes LLM outputs predictable

### 4. Personalization at Scale
- Same data, different presentations
- User preferences drive generation
- Business logic + AI = magic

## Connection to Demo 1

**Full circle moment!**

Demo 1 showed the task app with natural language querying.
Demo 3 shows the email system FOR that same task app.

"Remember our task app from earlier? This is its email check-in system."

## Success Criteria

By the end, audience should understand:
- How to personalize content at scale with LLMs
- When/how to use LangChain orchestration
- RAG for dynamic context retrieval
- Graceful degradation strategies
- The power of matching content to user preferences
- End-to-end AI application architecture

## API Endpoints

### Get All Users
```bash
GET http://localhost:3003/api/users
```

### Generate Email for One User
```bash
POST http://localhost:3003/api/generate-email
Content-Type: application/json

{
  "userId": "user-001"
}
```

### Generate Emails for All Users (Batch)
```bash
POST http://localhost:3003/api/generate-email-batch
```

### Get Task Data
```bash
GET http://localhost:3003/api/task-data
```

## Optional: Meme Generation

The meme-loving persona can optionally generate actual meme images using DALL-E 3. This is disabled by default (graceful degradation to text-only).

To enable:
1. Add DALL-E deployment to `.env`
2. Set `memeConfig.enabled = true` in `backend/src/config/azure.config.ts`
3. Test beforehand - have text fallback ready!

## Pre-Demo Checklist

- [ ] Test all 4 email generations
- [ ] Verify comment RAG retrieval works
- [ ] Practice live coding (RAG chain addition)
- [ ] Have backup screenshots ready
- [ ] Test side-by-side comparison
- [ ] Verify timing (20 min total)

## Notes

- Vector store is initialized once at server startup
- Same task data demonstrates personalization power
- RAG pulls up to 5 relevant comments per request
- Generation time typically 3-5 seconds per email
- Batch generation runs in parallel for speed

## License

Part of GenAI Presentation Repository
