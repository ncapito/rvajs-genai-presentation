# Demo 3: Email Personalization with RAG

## Same Data, Wildly Different Emails

**Connection to Demo 1:** This is the email system FOR the task app!

---

## ❌ The Problem: Static Templates

### Everyone Gets the Same Boring Email

```typescript
// Traditional approach - BORING & IGNORED
function generateEmail(user: User, data: TaskData): string {
  return `
    Hi ${user.name},

    Here's your summary for ${data.dateRange}:

    - Assigned tasks: ${data.assigned}
    - In progress: ${data.inProgress}
    - Completed: ${data.completed}
    - Overdue: ${data.overdue}

    View dashboard: ${dashboardUrl}

    Thanks,
    Task Bot
  `;
}
```

---

## What Users Actually Want

### Four Different Needs

| Persona | What They Want |
|---------|----------------|
| **Detail-Oriented** | "Show me EVERYTHING - all the stats!" |
| **Action-Focused** | "Just tell me what needs my attention NOW" |
| **Inactive** | "Give me a reason to come back" |
| **Meme-Loving** | "Make it entertaining!" |

**Same data** → **Different needs** → **Different emails**

---

## ✅ The Solution: Personalization Pipeline

### LangChain Orchestration (4 Steps)

```typescript
export function createFullEmailChain(vectorStore: MemoryVectorStore) {
  const relevantCommentsChain = createRelevantCommentsChain(vectorStore);

  return analyzeActivityChain              // Step 1: LLM analyzes task data
    .pipe(relevantCommentsChain)           // Step 2: RAG for collaboration context
    .pipe(determineStyleChain)             // Step 3: Business logic (no LLM)
    .pipe(generateEmailChain);             // Step 4: LLM generates email
}
```

**Flow:** Analyze → RAG → Style → Generate

---

## Step 1: Analyze Activity

### LLM Finds Patterns and Insights

```typescript
export const analyzeActivityChain = RunnableLambda.from(
  async (input: AnalyzeActivityInput): Promise<AnalyzeActivityOutput> => {
    const systemPrompt = `Analyze the user's task activity and identify:
1. Overall patterns (productive, falling behind, needs attention)
2. Key highlights (completed tasks, active discussions)
3. Areas of concern (overdue tasks, blocking issues)
4. Collaboration signals (comments, mentions, team interactions)`;

    const userPrompt = `Analyze this task activity:
- Assigned: ${taskActivity.assigned}
- In Progress: ${taskActivity.inProgress}
- Completed: ${taskActivity.completed}
- Overdue: ${taskActivity.overdue}
...`;

    const response = await azureLLM.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ]);

    return { ...input, activityAnalysis: response.content };
  }
);
```

**Output:** Insights like "User is productive but has 2 blocking overdue tasks"

---

### The Prompt (Step 1: Analyze Activity)

**System Prompt:**
```
You are an expert at analyzing task activity data and identifying the most important points.

Your role is to:
1. Identify urgent items (overdue tasks)
2. Highlight active discussions (tasks with comments)
3. Recognize progress highlights (completed tasks)
4. Assess overall workload

Provide a concise, actionable analysis for a personalized email.
```

**User Prompt:**
```
Analyze this task activity:

Task Activity Summary:
- Assigned: 12 tasks
- In Progress: 3 tasks
- Completed: 5 tasks
- Overdue: 2 tasks
- Commented on: 7 tasks

Recent Activity: [...]
Overdue Tasks: [...]
In Progress Tasks: [...]

Provide analysis focusing on:
1. Most urgent items (overdue tasks)
2. Active discussions (tasks with comments)
3. Progress highlights (completed tasks)
4. Overall workload assessment
```

---

## Step 2: RAG for Collaboration Context

### Retrieve Relevant Comments Where User is Mentioned

