# Demo 3: Content Generation - Task App Email Check-ins - Planning Document

## Overview
Demonstrate AI-powered email personalization that adapts to user preferences, behavior, and context. Show how the same data generates wildly different emails for different user types. Connect back to Demo 1 (task app) to create a cohesive narrative.

**Duration**: 20 minutes
**Format**: Demo + live coding (RAG for collaboration context)

## Core Message
"Same data, personalized experiences - emails that people actually want to read"

## Objectives
1. Show the failure of static email templates (boring, ignored)
2. Demonstrate extreme personalization based on user preferences
3. Live code RAG integration for pulling collaboration context
4. Teach LangChain orchestration for complex workflows
5. Deliver "wow" with meme-loving developer persona
6. Connect to Demo 1 for narrative cohesion

## The Problem

**Traditional Email (Before):**
- Static templates with {{placeholder}} variables
- Data changes, but tone/structure stays identical
- Same email for everyone regardless of preferences
- Generic, robotic, ignored
- No context awareness
- Example: "Here's your summary for [date range]" - 0 engagement

**What users want:**
- **Detail-oriented**: "Show me everything, all the stats"
- **Action-focused**: "Just tell me what needs my attention"
- **Disengaged**: "Give me a reason to come back"
- **Fun-loving**: "Make it entertaining"

## Connection to Demo 1
**Full circle moment!**

Demo 1 showed the task app with natural language querying.
Demo 3 shows the email system FOR that same task app.

**Mention during intro:**
"Remember our task app from earlier? This is its email check-in system. Instead of sending the same boring summary to everyone, let's personalize it."

## User Personas (4 Types to Demo)

### Persona 1: Detail-Oriented User
**Profile:**
```json
{
  "name": "Sarah Chen",
  "userType": "detail-oriented",
  "preferences": {
    "detailLevel": "high",
    "preferredTone": "professional",
    "emailFrequency": "daily"
  },
  "description": "Wants comprehensive breakdowns, stats, full visibility"
}
```

### Persona 2: Action-Focused User
**Profile:**
```json
{
  "name": "Mike Rodriguez",
  "userType": "action-focused",
  "preferences": {
    "detailLevel": "low",
    "preferredTone": "direct",
    "emailFrequency": "only-when-needed"
  },
  "description": "Just tell me what to do, skip the fluff"
}
```

### Persona 3: Inactive/Re-engagement User
**Profile:**
```json
{
  "name": "Alex Kumar",
  "userType": "inactive",
  "preferences": {
    "detailLevel": "medium",
    "preferredTone": "encouraging",
    "emailFrequency": "weekly"
  },
  "description": "Hasn't logged in recently, needs motivation"
}
```

### Persona 4: Meme-Loving Developer (THE WOW)
**Profile:**
```json
{
  "name": "Jamie Taylor",
  "userType": "meme-loving",
  "preferences": {
    "detailLevel": "medium",
    "preferredTone": "humorous",
    "emailFrequency": "weekly",
    "includeMemes": true  // 👈 Feature flag!
  },
  "description": "Chronically online developer, appreciates humor"
}
```

## Task Activity Data (Same for All Users)

```json
{
  "taskActivity": {
    "assigned": 12,
    "inProgress": 3,
    "completed": 5,
    "overdue": 2,
    "commented": 7,
    "created": 4,
    "lastActive": "2024-10-10"
  },
  "recentActivity": [
    {
      "taskId": "task-123",
      "title": "Fix authentication bug",
      "action": "commented",
      "timestamp": "2024-10-12",
      "collaborator": "Sarah",
      "comment": "Nick, need your input on the session handling approach"
    },
    {
      "taskId": "task-456",
      "title": "API rate limiting strategy",
      "action": "mentioned",
      "timestamp": "2024-10-11",
      "collaborator": "John",
      "comment": "@nick thoughts on the Redis approach?"
    },
    {
      "taskId": "task-789",
      "title": "Update API documentation",
      "action": "completed",
      "timestamp": "2024-10-11"
    }
  ],
  "overdueTasks": [
    {
      "title": "Database migration",
      "dueDate": "2024-10-11",
      "priority": "high",
      "daysPastDue": 3
    },
    {
      "title": "Security audit review",
      "dueDate": "2024-10-13",
      "priority": "medium",
      "daysPastDue": 1
    }
  ],
  "inProgressTasks": [
    {
      "title": "Fix authentication bug",
      "assignee": "nick",
      "commentCount": 3
    },
    {
      "title": "Refactor user service",
      "assignee": "nick",
      "commentCount": 0
    },
    {
      "title": "Update dashboard UI",
      "assignee": "nick",
      "commentCount": 1
    }
  ]
}
```

