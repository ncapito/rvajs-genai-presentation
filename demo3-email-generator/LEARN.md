# Demo 3: Email Personalization with RAG - Learning Guide

## 🎯 Learning Objectives

By completing this demo, you'll learn how to:
- Build complex LangChain orchestration pipelines
- Implement RAG (Retrieval-Augmented Generation) for dynamic context
- Create persona-based content personalization
- Handle graceful degradation for optional features
- Design end-to-end GenAI applications

## 📖 Overview

This demo demonstrates how to transform static email templates into hyper-personalized content using GenAI.

**The Impact:**
- **Before**: Static templates, 12% open rate, 2% click rate
- **After**: Persona-based personalization, 58%+ open rate, 15%+ click rate

**The Connection**: This is the email system FOR the task app from Demo 1!

## 🏗️ Architecture

This is a **full LangChain orchestration** with multiple chains:

```
User Input
    ↓
┌───────────────────────┐
│ 1. Analyze Activity   │ ← Understand user's task patterns
└───────────────────────┘
    ↓
┌───────────────────────┐
│ 2. Retrieve Context   │ ← RAG: Pull relevant comments
└───────────────────────┘
    ↓
┌───────────────────────┐
│ 3. Determine Style    │ ← Choose tone based on persona
└───────────────────────┘
    ↓
┌───────────────────────┐
│ 4. Generate Email     │ ← Create personalized content
└───────────────────────┘
    ↓
┌───────────────────────┐
│ 5. Optional: Images   │ ← Add memes (graceful degradation)
└───────────────────────┘
    ↓
Final Email
```

**Tech Stack**:
- Frontend: Angular
- Backend: Node.js + Express
- LLM: Azure OpenAI (GPT-4)
- Framework: LangChain.js
- Vector Store: In-memory (for RAG)
- Optional: DALL-E 3 for image generation

## 🚀 Getting Started

### Prerequisites
- Completed Demo 1 (conceptual understanding)
- Node.js 18+
- Azure OpenAI API access
- Understanding of async/promises

### Setup