```typescript
export function createRelevantCommentsChain(vectorStore: MemoryVectorStore) {
  return RunnableLambda.from(
    async (input: AnalyzeActivityOutput): Promise<RelevantCommentsOutput> => {
      const { user } = input;

      // Semantic search for comments mentioning this user
      const query = `Important discussions and decisions requiring ${user.name}'s input`;

      const allResults = await vectorStore.similaritySearch(query, 20);

      // Filter by user mentions
      const relevantComments = allResults
        .filter(doc => doc.metadata.mentions?.includes(user.name.toLowerCase()))
        .slice(0, 5);

      return {
        ...input,
        collaborationContext: relevantComments.map(doc => doc.pageContent)
      };
    }
  );
}
```

**Key:** Same system, different comments for each user!

**No prompt needed** - This is pure semantic search logic!

---

## Step 3: Determine Style

### Business Logic (No LLM Needed!)

```typescript
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
  'inactive': {
    structure: 'motivational',
    tone: 'encouraging',
    emphasizeTeamNeeds: true,
  },
  'meme-loving': {
    structure: 'humorous',
    tone: 'casual',
    includeReferences: true,
    includeMemes: true,
  },
};

export const determineStyleChain = RunnableLambda.from(
  async (input: RelevantCommentsOutput): Promise<DetermineStyleOutput> => {
    const baseStyle = USER_TYPE_STYLE_MAP[user.userType];
    return { ...input, emailStyle: baseStyle };
  }
);
```

**💡 Teaching Moment:** Use code for rules, LLMs for creativity!

**No prompt needed** - This is a simple lookup table!

---

## Step 4: Generate Email

### All Context Flows Into Final Generation

```typescript
export const generateEmailChain = RunnableLambda.from(
  async (input: DetermineStyleOutput): Promise<GenerateEmailOutput> => {
    const {
      user,
      activityAnalysis,        // From Step 1
      collaborationContext,    // From Step 2 (RAG!)
      emailStyle,              // From Step 3
      taskActivity,
      recentActivity,
      overdueTasks,
      inProgressTasks,
    } = input;

    const parser = StructuredOutputParser.fromZodSchema(EmailSchema);

    const systemPrompt = getEmailGenerationSystemPrompt(user, formatInstructions);
    const userPrompt = getEmailGenerationUserPrompt(
      user,
      activityAnalysis,
      taskActivity,
      recentActivity,
      overdueTasks,
      inProgressTasks,
      collaborationContext  // 👈 RAG context enriches the prompt!
    );

    const response = await azureLLM.invoke([...messages]);
    const email = await parser.parse(response.content);

    return { ...input, email };
  }
);
```

---

### The Prompt (Step 4: Generate Email)

**System Prompt:**
```
You are an expert email writer specializing in personalized task management communications.

Your goal is to generate a task summary email that matches the user's preferences and personality.

User Profile:
- Name: ${user.name}
- Type: ${user.userType}
- Preferences: ${user.preferences}
- Description: ${user.description}

Style Requirements:
[Persona-specific guidance - see below]

IMPORTANT: Generate ONLY the fields specified in the schema. Do not add extra fields.
```

**User Prompt:**
```
Generate a personalized task summary email for ${user.name}.

Activity Analysis:
${activityAnalysis}  // From Step 1

Task Data:
- Assigned: 12, In Progress: 3, Completed: 5, Overdue: 2

Recent Activity: [...]
Overdue Tasks: [...]
In Progress Tasks: [...]

Collaboration Context (comments where user was mentioned):
${collaborationContext}  // From Step 2 (RAG!)

Generate the email following the style requirements and user preferences.
```

---

## Persona-Specific Prompts

### Same Data, Different Instructions

```typescript
function getStyleGuidanceForUserType(userType: string): string {
  const styleMap = {
    'detail-oriented': `
- Use professional, comprehensive tone
- Include detailed statistics and breakdowns
- Organize with clear sections
- Show percentages, time estimates, metrics`,

    'action-focused': `
- Be direct and brief
- Lead with what needs immediate action
- Use bullet points, no fluff
- Include clear CTAs`,

    'inactive': `
- Use encouraging, motivational tone
- Emphasize that the team needs their input
- Show what they're missing
- Include re-engagement options`,

    'meme-loving': `
- Use casual, humorous tone (internet culture)
- Include meme references and jokes
- Be playful but still informative
- Make it fun!`,
  };
  return styleMap[userType];
}
```

---

## What is RAG?

### Retrieval Augmented Generation

```
1. RETRIEVE relevant data from vector store
      ↓