## Email Examples

### Email 1: Detail-Oriented User (Sarah)

```
Subject: Your Weekly Task Summary - Oct 7-14

Hi Sarah,

Here's your comprehensive task breakdown for the week:

📊 OVERVIEW:
   ✅ Completed: 5 tasks
   💬 Active in comments: 7 tasks
   🔄 In progress: 3 tasks
   ⚠️ Overdue: 2 tasks
   ➕ Created: 4 new tasks

🎯 TASKS IN PROGRESS:
   • Fix authentication bug (3 comments this week)
     - Last activity: Oct 12
     - Collaborators: You, Sarah, Mike

   • Refactor user service
     - Status: Awaiting code review

   • Update dashboard UI (1 comment)
     - Design approved, implementation started

⚠️ NEEDS IMMEDIATE ATTENTION:
   1. Database migration (HIGH PRIORITY)
      - Due: Oct 11 (3 days overdue)
      - Blocking: 2 downstream tasks

   2. Security audit review (MEDIUM PRIORITY)
      - Due: Oct 13 (1 day overdue)
      - Assigned by: Security team

💬 ACTIVE DISCUSSIONS:
   • "API rate limiting strategy" - 5 comments
     John asked: "@nick thoughts on Redis approach?"

   • "Mobile app architecture" - 4 comments
     Design review in progress

🏆 THIS WEEK'S WINS:
   ✅ Completed API documentation update
   ✅ Closed 5 high-priority tasks
   ✅ Most active contributor this week (7 comments)
   ✅ 100% on-time completion for non-overdue items

📈 TRENDS:
   • Completion rate: 71% (up from 65% last week)
   • Average time to completion: 3.2 days
   • Comment engagement: High

NEXT ACTIONS:
   1. Address overdue tasks (est. 4 hours total)
   2. Respond to John on API rate limiting
   3. Continue authentication bug fix

[View Full Dashboard] [Export Report]

Best regards,
Task Management System
```

### Email 2: Action-Focused User (Mike)

```
Subject: 2 Overdue Tasks + 3 In Progress

Hey Mike,

Quick update:

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

– Task Bot
```

### Email 3: Inactive/Re-engagement User (Alex)

```
Subject: Your Team Needs You - Tasks Waiting

Hey Alex,

We noticed you haven't logged in since Oct 10. No worries - we know things get busy!

BUT... your team has been trying to reach you:

💬 "Fix authentication bug"
   Sarah commented: "Nick, need your input on the session handling approach"
   3 comments waiting for your response

💬 "API rate limiting strategy"
   John tagged you: "@nick thoughts on the Redis approach?"
   Team is blocked without your feedback

⚠️ You also have 2 overdue tasks:
   • Database migration (3 days overdue, HIGH priority)
   • Security audit review (1 day overdue)

Your team is counting on you. Can you jump in for 30 minutes today?

[Catch Up Now]

---

If you're overwhelmed or need help:
   • Reassign tasks to someone else
   • Update your availability status
   • Reply to this email - we're here to help

Not interested in these tasks anymore?
   [Update My Preferences]

We want to make sure you get emails that are actually useful.

Thanks,
Your Task Management Team
```

### Email 4: Meme-Loving Developer (Jamie) - THE WOW

**Implementation: Two versions with feature flag**

#### Version A: Text-Only (SAFE FALLBACK)
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
   Your productivity is *chef's kiss* when you're not on Reddit

