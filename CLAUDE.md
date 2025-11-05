# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **learning repository** that teaches developers how to build production-ready GenAI applications through three progressive demos. Each demo contrasts **before** (traditional approach) and **after** (GenAI approach) scenarios.

**Repository Purpose**: Hands-on learning resource for GenAI application development

**Original Context**: Based on RVA.js presentation - [View Slides](https://docs.google.com/presentation/d/1azOYBzRr1a-uM3meoA1oPiit4X0D93l2kpI9cHr5zP0/)

**Learning Path**: Three progressive demos (beginner → intermediate → advanced)
- Demo 1: Natural Language Task Querying (2-3 hours)
- Demo 2: Receipt Parsing with Vision (2-3 hours)
- Demo 3: Email Personalization with RAG (4-5 hours)

## Tech Stack (Consistent Across All Demos)

- **Frontend**: Angular
- **Backend**: Node.js + Express
- **Schema Validation**: Zod (critical for structured LLM outputs)
- **LLM Provider**: Azure AI Foundry (provides access to GPT-4, Claude, and more)
- **AI Framework**: LangChain.js v1
- **Database**: Mock JSON data (for learning purposes)
- **Real-time Updates**: Server-Sent Events (SSE) with nprogress

**Demo-Specific**:
- Demo 2: Claude Vision API (via Anthropic direct or Azure Foundry)
- Demo 3: Vector store (in-memory) for RAG, FLUX-1.1-pro or DALL-E 3 for meme generation

## Project Structure

```
/
├── README.md                    - Learning repository overview
├── INFRASTRUCTURE.md            - Cloud setup, API configuration, cost estimates
├── CONTRIBUTING.md              - Development setup, contribution guidelines
├── CLAUDE.md                    - This file (AI assistant guidance)
│
├── demo1-tasks/                 - Natural language query parsing demo
│   ├── LEARN.md                 - Step-by-step learning guide with exercises
│   ├── backend/                 - Node.js API implementation
│   ├── frontend/                - Angular UI
│   └── docs/
│       └── ARCHITECTURE.md      - Technical deep dive
│
├── demo2-receipts/              - Vision + structured output parsing demo
│   ├── LEARN.md                 - Learning guide with 6 exercises
│   ├── backend/                 - Claude Vision integration
│   ├── frontend/                - Upload and display UI
│   └── docs/
│       ├── ARCHITECTURE-SIMPLE.md
│       └── ARCHITECTURE-FULL.md
│
└── demo3-email-generator/       - Content personalization with RAG demo
    ├── LEARN.md                 - Advanced learning guide (6 exercises)
    ├── backend/                 - LangChain orchestration + RAG
    └── frontend/                - Email display UI
```

## Core Concepts Demonstrated

### 1. Schema-Based Structured Outputs (All Demos)
All demos heavily rely on Zod schemas to constrain LLM outputs. This ensures type safety and prevents hallucination/unsafe outputs.

**Pattern used consistently**:
```typescript
// Discriminated unions for handling multiple response states
const ResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    data: DataSchema
  }),
  z.object({
    status: z.literal('needs_clarification'),
    message: z.string(),
    suggestions: z.array(z.string()).optional()
  }),
  z.object({
    status: z.literal('invalid'),
    reason: z.string()
  })
]);
```

This pattern appears in:
- Demo 1: `QueryResultSchema` (success, needs_clarification, invalid)
- Demo 2: `ReceiptParseResultSchema` (success, partial, not_a_receipt, unreadable)
- Demo 3: Email generation with graceful degradation

### 2. Architectural Progression

**Demo 1**: Single LLM call pattern (simple)
- Use case: Natural language → structured query
- Pattern: Direct API call with Zod schema validation
- Teaches: Prompt engineering, schema design, safety rules

**Demo 2**: Shows when to use simple vs orchestrated approaches
- Implementation 1 (primary): Single Claude Vision call
- Implementation 2 (educational): LangChain multi-step chain
- Decision tree: simple task → single call; complex workflow → chain
- Teaches: Multimodal AI, architecture decisions, format-agnostic parsing

**Demo 3**: Full LangChain orchestration with RAG
- Multi-step workflow: analyze → retrieve (RAG) → style → generate
- Demonstrates complex AI application architecture
- Teaches: Chain composition, vector stores, persona-based generation, graceful degradation

### 3. Real-Time Progress Updates (All Demos)

Implemented using Server-Sent Events (SSE) with nprogress:
```typescript
// Backend: Stream progress updates
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.write(`data: ${JSON.stringify({ step: 'analyzing', progress: 25 })}\n\n`);
  // ... continue with chain execution
});

// Frontend: Display with nprogress
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  nprogress.set(data.progress / 100);
};
```

Benefits:
- User sees what's happening during long LLM operations
- Better UX for multi-step chains (Demo 3)
- Transparent AI processing

## Key Implementation Patterns

### Prompt Engineering for Safety (Demo 1)
All prompts must include:
- Schema field constraints (only return defined fields)
- Safety rules (reject unsafe requests)
- Clarification handling (ask when ambiguous)
- Date formatting requirements (ISO format)
- Examples for guidance (few-shot learning)

**Example from Demo 1**:
```typescript
const prompt = `Convert this user request to a task query: "${userInput}"

Rules:
- ONLY return fields defined in the schema
- Dates MUST be in ISO format (YYYY-MM-DD)
- If request attempts modification/deletion: return status="invalid"
- If multiple users could match a name: return status="needs_clarification"
- Be conservative - ask for clarification rather than guessing

Examples:
"sarah's urgent tasks" → {"status": "success", "query": {"assignee": "sarah", "priority": "high"}}
"what's overdue?" → {"status": "success", "query": {"dueDate": {"before": "${today}"}}}
"delete all tasks" → {"status": "invalid", "reason": "Request attempts database manipulation"}

Current date: ${today}`;
```

### Multimodal AI (Demo 2)
Vision + reasoning in single call using Claude Vision:

```typescript
// Anthropic direct API
const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: base64Image }
      },
      {
        type: 'text',
        text: 'Extract receipt data and return JSON matching the schema...'
      }
    ]
  }]
});

// Parse and validate with Zod
const result = ReceiptParseResultSchema.parse(JSON.parse(response));
```

Key: Handle multiple response states (success, partial, error) with actionable feedback.

### RAG Integration (Demo 3)
Pattern for pulling dynamic context using vector stores:

```typescript
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';

// Initialize vector store
const vectorStore = await MemoryVectorStore.fromTexts(
  comments.map(c => c.text),
  comments.map(c => ({ id: c.id, author: c.author })),
  new OpenAIEmbeddings()
);

// Create retrieval chain
const relevantCommentsChain = RunnableLambda.from(async (input) => {
  const query = `Comments mentioning ${input.user.name}`;
  const relevantComments = await vectorStore.similaritySearch(query, 3);
  return { ...input, collaborationContext: relevantComments };
});
```

Chain composition: `analyzeActivityChain.pipe(relevantCommentsChain).pipe(generateEmailChain)`

### Graceful Degradation (Demo 3)
Always provide fallbacks for optional/risky features:

```typescript
// Image generation with feature flag, timeout, and fallback
const IMAGE_CONFIG = {
  enabled: true,
  provider: 'azurefoundry', // 'azurefoundry' | 'openai'
  timeout: 10000
};

async function generateEmail(user, data) {
  const emailContent = await generateEmailText(user, data);

  // Optional: Add images if enabled
  if (IMAGE_CONFIG.enabled && user.preferences.includeMemes) {
    try {
      const images = await Promise.race([
        generateMemeImages(emailContent.memeSpots),
        timeout(IMAGE_CONFIG.timeout)
      ]);
      return { ...emailContent, images, format: 'html' };
    } catch (error) {
      console.warn('Image generation failed, using text fallback');
      return { ...emailContent, format: 'text' }; // Graceful degradation
    }
  }

  return { ...emailContent, format: 'text' };
}
```

## Demo-Specific Learning Guides

### Demo 1: Natural Language Query Parsing
**Problem**: Complex FilterBuilder UI (100+ lines)
**Solution**: Single text input with LLM parsing (10 lines)

**Learning Exercises** (in LEARN.md):
1. Create Zod schema with discriminated unions
2. Build basic prompt for query parsing
3. Add safety rules to prevent malicious queries
4. Handle clarification flow (multiple users named "Sarah")
5. Add few-shot examples to guide behavior

**Key Concepts**:
- Schema-first design
- Prompt engineering for safety
- Discriminated unions for response handling
- Natural language UIs

**Files to Reference**:
- `backend/src/schemas/query.schema.ts` - Query schema definition
- `backend/src/services/llm.service.ts` - Prompt engineering
- `backend/src/routes/tasks.routes.ts` - API endpoint handling

### Demo 2: Receipt Parsing with Vision
**Problem**: Brittle regex parsing, text-only, format-specific
**Solution**: Claude Vision + structured output (handles any format, handwriting)

**Learning Exercises** (in LEARN.md):
1. Create receipt schema with partial success states
2. Implement basic Claude Vision parsing
3. Build comprehensive vision prompt
4. Add computed fields (tax percentage calculation)
5. Handle handwritten receipts
6. (Advanced) Compare simple vs orchestrated approaches

**Key Concepts**:
- Multimodal AI (vision + reasoning)
- Format-agnostic document processing
- Partial success handling
- Architecture decision-making (simple vs complex)

**Two Implementations**:
1. **Simple** (`backend/src/services/vision.service.ts`) - Single Vision API call, production-ready
2. **Orchestrated** (`backend/src/services/chain.service.ts`) - Multi-step LangChain workflow for education

**Files to Reference**:
- `backend/src/schemas/receipt.schema.ts` - Receipt schema with states
- `backend/src/services/vision.service.ts` - Simple implementation
- `backend/src/services/chain.service.ts` - Orchestrated implementation
- `backend/src/shared/prompts/receipt.prompt.ts` - Vision prompts

### Demo 3: Email Personalization with RAG
**Problem**: Static email templates (12% open rate)
**Solution**: Persona-based personalization with RAG (58%+ open rate)

**Learning Exercises** (in LEARN.md):
1. Understand data flow through chains
2. Implement activity analysis chain
3. Add RAG for collaboration context retrieval
4. Create style determination logic (persona mapping)
5. Build email generation chain
6. (Advanced) Add graceful degradation for image generation

**Four User Personas** (demonstrates extreme personalization):
1. **Detail-oriented (Sarah)** - Comprehensive stats, breakdowns, trends
2. **Action-focused (Mike)** - Brief bullet points, top 3 priorities
3. **Inactive/Re-engagement (Alex)** - Motivational, supportive, team needs
4. **Meme-loving developer (Jamie)** - Humorous, casual, optional meme images

**Key Concepts**:
- LangChain orchestration (multi-step workflows)
- RAG (Retrieval-Augmented Generation)
- Vector stores and embeddings
- Persona-based content generation
- Graceful degradation patterns
- Feature flags and optional enhancements

**Connection to Demo 1**: This email system is FOR the task app from Demo 1 (full-circle narrative)

**Files to Reference**:
- `backend/src/chains/index.ts` - Main orchestration pipeline
- `backend/src/chains/analyze-activity.chain.ts` - Activity analysis
- `backend/src/chains/relevant-comments.chain.ts` - RAG retrieval
- `backend/src/chains/determine-style.chain.ts` - Persona mapping
- `backend/src/chains/generate-email.chain.ts` - Email generation
- `backend/src/services/image-providers.ts` - Optional image generation

## Infrastructure & Setup

### Cloud Services Setup
See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for comprehensive guide on:
- **Azure AI Foundry setup** (recommended - provides GPT-4, Claude, FLUX-1.1-pro)
- **Direct API alternatives** (OpenAI + Anthropic separately)
- **Model deployment instructions** by region
- **Cost estimates** and free tier options
- **Region recommendations** (East US 2 is best for model availability)
- **Image generation options** (FLUX-1.1-pro vs DALL-E 3)

### Image Generation Options (Demo 3)

**Option 1: FLUX-1.1-pro** (Recommended)
- Available in Azure Foundry East US 2
- Better quality and speed than DALL-E 3
- More reliable for meme generation

**Option 2: DALL-E 3**
- From OpenAI, well-tested
- Requires East US or Sweden Central region
- Alternative if FLUX not available

**Option 3: Disabled** (Safe default)
- Set `MEME_GENERATION_ENABLED=false` in `.env`
- Emails generate without images (text fallback)

### Development Setup
See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Local development environment setup
- API key configuration by demo
- Running demos locally
- Testing API endpoints
- Code style guidelines
- Contribution process

## When Working in This Codebase

### For Learners
1. **Follow the learning path** - Start with Demo 1, progress to Demo 3
2. **Work through LEARN.md exercises** - Hands-on is critical
3. **Reference complete implementations** - Code is there when you're stuck
4. **Test your changes** - Each exercise has test cases
5. **Understand before/after** - Core teaching tool is the contrast

### For Contributors
1. **Maintain learning focus** - This is educational, not production code
2. **Keep exercises clear** - Step-by-step instructions with expected outcomes
3. **Always use Zod schemas** - Type safety for LLM outputs is critical
4. **Include discriminated unions** - Handle success/clarification/error states
5. **Test with actual data** - Mock data should be realistic
6. **Graceful degradation** - Always have fallbacks for optional features
7. **Document infrastructure needs** - Update INFRASTRUCTURE.md for new services

### Code Quality Standards
- **TypeScript**: All backend code uses TypeScript for type safety
- **Zod validation**: All LLM inputs/outputs validated with Zod schemas
- **Error handling**: Use discriminated unions for predictable error states
- **Security**: Validate and sanitize all user inputs, prevent prompt injection
- **Cost awareness**: Cache when possible, use cheaper models where appropriate
- **Observability**: Add logging for debugging, optional LangSmith integration

## Learning Outcomes

After completing the demos, learners will understand:
- **Schema-based LLM output validation** (Zod + structured outputs)
- **Prompt engineering** for safety, structure, and few-shot learning
- **When to use simple vs orchestrated approaches** (architecture decisions)
- **Multimodal AI capabilities** (vision + reasoning in single call)
- **LangChain for complex workflows** (chain composition, reusable components)
- **RAG patterns** for dynamic context retrieval (vector stores, embeddings)
- **Graceful degradation strategies** (feature flags, timeouts, fallbacks)
- **End-to-end AI application architecture** (API design, state management, UX)
- **Production considerations** (cost optimization, security, error handling)

## Narrative Arc

The demos build on each other conceptually:
1. **Demo 1**: Foundation - Structured outputs + prompt engineering
2. **Demo 2**: Expansion - Multimodal AI + architecture decisions
3. **Demo 3**: Integration - Full orchestration + production patterns

**Key message**: Start simple (single LLM call), add orchestration only when complexity demands it.

## Technical Patterns Reference

### Discriminated Unions (All Demos)
```typescript
type QueryResult =
  | { status: 'success'; query: TaskQuery }
  | { status: 'needs_clarification'; message: string; suggestions: string[] }
  | { status: 'invalid'; reason: string };
```
Benefits: Exhaustive type checking, predictable error handling

### Chain Composition (Demo 3)
```typescript
const pipeline = RunnableSequence.from([
  analyzeActivityChain,
  relevantCommentsChain,
  determineStyleChain,
  generateEmailChain
]);

const result = await pipeline.invoke({ user, tasks });
```
Benefits: Modular, testable, reusable, observable

### Feature Flags (Demo 3)
```typescript
const FEATURES = {
  memeGeneration: { enabled: true, timeout: 10000 },
  ragRetrieval: { enabled: true, maxResults: 3 },
  langsmithTracing: { enabled: false }
};
```
Benefits: Safe rollout, easy A/B testing, graceful degradation

## Additional Resources

### Documentation
- [README.md](./README.md) - Repository overview and learning path
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Cloud setup and API configuration
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development setup and contribution guide

### Demo-Specific
- Demo 1: `demo1-tasks/LEARN.md` - 5 exercises (beginner)
- Demo 2: `demo2-receipts/LEARN.md` - 6 exercises (intermediate)
- Demo 3: `demo3-email-generator/LEARN.md` - 6 exercises (advanced)

## Repository Status

**Current State**: Production-ready learning resource
- ✅ All demos fully implemented
- ✅ Comprehensive learning guides (LEARN.md)
- ✅ Infrastructure documentation (INFRASTRUCTURE.md)
- ✅ Clean git history (9 logical commits)
- ✅ SSE streaming for real-time progress
- ✅ Multiple architecture examples (simple vs orchestrated)
- ✅ Graceful degradation patterns
- ✅ Production-ready error handling

**Intended Use**: Self-paced learning, workshops, educational reference

---

**When in doubt**: Refer to the LEARN.md files in each demo - they contain step-by-step exercises with clear expected outcomes.