2. AUGMENT the prompt with that data
      ↓
3. GENERATE output with enriched context
```

**Why RAG?**
- Can't fit all data in prompt (context limits)
- Only retrieve what's relevant (efficiency)
- New data is immediately searchable (freshness)
- Personalized by user (Sarah's comments ≠ Mike's)

---

## The Four Email Results

### Persona 1: Detail-Oriented (Sarah)

```
Subject: Your Weekly Task Summary - Oct 7-14

Hi Sarah,

📊 OVERVIEW:
   ✅ Completed: 5 tasks
   💬 Active in comments: 7 tasks
   🔄 In progress: 3 tasks
   ⚠️ Overdue: 2 tasks

🎯 TASKS IN PROGRESS:
   • Fix authentication bug (3 comments this week)
     - Last activity: Oct 12
     - Collaborators: You, Sarah, Mike

⚠️ NEEDS IMMEDIATE ATTENTION:
   1. Database migration (HIGH PRIORITY)
      - Due: Oct 11 (3 days overdue)
      - Blocking: 2 downstream tasks

💬 ACTIVE DISCUSSIONS:
   • Sarah: "Nick, need your input on session handling approach"
   • John: "@nick thoughts on Redis approach?"

📈 TRENDS:
   • Completion rate: 71% (up from 65% last week)
   • Comment engagement: High
```

**Comprehensive, detailed, stats-heavy**

---

## The Four Email Results

### Persona 2: Action-Focused (Mike)

```
Subject: 2 Overdue Tasks + 3 In Progress

Hey Mike,

⚠️ OVERDUE (needs action now):
   1. Database migration (due Oct 11)
   2. Security audit review (due Oct 13)

🔄 IN PROGRESS:
   • Fix authentication bug
   • Refactor user service
   • Update dashboard UI

💬 NEED YOUR INPUT:
   • Sarah: "Need your input on session handling"
   • John: "@mike thoughts on Redis approach?"

[Complete Overdue Tasks]

BTW - great week! 5 tasks completed 🎉
```

**Brief, direct, action-oriented**

---

## The Four Email Results

### Persona 3: Inactive (Alex)

```
Subject: Your Team Needs You - Tasks Waiting

Hey Alex,

We noticed you haven't logged in since Oct 10. No worries - we know things get busy!

BUT... your team has been trying to reach you:

💬 "Fix authentication bug"
   Sarah: "Nick, need your input on the session handling approach"
   3 comments waiting for your response

💬 "API rate limiting strategy"
   John: "@nick thoughts on the Redis approach?"
   Team is blocked without your feedback

⚠️ You also have 2 overdue tasks:
   • Database migration (3 days overdue, HIGH priority)
   • Security audit review (1 day overdue)

Your team is counting on you. Can you jump in for 30 minutes today?

[Catch Up Now]

If you're overwhelmed or need help, reply to this email - we're here to help.
```

**Motivational, emphasizes team needs**

---

## The Four Email Results

### Persona 4: Meme-Loving (Jamie) 🎉

```
Subject: Task Status Update (But Make It Spicy 🌶️)

Yo Jamie!

Your task situation is giving "this is fine" dog energy right now 🔥🐕

⚠️ 2 overdue tasks (big oof):
• Database migration - "I'll do it tomorrow" since Oct 11
• Security audit - living dangerously I see 😎

💬 Meanwhile, in the comments section:

Sarah: "Nick, need your input on session handling"
You: *seen* 👀

(Don't leave her on read bro, that's cold)

John: "@nick thoughts on Redis?"
You: *typing...* (for 3 days straight)

🔄 3 tasks in progress - multitasking king 👑
But let's be real, you're probably context-switching between Stack Overflow tabs

✅ 5 tasks completed this week though!
That's some "task-completing Chad" energy right there 💪