1. Navigate to backend:
   ```bash
   cd demo3-email-generator/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Configure API keys in `.env`:
   ```
   AZURE_OPENAI_API_KEY=your_key
   AZURE_OPENAI_ENDPOINT=your_endpoint
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   ```

5. Start backend:
   ```bash
   npm run dev
   ```

6. Start frontend (new terminal):
   ```bash
   cd demo3-email-generator/frontend
   npm install
   npm start
   ```

7. Open http://localhost:4202

## 👥 Understanding the Personas

The system generates completely different emails for different user types:

### 1. Sarah - Detail-Oriented
- **Characteristics**: Loves data, metrics, comprehensive reports
- **Email Style**: Detailed statistics, breakdowns, trends, charts
- **Tone**: Professional, informative, thorough

### 2. Mike - Action-Focused
- **Characteristics**: Busy, wants quick updates, action items only
- **Email Style**: Bullet points, top 3 priorities, next steps
- **Tone**: Direct, concise, urgent

### 3. Alex - Inactive/Re-engagement
- **Characteristics**: Haven't been active, needs motivation
- **Email Style**: Encouraging, shows team needs, offers help
- **Tone**: Supportive, motivational, welcoming

### 4. Jamie - Meme-Loving Developer
- **Characteristics**: Casual, enjoys humor, developer culture
- **Email Style**: Jokes, meme references, casual language
- **Tone**: Fun, relatable, informal
- **Special**: Optional meme image generation!

## 📚 Implementation Exercises

### Exercise 1: Understand the Data Flow

**Goal**: Trace how data flows through the system.

**Your Task**:

1. **Examine the data structures** in `backend/src/data/`:
   - `users.ts` - User profiles with preferences
   - `tasks.ts` - Task activity data
   - `comments.ts` - Collaboration context

2. **Trace a request**:
   - Start: `POST /api/emails/generate`
   - Route: `backend/src/routes/email.routes.ts`
   - Chain: `backend/src/chains/index.ts`
   - Individual chains: `backend/src/chains/*.chain.ts`

3. **Draw a diagram** (on paper or tool) showing:
   - Input: userId
   - Data fetched at each step
   - Output: personalized email

**Questions to Answer**:
- Where is user preference data loaded?
- When does RAG retrieval happen?
- Which chain determines email tone?
- How are optional features (memes) handled?

---

### Exercise 2: Implement the Activity Analysis Chain

**Goal**: Create the first chain that analyzes user task activity.

**Location**: `backend/src/chains/analyze-activity.chain.ts`

**Your Task**:

Build a chain that takes user data and task activity, then returns insights:

```typescript
import { RunnableLambda } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

// Define output schema
const ActivityAnalysisSchema = z.object({
  tasksCompleted: z.number(),
  overdueTasks: z.number(),
  activeTasks: z.number(),
  productivity: z.enum(['high', 'medium', 'low']),
  topPriorities: z.array(z.string()),
  needsAttention: z.array(z.string())
});

export const analyzeActivityChain = RunnableLambda.from(async (input: {
  user: User;
  tasks: Task[];
}) => {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0 // Deterministic for analysis
  });

  const prompt = `Analyze this user's task activity:

User: ${input.user.name}
Total Tasks: ${input.tasks.length}

Tasks:
${input.tasks.map(t => `- ${t.title} (${t.status}) - Priority: ${t.priority}`).join('\n')}

Provide analysis in JSON format:
{
  "tasksCompleted": <count of done tasks>,
  "overdueTasks": <count of overdue>,
  "activeTasks": <count of in-progress>,
  "productivity": "high" | "medium" | "low",
  "topPriorities": [<array of top 3 task titles>],
  "needsAttention": [<array of items needing attention>]
}`;

  // TODO: Call LLM with structured output
  const response = await llm.invoke(prompt);

  // TODO: Parse and validate against schema
  const analysis = ActivityAnalysisSchema.parse(JSON.parse(response.content));

  return {
    ...input,
    analysis
  };
});
```

**Test It**:
```bash
curl -X POST http://localhost:3002/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "user1"}'
```

**Why This Matters**: Breaking complex tasks into discrete analysis steps makes the system more maintainable and testable.

---

### Exercise 3: Implement RAG for Collaboration Context

**Goal**: Add vector store retrieval to pull relevant comment data.

**Location**: `backend/src/chains/relevant-comments.chain.ts`

**Your Task**:

1. **Set up vector store** (in-memory for demo):
   ```typescript
   import { MemoryVectorStore } from 'langchain/vectorstores/memory';
   import { OpenAIEmbeddings } from '@langchain/openai';

   // In your initialization
   const embeddings = new OpenAIEmbeddings();
   const comments = await loadComments(); // Load from data file

   const vectorStore = await MemoryVectorStore.fromTexts(
     comments.map(c => c.text),
     comments.map(c => ({ commentId: c.id, author: c.author })),
     embeddings
   );
   ```

2. **Create retrieval chain**:
   ```typescript
   export const relevantCommentsChain = RunnableLambda.from(async (input) => {
     // Build query based on user name and current context
     const query = `Comments mentioning ${input.user.name} or related to their tasks`;

     // Retrieve top 3 relevant comments
     const relevantComments = await vectorStore.similaritySearch(query, 3);

     return {
       ...input,
       collaborationContext: relevantComments.map(doc => doc.pageContent)
     };
   });
   ```

3. **Integrate into main chain**:
   ```typescript
   const emailChain = RunnableSequence.from([
     analyzeActivityChain,
     relevantCommentsChain, // ← Add RAG step here
     determineStyleChain,
     generateEmailChain
   ]);
   ```

**Test RAG**:
- Generate email for user with comments
- Verify generated email mentions collaboration context
- Try different users and see different comments retrieved

**Why This Matters**: RAG allows LLMs to use dynamic, up-to-date information not in their training data.

---

### Exercise 4: Create the Style Determination Chain

**Goal**: Map user personas to email generation styles.

**Location**: `backend/src/chains/determine-style.chain.ts`

**Your Task**:

Create logic that selects tone, format, and priorities based on user preferences:

```typescript
import { RunnableLambda } from '@langchain/core/runnables';

type EmailStyle = {
  tone: 'formal' | 'casual' | 'encouraging' | 'humorous';
  format: 'detailed' | 'brief' | 'motivational' | 'casual';
  priorities: string[];
  includeMemes: boolean;
};

export const determineStyleChain = RunnableLambda.from(async (input) => {
  const { user, analysis } = input;

  let style: EmailStyle;

  if (user.preferences.detailOriented) {
    style = {
      tone: 'formal',
      format: 'detailed',
      priorities: ['comprehensive_stats', 'trends', 'breakdowns'],
      includeMemes: false
    };
  } else if (user.preferences.actionFocused) {
    style = {
      tone: 'casual',
      format: 'brief',
      priorities: ['top_actions', 'next_steps', 'deadlines'],
      includeMemes: false
    };
  } else if (user.preferences.needsReengagement) {
    style = {
      tone: 'encouraging',
      format: 'motivational',
      priorities: ['team_needs', 'help_offered', 'easy_wins'],
      includeMemes: false
    };
  } else if (user.preferences.memeLover) {
    style = {
      tone: 'humorous',
      format: 'casual',
      priorities: ['fun_facts', 'jokes', 'relatable_content'],
      includeMemes: true
    };
  } else {
    // Default style
    style = {
      tone: 'casual',
      format: 'brief',
      priorities: ['summary', 'action_items'],
      includeMemes: false
    };
  }

  return {
    ...input,
    style
  };
});
```

**Test Different Personas**:
```bash
# Detail-oriented (Sarah)
curl -X POST http://localhost:3002/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "sarah"}'

# Action-focused (Mike)
curl -X POST http://localhost:3002/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "mike"}'

# Meme-lover (Jamie)
curl -X POST http://localhost:3002/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "jamie"}'
```

**Expected**: Each should produce dramatically different email content.

---

### Exercise 5: Build the Email Generation Chain

**Goal**: Create the final chain that generates personalized email content.

**Location**: `backend/src/chains/generate-email.chain.ts`

**Your Task**:

Use all previous chain outputs to generate the email:

```typescript
export const generateEmailChain = RunnableLambda.from(async (input) => {
  const { user, analysis, collaborationContext, style } = input;

  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7 // Some creativity for email writing
  });

  const prompt = `Generate a personalized task summary email.

Recipient: ${user.name}
Email Tone: ${style.tone}
Format: ${style.format}

Activity Analysis:
- Completed: ${analysis.tasksCompleted}
- Overdue: ${analysis.overdueTasks}
- Productivity: ${analysis.productivity}
- Top Priorities: ${analysis.topPriorities.join(', ')}

Collaboration Context:
${collaborationContext.join('\n')}

Style Guidelines:
${style.priorities.map(p => `- Focus on ${p}`).join('\n')}

${style.tone === 'humorous' ? `
- Use casual, fun language
- Include developer humor
- Mark spots where memes would fit with [MEME: description]
` : ''}

${style.format === 'brief' ? `
- Keep under 150 words
- Use bullet points
- Only essential information
` : ''}

${style.format === 'detailed' ? `
- Provide comprehensive statistics
- Include trends and insights
- Use structured sections
` : ''}

Generate the email body now:`;

  const response = await llm.invoke(prompt);

  return {
    ...input,
    emailContent: response.content,
    subject: `Task Summary for ${user.name} - ${new Date().toLocaleDateString()}`
  };
});
```

**Validation**:
- Sarah's email should be long and detailed
- Mike's email should be under 150 words
- Alex's email should be encouraging
- Jamie's email should have [MEME: ...] markers

---

### Exercise 6 (Advanced): Add Graceful Degradation for Meme Generation

**Goal**: Implement optional image generation with fallback.

**Location**: `backend/src/services/image-providers.ts`

**Your Task**:

Create a service that attempts to generate memes but falls back gracefully:

```typescript
const MEME_CONFIG = {
  enabled: true, // Feature flag
  generationTimeout: 10000, // 10 seconds
  maxRetries: 2
};

export async function generateMemesForEmail(
  emailContent: string,
  memeSpots: string[]
): Promise<{ images?: string[]; format: 'html' | 'text' }> {

  if (!MEME_CONFIG.enabled) {
    console.log('Meme generation disabled');
    return { format: 'text' };
  }

  try {
    // Race against timeout
    const images = await Promise.race([
      generateImages(memeSpots),
      timeout(MEME_CONFIG.generationTimeout)
    ]);

    return {
      images,
      format: 'html'
    };
  } catch (error) {
    console.error('Meme generation failed, falling back to text', error);
    // Graceful degradation - return text version
    return { format: 'text' };
  }
}

async function generateImages(descriptions: string[]): Promise<string[]> {
  // Use DALL-E 3 or other image generation API
  // Return array of base64 or URLs
  const results = await Promise.all(
    descriptions.map(desc => generateSingleImage(desc))
  );
  return results;
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
}
```

**Integration**:
```typescript
// In email generation chain
if (style.includeMemes) {
  const memeResult = await generateMemesForEmail(
    emailContent,
    extractMemeSpots(emailContent) // Parse [MEME: ...] markers
  );

  return {
    ...input,
    emailContent,
    images: memeResult.images,
    format: memeResult.format
  };
}
```

**Why This Matters**: Production AI systems need fallbacks. Meme generation is fun but optional - don't break the whole email if it fails.

---

## 🎓 Key Concepts Explained

### LangChain Orchestration
**Why use chains?**
- **Modularity**: Each chain does one thing well
- **Reusability**: Chains can be reused in different flows
- **Observability**: Easy to log/trace each step
- **Testing**: Test each chain independently

**When to use**:
- ✅ Multi-step workflows
- ✅ Different models per step
- ✅ Reusable components
- ❌ Simple single-call tasks (use direct API instead)

### RAG (Retrieval-Augmented Generation)
**Pattern**:
1. **Embed** documents into vector store (one-time)
2. **Retrieve** relevant docs based on query
3. **Augment** LLM prompt with retrieved context
4. **Generate** response using augmented context

**Benefits**:
- Up-to-date information without retraining
- Source attribution for outputs
- Cost-effective vs fine-tuning

### Persona-Based Personalization
Instead of one-size-fits-all templates:
- Analyze user behavior and preferences
- Map to communication styles
- Generate content matching their needs
- Result: Dramatically higher engagement

### Graceful Degradation
**Pattern**: Try advanced features, fallback if they fail
```typescript
try {
  const enhanced = await advancedFeature();
  return enhanced;
} catch (error) {
  console.error('Advanced feature failed, using fallback');
  return basicVersion();
}
```

**Apply to**:
- Optional image generation
- External API calls
- Expensive LLM operations
- Time-sensitive features

## 📝 Testing Different Personas

### Test Suite

```bash
# 1. Detail-Oriented (Sarah)
curl -X POST http://localhost:3002/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "sarah"}' | jq .
# Expected: Long email, lots of stats, formal tone

# 2. Action-Focused (Mike)
curl -X POST http://localhost:3002/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "mike"}' | jq .
# Expected: Brief, bullet points, direct

# 3. Inactive (Alex)
curl -X POST http://localhost:3002/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "alex"}' | jq .
# Expected: Encouraging, motivational, supportive

# 4. Meme Lover (Jamie)
curl -X POST http://localhost:3002/api/emails/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": "jamie"}' | jq .
# Expected: Casual, humorous, may include [MEME: ...] markers
```

### Evaluation Criteria

For each generated email, check:
- ✅ **Tone matches persona** (formal vs casual vs encouraging)
- ✅ **Length appropriate** (brief for Mike, detailed for Sarah)
- ✅ **Content relevance** (highlights what matters to this user)
- ✅ **Collaboration context** (mentions relevant comments)
- ✅ **Actionability** (clear next steps if action-focused)

## 🔍 Reference Implementation

Complete code in:
- **Main Chain**: `backend/src/chains/index.ts`
- **Activity Analysis**: `backend/src/chains/analyze-activity.chain.ts`
- **RAG Retrieval**: `backend/src/chains/relevant-comments.chain.ts`
- **Style Selection**: `backend/src/chains/determine-style.chain.ts`
- **Email Generation**: `backend/src/chains/generate-email.chain.ts`
- **Image Generation**: `backend/src/services/image-providers.ts`
- **Data**: `backend/src/data/`

## 🎯 Success Criteria

You've completed this demo when:
- ✅ Can generate emails for all 4 personas
- ✅ Each persona gets distinctly different content
- ✅ RAG retrieval adds relevant collaboration context
- ✅ Graceful degradation works for optional features
- ✅ Understand chain orchestration benefits
- ✅ Can explain when to use RAG vs fine-tuning

## 🚀 Going Further

**Challenge Exercises**:

1. **A/B Testing Framework**
   - Generate 2 versions per user
   - Track which gets better engagement
   - Learn optimal styles per persona

2. **Multi-Language Support**
   - Detect user language preference
   - Generate emails in their language
   - Maintain persona characteristics across languages

3. **Sentiment-Aware Generation**
   - Analyze recent comment sentiment
   - Adjust tone if user seems stressed/frustrated
   - Offer help if negative sentiment detected

4. **Time-Based Optimization**
   - Learn best send times per user
   - Schedule emails for optimal engagement
   - Adjust content based on time of day

5. **Feedback Loop**
   - Track email open/click rates
   - Feed back to style selection
   - Continuously improve personalization

**Production Considerations**:
- Add email delivery service (SendGrid, AWS SES)
- Implement unsubscribe handling
- Add rate limiting (max emails per user per day)
- Store generated emails for audit trail
- Add LangSmith tracing for debugging
- Implement cost tracking per email
- Add user preference learning over time

## 📚 Additional Resources

- [LangChain Orchestration Guide](https://js.langchain.com/docs/expression_language/)
- [RAG Best Practices](https://js.langchain.com/docs/use_cases/question_answering/)
- [Vector Store Selection Guide](https://js.langchain.com/docs/integrations/vectorstores/)
- [Prompt Engineering for Personalization](https://www.promptingguide.ai/)
- [DALL-E 3 API Docs](https://platform.openai.com/docs/guides/images)

## 🆘 Troubleshooting

**Issue**: Chains not executing in order
- **Solution**: Use `RunnableSequence.from([...])` not parallel calls

**Issue**: RAG not returning relevant comments
- **Solution**: Improve query construction, check vector store embeddings

**Issue**: All emails sound the same
- **Solution**: Strengthen persona differentiation in prompts

**Issue**: Meme generation timing out
- **Solution**: Reduce timeout, improve fallback handling

**Issue**: Email too generic despite personalization
- **Solution**: Add more specific examples in generation prompt

**Issue**: Vector store errors
- **Solution**: Check embeddings API key, verify data format

## 📊 Architecture Comparison

| Aspect | Demo 1 | Demo 2 | Demo 3 |
|--------|---------|---------|---------|
| **Complexity** | Single call | Single or multi-step | Full orchestration |
| **Pattern** | Structured output | Vision + parsing | RAG + chains |
| **Use Case** | UI simplification | Document processing | Content generation |
| **Key Learning** | Schema validation | Multimodal AI | Complex workflows |

---

**Ready to build personalized emails?** Start with Exercise 1 and work through the chain! 📧✨