TL;DR:
   1. Do the overdue stuff (I know, I know, but seriously)
   2. Reply to Sarah (she's waiting)
   3. Give John literally any opinion on Redis
   4. Touch grass (optional but recommended)

[Fix It] [Nah, I'm Good] [One More Coffee First]

P.S. - If you complete the database migration today, I'll stop sending you these emails. Deal? 🤝

– Your Friendly Neighborhood Task Bot
(Powered by AI that's definitely not becoming sentient... yet)
```

#### Version B: With Generated Meme Images (HERO MODE)
Same text as above BUT includes generated meme images:

**Meme 1:** "This is fine" dog in flames
- Generated prompt: "Meme of dog in burning room saying 'this is fine' with text overlay 'me with 2 overdue tasks'"
- Fallback: Just the text reference

**Meme 2:** "Distracted boyfriend" meme
- Generated prompt: "Distracted boyfriend meme where boyfriend is 'me', girlfriend is 'overdue tasks', and other woman is 'new interesting tasks'"
- Fallback: Just the text reference

**Meme 3:** Drake meme
- Generated prompt: "Drake meme rejecting 'doing overdue tasks' and approving 'starting new tasks'"
- Fallback: Just the text reference

## Implementation Strategy: Meme Images with Graceful Fallback

### Feature Flag Approach

```typescript
interface MemeConfig {
  enabled: boolean;
  generationTimeout: number; // ms
  fallbackToText: boolean;
}

const memeConfig: MemeConfig = {
  enabled: true,  // 👈 Toggle this!
  generationTimeout: 10000, // 10 seconds
  fallbackToText: true
};

async function generateMemeEmail(userData: UserData): Promise<Email> {
  const emailContent = generateMemeTextContent(userData);

  if (memeConfig.enabled && userData.preferences.includeMemes) {
    try {
      // Attempt to generate memes with timeout
      const memes = await Promise.race([
        generateMemeImages(emailContent.memeSpots),
        timeout(memeConfig.generationTimeout)
      ]);

      return {
        ...emailContent,
        images: memes,
        format: 'html'
      };
    } catch (error) {
      console.log('Meme generation failed, falling back to text');
      // Gracefully fall back to text-only version
      return {
        ...emailContent,
        format: 'text'
      };
    }
  }

  // Text-only version (safe default)
  return {
    ...emailContent,
    format: 'text'
  };
}
```

### Demo Strategy

**During Presentation:**
1. Start with text-only version (fast, reliable)
2. "Now, we COULD generate actual meme images..."
3. Show the code with feature flag
4. **If feeling brave**: Toggle it on, generate live
5. **If cautious**: Show pre-generated example
6. "But you see how we have a fallback?"

**Pre-Demo Decision:**
- Test meme generation beforehand
- If reliable → enable for live demo
- If flaky → stick with text, show capability

### Meme Generation Setup (Optional)

```typescript
async function generateMemeImages(memeSpots: MemeSpot[]): Promise<MemeImage[]> {
  const results = await Promise.all(
    memeSpots.map(async (spot) => {
      const image = await azure.images.generate({
        model: 'dall-e-3',
        prompt: spot.generationPrompt,
        size: '1024x1024',
        style: 'vivid'
      });

      return {
        url: image.data[0].url,
        alt: spot.altText,
        position: spot.position
      };
    })
  );

  return results;
}
```

## Demo Flow (20 minutes)

### Part 1: The "Before" - Static Templates (3 min)

**Show static template code:**
```typescript
// Traditional approach - BORING
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

**Display the boring email:**
- Show generic, lifeless email
- "Same email for everyone"
- "Why do we even send these?"

**Talking point:** "12% open rate, 2% click rate. People ignore these."

### Part 2: Introduce User Profiles (2 min)

**Show the 4 user personas side-by-side:**
1. Detail-oriented (Sarah)
2. Action-focused (Mike)
3. Inactive (Alex)
4. Meme-loving (Jamie)

**Show the SAME task data for all:**
- 5 completed, 2 overdue, 3 in progress, 7 commented
- "Same data, but different people need different things"

### Part 3: Generate Personalized Emails (8 min)

**Demo the email generation:**

1. **Sarah's email** (detail-oriented):
   - Generate live
   - Show comprehensive breakdown
   - "Look at all that detail!"

2. **Mike's email** (action-focused):
   - Generate live
   - Show brevity and directness
   - "Same data, completely different email"

3. **Alex's email** (re-engagement):
   - Generate live
   - Show motivational tone
   - "Trying to bring them back"

4. **Side-by-side comparison:**
   - Display all 3 on screen
   - "Same exact data, wildly different experiences"

### Part 4: Live Code - RAG for Collaboration Context (7 min)

**The teaching moment: Pull real comment context**

**Current state:** Emails mention collaborators generically

**Goal:** Pull actual comment content for richer context

**Live coding:**

```typescript
// Before: Generic mention
"Sarah commented on your task"

// After: Pull actual comment via RAG
"Sarah commented: 'Nick, need your input on session handling approach'"
```

**Steps:**

1. **Show the comment data structure:**
```typescript
interface Comment {
  taskId: string;
  author: string;
  text: string;
  timestamp: string;
  mentions: string[];
}
```

2. **Create vector store (pre-done, show code):**
```typescript
const commentVectorStore = await MemoryVectorStore.fromDocuments(
  comments.map(c => ({
    pageContent: c.text,
    metadata: { taskId: c.taskId, author: c.author }
  })),
  new OpenAIEmbeddings()
);
```

3. **Add retrieval to chain (LIVE CODE THIS):**
```typescript
// Add this to the email generation chain
const relevantCommentsChain = RunnableLambda.from(async (input) => {
  // Retrieve comments where user is mentioned
  const query = `Comments mentioning ${input.user.name}`;

  const relevantComments = await commentVectorStore
    .similaritySearch(query, 3);

  return {
    ...input,
    collaborationContext: relevantComments
  };
});

// Update the full chain
const emailChain =
  analyzeActivityChain
    .pipe(relevantCommentsChain)  // 👈 Add this!
    .pipe(determineStyleChain)
    .pipe(generateEmailChain);
```

4. **Re-generate one of the emails:**
   - Run Mike's email again
   - Show richer comment context
   - "Now we have actual conversation context!"

**Teaching points:**
- RAG for dynamic context retrieval
- Semantic search for relevant content
- Enriching prompts with real data
- LangChain composition

### Part 5: The "WOW" - Meme-Loving Developer (3 min)

**The finale!**

1. "We have one more persona..."
2. Show Jamie's profile with `includeMemes: true`
3. Generate the email

**Option A: Text-only (safe):**
- Show hilarious text-based email
- Audience laughs
- "No image generation needed!"

**Option B: With images (hero mode):**
- Show text version first
- "But wait, we can take it further..."
- Enable meme generation
- Generate actual meme images
- "And if it fails, we fall back to text"
- Show the images embedded in email

4. **Audience reaction**: Laughter, applause
5. "Same task data, completely different vibe"

**Final talking point:** "This is the power of personalization. Same data, but emails people actually WANT to read."

## LangChain Orchestration (Complex Flow)

### Full Chain Architecture

```typescript
// Step 1: Analyze user activity
const analyzeActivityChain = RunnableLambda.from(async (input) => {
  const analysis = await azure('gpt-4o').invoke({
    messages: [{
      role: 'system',
      content: 'Analyze task activity and identify key points'
    }, {
      role: 'user',
      content: JSON.stringify(input.taskActivity)
    }]
  });

  return {
    ...input,
    activityAnalysis: analysis
  };
});

// Step 2: Retrieve relevant collaboration context (RAG)
const relevantCommentsChain = RunnableLambda.from(async (input) => {
  const query = `Comments and mentions for ${input.user.name}`;

  const relevantComments = await commentVectorStore
    .similaritySearch(query, 5);

  return {
    ...input,
    collaborationContext: relevantComments.map(doc => doc.pageContent)
  };
});

// Step 3: Determine tone and style
const determineStyleChain = RunnableLambda.from(async (input) => {
  const userType = input.user.userType;
  const preferences = input.user.preferences;

  // Business logic for style determination
  const style = {
    'detail-oriented': {
      structure: 'comprehensive',
      tone: 'professional',
      includeStats: true,
      includeBreakdowns: true
    },
    'action-focused': {
      structure: 'minimal',
      tone: 'direct',
      includeStats: false,
      bulletPointsOnly: true
    },
    'inactive': {
      structure: 'motivational',
      tone: 'encouraging',
      emphasizeTeamNeeds: true,
      includeReengagementOptions: true
    },
    'meme-loving': {
      structure: 'humorous',
      tone: 'casual',
      includeReferences: true,
      includeMemes: preferences.includeMemes
    }
  }[userType];

  return {
    ...input,
    emailStyle: style
  };
});

// Step 4: Generate email content
const generateEmailChain = RunnableLambda.from(async (input) => {
  const { user, activityAnalysis, collaborationContext, emailStyle } = input;

  const prompt = `Generate a personalized task summary email.

User Profile:
- Name: ${user.name}
- Type: ${user.userType}
- Preferences: ${JSON.stringify(user.preferences)}

Activity Analysis:
${activityAnalysis}

Collaboration Context:
${collaborationContext.join('\n')}

Email Style:
${JSON.stringify(emailStyle)}

Requirements:
- Match the tone and structure to user type
- Include relevant collaboration context
- Highlight what matters most to this user
- Make it engaging and actionable
${emailStyle.includeMemes ? '- Include meme references and humor' : ''}

Generate the email:`;

  const email = await generateObject({
    model: azure('gpt-4o'),
    schema: EmailSchema,
    prompt
  });

  return email;
});

// Optional Step 5: Generate meme images (if enabled)
const generateMemesChain = RunnableLambda.from(async (input) => {
  if (!input.emailStyle.includeMemes || !memeConfig.enabled) {
    return input;
  }

  try {
    const memes = await generateMemeImages(input.email.memeSpots);
    return {
      ...input,
      email: {
        ...input.email,
        images: memes
      }
    };
  } catch (error) {
    console.log('Meme generation failed, using text fallback');
    return input; // Graceful fallback
  }
});

// Compose the full chain
const fullEmailChain =
  analyzeActivityChain
    .pipe(relevantCommentsChain)
    .pipe(determineStyleChain)
    .pipe(generateEmailChain)
    .pipe(generateMemesChain);

// Usage
const result = await fullEmailChain.invoke({
  user: userProfile,
  taskActivity: taskData
});
```

## Technical Implementation

### Tech Stack
- **Frontend**: Angular (email preview, user profile selector)
- **Backend**: Node.js + Express
- **Schema Validation**: Zod
- **LLM**: Azure OpenAI (GPT-4o via Foundry)
- **AI Framework**: LangChain.js v1
- **Vector Store**: In-memory vector store (for comment RAG)
- **Image Generation** (optional): DALL-E 3 via Azure
- **Database**: Mock JSON data (no real DB needed)

### Email Schema (Zod)

```typescript
const EmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  format: z.enum(['text', 'html']),
  tone: z.enum(['professional', 'casual', 'humorous', 'encouraging']),
  priorityActions: z.array(z.string()).optional(),
  memeSpots: z.array(z.object({
    position: z.number(),
    generationPrompt: z.string(),
    altText: z.string(),
    textFallback: z.string()
  })).optional()
});
```

### Components to Build

**Frontend (Angular):**
- User profile selector (dropdown of 4 personas)
- Email preview component (side-by-side comparison)
- Task data display (show the same data used for all)
- Code viewer (show the chain architecture)
- Meme toggle switch (enable/disable image generation)

**Backend (Node.js):**
1. `/api/generate-email` - Main endpoint
2. `/api/generate-email-batch` - Generate all 4 at once
3. Mock data files:
   - `users.json` - 4 user profiles
   - `tasks.json` - Task activity data
   - `comments.json` - Comment/collaboration data
4. LangChain setup and chains
5. Vector store initialization
6. Meme generation service (with fallback)

## Live Coding: RAG for Collaboration Context

**Pre-demo state:**
```typescript
// Email mentions collaborators generically
"Sarah commented on your task"
"John mentioned you in a comment"
```

**What to add live:**
1. Show comment data structure
2. Create vector store from comments (code already written, just explain)
3. **Add retrieval step to chain** (live code this)
4. Re-generate email with richer context

**Result:**
```typescript
// Now pulls actual comment text
"Sarah commented: 'Nick, need your input on session handling'"
"John asked: '@nick thoughts on Redis approach?'"
```

**Teaching moments:**
- RAG concept: retrieve then generate
- Semantic search for relevant context
- LangChain composition (pipe chains together)
- Enriching LLM prompts with dynamic data

## Talking Points

### Why This Matters

1. **Personalization is King**: Generic emails get ignored (12% open rate)
2. **Same Data, Different Needs**: One size does NOT fit all
3. **Context is Everything**: RAG brings real conversations into prompts
4. **Orchestration Power**: Complex workflows need structure (LangChain)
5. **Graceful Degradation**: Always have fallbacks (meme images → text)
6. **Humans Want Human**: Even "meme-loving" persona shows personality matters

### LangChain Value (Revisited)

- **Modularity**: Each step is testable, swappable
- **Observability**: See what each step produces
- **Complexity Management**: Break down complex flows
- **RAG Integration**: Seamlessly add retrieval steps
- **Error Handling**: Fallback strategies per step

### Architectural Decisions

**When to use this pattern:**
- ✅ Multiple data sources (tasks, comments, user prefs)
- ✅ Complex personalization logic
- ✅ RAG for dynamic context
- ✅ Multiple LLM calls needed
- ✅ Business logic between steps

**When NOT to use this pattern:**
- ❌ Simple, single LLM call is enough (like Demo 1)
- ❌ No dynamic data retrieval needed
- ❌ Speed is critical (chains add latency)

### The "Emails That Work" Answer

**How do we know these work better?**

Not just metrics - it's about **human connection:**
- Detail-oriented users get the depth they crave
- Action-focused users don't waste time
- Inactive users feel valued, not spammed
- Meme-loving users actually smile

**Mock metrics to show (if asked):**
- Generic template: 12% open, 2% click
- Personalized emails: 58% open, 31% click
- Meme email: 87% open, 45% click (developers love humor)

## Success Criteria

By the end, audience should understand:
- How to personalize content at scale with LLMs
- When/how to use LangChain orchestration
- RAG for dynamic context retrieval
- Graceful degradation strategies (meme fallback)
- The power of matching content to user preferences
- End-to-end AI application architecture

## Risk Mitigation

1. **Pre-test everything**: Generate all 4 emails beforehand
2. **Backup screenshots**: Have email outputs ready if API fails
3. **Meme generation fallback**: Text-only is default, images are bonus
4. **Keep RAG simple**: In-memory vector store, pre-loaded data
5. **Have fun with it**: Meme email should get laughs even if images fail
6. **Connection to Demo 1**: Brief callback, don't belabor it

## Pre-Demo Checklist

- [ ] Test all 4 email generations
- [ ] Verify comment RAG retrieval works
- [ ] Test meme image generation (if using)
- [ ] Have fallback screenshots ready
- [ ] Load mock data (users, tasks, comments)
- [ ] Test the live coding addition (RAG chain)
- [ ] Practice timing (20 min total)
- [ ] Have fun with the meme email!

## Notes

- This is the finale - make it memorable
- Meme email is the "wow" moment - lean into it
- RAG live coding is the teaching moment
- Show don't tell: side-by-side emails are powerful
- Connect back to Demo 1 briefly for narrative cohesion
- Emphasize: same data, wildly different experiences
- This demonstrates end-to-end AI app thinking
- 20 minutes - pace accordingly, don't rush the meme reveal