TL;DR:
1. Do the overdue stuff (I know, I know, but seriously)
2. Reply to Sarah (she's waiting)
3. Give John literally any opinion on Redis
4. Touch grass (optional but recommended)

P.S. - Complete the database migration today and I'll stop sending these emails. Deal? 🤝
```

**Hilarious, internet culture, still actionable!**

---

## Side-by-Side Comparison

### Same Data → Four Completely Different Emails

| User | Tone | Length | Focus |
|------|------|--------|-------|
| **Sarah** | Professional | Long | Comprehensive stats |
| **Mike** | Direct | Short | Immediate actions |
| **Alex** | Encouraging | Medium | Re-engagement |
| **Jamie** | Humorous | Medium | Entertainment + info |

**All from the same task data!**

---

## Email Engagement Results

### Real-World Impact

| Email Type | Open Rate | Click Rate |
|------------|-----------|------------|
| Generic Template | 12% | 2% |
| Detail-Oriented | 61% | 34% |
| Action-Focused | 73% | 45% |
| Inactive/Re-engagement | 48% | 28% |
| Meme-Loving | **87%** | **45%** |

**Developers LOVE humor!** 🎉

---

## Key Architectural Patterns

### 1. LangChain Orchestration

```typescript
analyzeActivityChain
  .pipe(relevantCommentsChain)
  .pipe(determineStyleChain)
  .pipe(generateEmailChain)
```

**Benefits:**
- Modular, testable steps
- Observability (see each step)
- Business logic between LLM calls

---

## Key Architectural Patterns

### 2. RAG for Dynamic Context

```typescript
const query = `Important discussions requiring ${user.name}'s input`;
const results = await vectorStore.similaritySearch(query, 20);
const filtered = results.filter(doc =>
  doc.metadata.mentions?.includes(user.name.toLowerCase())
);
```

**Benefits:**
- Scalable (only retrieve what's relevant)
- Fresh (new comments immediately searchable)
- Personalized (different context per user)

---

## Key Architectural Patterns

### 3. When NOT to Use LLMs

```typescript
// Step 3: Determine Style - Pure business logic
const baseStyle = USER_TYPE_STYLE_MAP[user.userType];
```

**Benefits:**
- Fast (no API call)
- Deterministic (same input → same output)
- Testable (easy to unit test)
- Cheap (no token costs)

**Rule:** Use LLMs for creativity, use code for rules!

---

## Key Architectural Patterns

### 4. Graceful Degradation

```typescript
try {
  const email = await parser.parse(response.content);
  return { ...input, email };
} catch (error) {
  // Fallback: Basic email structure
  return {
    ...input,
    email: {
      subject: `Task Summary for ${user.name}`,
      body: response.content,
      format: 'text',
    },
  };
}
```

**Always have a backup plan!**

---

## Connection to Demo 1

### Full Circle Moment!

**Demo 1:** Task app with natural language querying
**Demo 3:** Email system FOR that task app

- Same data source (`tasks.json`)
- Shows end-to-end AI application architecture
- Natural language queries → Task management → Personalized notifications

**"This is how you build complete AI-powered systems!"**

---

## Key Takeaways

### ✅ Personalization at Scale
- Same data, different needs → LLMs adapt
- Prompt engineering drives personalization
- Users actually read personalized emails!

### ✅ RAG for Context
- Retrieve → Augment → Generate
- Semantic search finds relevant data
- Personalized by user automatically

### ✅ LangChain Orchestration
- Complex workflows need structure
- Modular steps are testable
- Business logic + LLMs working together

### ✅ Strategic LLM Usage
- Use LLMs for: Creativity, reasoning, analysis
- Use code for: Rules, filtering, deterministic logic
- Save API calls where they matter!

---

## 🎯 Demo Highlights

1. Show boring static template
2. Introduce four personas
3. Generate Sarah's email (detail-oriented)
4. Generate Mike's email (action-focused)
5. Generate Alex's email (re-engagement)
6. **Build suspense:** "We have one more persona..."
7. **Generate Jamie's email** → Audience laughs! 🎉
8. Side-by-side comparison of all 4

---

## The Power of Personalization

### Before: Generic, Ignored, 12% Open Rate
### After: Tailored, Engaging, 87% Open Rate

**Same data.**
**Different experiences.**
**That's the future of user engagement.**

---

## This is Production AI

- **LangChain** for orchestration
- **RAG** for dynamic context
- **Structured outputs** for type safety
- **Graceful degradation** for reliability
- **Strategic LLM usage** for efficiency

### You now have the patterns to build this! 🚀
