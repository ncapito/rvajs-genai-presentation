# LangSmith Selective Tracing Setup

## Overview

**LangSmith** is LangChain's official observability platform that provides:
- Visual trace timelines showing all chain steps
- Detailed logs of LLM inputs/outputs
- Performance metrics and analytics
- Playground for testing prompts
- Dataset management for evaluations

This guide shows you how to **selectively trace** specific email generation requests, giving you deep visibility when you need it without tracing everything.

---

## Why Selective Tracing?

**Problem**: Tracing every single request generates lots of data and costs money.

**Solution**: Trace selectively - only when debugging or analyzing specific scenarios.

### Use Cases for Selective Tracing:

1. **Debugging failures** - "Why did Jamie's meme generation fail?"
2. **Performance analysis** - "Why does the meme-loving persona take 60 seconds?"
3. **Quality testing** - "Is the LLM following the prompt correctly?"
4. **Demo/presentation** - Show stakeholders the full chain visualization
5. **A/B testing** - Trace 10% of production requests for monitoring

---

## Setup (5 minutes)

### Step 1: Get LangSmith API Key

1. Go to **https://smith.langchain.com/** (free account)
2. Sign in / Create account
3. Go to **Settings** → **API Keys**
4. Create new API key
5. Copy the key

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
# LangSmith Tracing Configuration
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_your_api_key_here
LANGCHAIN_PROJECT=demo3-email-generator
```

**Configuration Explained**:
- `LANGCHAIN_TRACING_V2=true` - Enables LangSmith tracing
- `LANGCHAIN_API_KEY` - Your API key
- `LANGCHAIN_PROJECT` - Project name in LangSmith (organizes traces)

### Step 3: Install Package

```bash
cd backend
npm install langsmith
```

### Step 4: Restart Server

```bash
npm run dev
```

You should see:
```
✅ LangSmith tracing enabled
   Project: demo3-email-generator
```

---

## Usage: Selective Tracing

### Method 1: Per-Request Tracing (Recommended)

**Enable tracing for ONE specific request** by adding `?trace=true` query parameter:

```bash
# WITHOUT tracing (fast, no logging to LangSmith)
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-004"}'

# WITH tracing (logs to LangSmith)
curl -X POST "http://localhost:3003/api/generate-email?trace=true" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-004"}'
```

**Console Output**:
```
Generating email for Jamie Taylor (meme-loving)...
🔍 LangSmith tracing enabled for this request

[Step 1] Analyze Activity
  Model: gpt-4o
  ...
```

**In LangSmith Portal**:
- Go to **https://smith.langchain.com/projects**
- Click **demo3-email-generator** project
- See your trace with full timeline visualization!

### Method 2: Frontend Integration

Update your Angular frontend to add a "Trace" checkbox:

**`frontend/src/app/email.service.ts`**:

```typescript
generateEmail(userId: string, enableTracing: boolean = false): Observable<any> {
  const url = `${this.apiUrl}/generate-email${enableTracing ? '?trace=true' : ''}`;
  return this.http.post(url, { userId });
}
```

**`frontend/src/app/app.component.html`**:

```html
<label>
  <input type="checkbox" [(ngModel)]="enableTracing" />
  Enable LangSmith Tracing
</label>
```

Now users can toggle tracing on/off in the UI!

### Method 3: Always Trace Specific Personas

Automatically trace only specific user types:

**`backend/src/routes/email.routes.ts`**:

```typescript
// Auto-trace meme-loving persona for debugging
const enableTracing = req.query.trace === 'true' || user.userType === 'meme-loving';
```

---

## What Gets Traced?

When you enable tracing, LangSmith captures:

### 1. **Parent Trace: Email Generation Pipeline**
- Overall duration
- Input data (user, task activity)
- Output (email content)
- Success/failure status

### 2. **Child Spans: Each Chain Step**

**Step 1: Analyze Activity**
- LLM: `gpt-4o`
- Input: Task activity summary
- Output: Activity analysis
- Duration: ~2-4 seconds

**Step 2: RAG Retrieval**
- Embeddings model: `text-embedding-ada-002`
- Query: "Comments for {user}"
- Retrieved: 3 relevant documents
- Duration: ~0.5-1 second

**Step 3: Determine Style**
- Logic: User type → Email style
- No LLM call (pure business logic)
- Duration: <0.1 seconds

**Step 4: Generate Email**
- LLM: `gpt-4o`
- Input: Activity analysis + style + RAG context
- Output: Structured email with memeSpots
- Duration: ~3-5 seconds

**Step 5: Convert to HTML**
- LLM: `grok-code-fast-1` (or fallback to `gpt-4o`)
- Input: Markdown email
- Output: HTML with inline styles
- Duration: ~1-2 seconds

**Step 6: Generate Memes** (if applicable)
- For each meme (3x):
  - Provider: `DALL-E 3`
  - Input: Generation prompt
  - Output: Image URL or fallback
  - Duration: ~6-15 seconds per image

### 3. **Metadata & Tags**

Every trace includes:
- `userId`: `user-004`
- `userType`: `meme-loving`
- `includeMemes`: `true`
- `timestamp`: `2025-01-29T...`
- Tags: `email-generation`, `user-type:meme-loving`, `with-memes`

This makes it easy to filter traces in LangSmith!

---

## Viewing Traces in LangSmith

### Step 1: Go to Your Project

1. **https://smith.langchain.com/projects**
2. Click **demo3-email-generator**

### Step 2: Find Your Trace

Use filters:
- **Tags**: `user-type:meme-loving`
- **Metadata**: `includeMemes=true`
- **Date range**: Last hour

### Step 3: Analyze the Trace

Click on a trace to see:

#### Timeline View
```
generate_personalized_email (28.3s)
├─ Analyze Activity (2.4s)
│  └─ AzureChatOpenAI.invoke (2.4s)
├─ RAG Retrieval (0.9s)
│  └─ MemoryVectorStore.similaritySearch (0.9s)
├─ Determine Style (0.02s)
├─ Generate Email (4.5s)
│  └─ AzureChatOpenAI.invoke (4.5s)
├─ Convert to HTML (1.2s)
│  └─ AzureChatOpenAI.invoke (1.2s)
└─ Generate Memes (19.3s)
   ├─ DALL-E 3 (6.8s)
   ├─ DALL-E 3 (5.9s)
   └─ DALL-E 3 (6.5s)
```

#### Inputs/Outputs

See the **actual prompts** sent to the LLM and the responses!

Example:
```
System: You are an expert email writer...
User: Generate a personalized task summary for Jamie Taylor...
Assistant: {...structured email JSON...}
```

#### Metadata

- Model used: `gpt-4o`
- Temperature: `0.7`
- Token usage: 1,234 prompt + 567 completion
- Cost: ~$0.03

---

## Troubleshooting

### Issue 1: "LangSmith tracing disabled"

**Cause**: Missing or incorrect environment variables

**Fix**:
```bash
# Check your .env file
cat backend/.env | grep LANGCHAIN

# Should see:
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=lsv2_pt_...
# LANGCHAIN_PROJECT=demo3-email-generator
```

If missing, add them and restart server.

### Issue 2: No traces appearing in LangSmith

**Possible Causes**:
1. API key is invalid
2. You didn't add `?trace=true` to request
3. Project name doesn't match

**Debug**:
```bash
# Make a traced request
curl -X POST "http://localhost:3003/api/generate-email?trace=true" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}'

# Check console output - should see:
# 🔍 LangSmith tracing enabled for this request
```

If you see this but still no traces:
- Verify API key in LangSmith settings
- Check project name matches
- Wait 30 seconds (traces are batched)

### Issue 3: Traces appear but incomplete

**Cause**: Chains fail before completing, or LangChain version mismatch

**Fix**:
- Check server console for errors
- Ensure `langsmith` package version: `npm install langsmith@latest`
- Restart server after package updates

---

## Cost Considerations

### LangSmith Pricing (as of 2025)

**Free Tier**:
- 5,000 traces/month
- 14 days retention
- Perfect for development!

**Developer Tier** ($39/month):
- 50,000 traces/month
- 90 days retention
- Collaboration features

**Team Tier** ($299/month):
- 500,000 traces/month
- Unlimited retention
- Advanced analytics

### Typical Usage (Demo 3):

- **Development** (tracing everything): ~100-200 traces/day
- **Selective tracing** (10% of requests): ~10-20 traces/day
- **On-demand debugging**: ~5-10 traces/day

**Recommendation**: Use selective tracing (`?trace=true`) to stay within free tier!

---

## Advanced: Programmatic Control

### Trace Specific Operations Only

Want to trace ONLY Step 4 (email generation)?

**`backend/src/chains/email.chains.ts`**:

```typescript
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import { Client } from 'langsmith';

// In generateEmailChain
if (process.env.TRACE_EMAIL_GENERATION === 'true') {
  const client = new Client({ apiKey: process.env.LANGCHAIN_API_KEY });
  const tracer = new LangChainTracer({ client, projectName: 'email-generation-only' });

  const response = await azureLLM.invoke(messages, {
    callbacks: [tracer],
    tags: ['email-generation'],
  });
}
```

### Dynamic Project Names

Route traces to different projects based on environment:

```typescript
const projectName = process.env.NODE_ENV === 'production'
  ? 'demo3-production'
  : 'demo3-development';

const tracingConfig = getEmailGenerationTracingConfig(userId, userType, {
  projectName,
});
```

---

## Best Practices

### ✅ DO:

1. **Use selective tracing** (`?trace=true`) instead of tracing everything
2. **Add descriptive tags** to traces (user type, features used, etc.)
3. **Include metadata** (userId, timestamp, environment)
4. **Name your runs** meaningfully (`generate_email_meme_loving`)
5. **Use different projects** for dev vs production
6. **Review traces regularly** to identify bottlenecks

### ❌ DON'T:

1. **Don't trace production traffic** by default (expensive!)
2. **Don't include PII** in trace metadata (use IDs instead of names)
3. **Don't forget to tag** traces (makes filtering hard)
4. **Don't ignore failed traces** (goldmine for debugging)
5. **Don't trace without a purpose** (adds noise)

---

## Comparison: Console Logs vs LangSmith

### Console Logging (Current)

**Pros**:
- ✅ Instant feedback
- ✅ Zero cost
- ✅ No external dependencies
- ✅ Great for local development

**Cons**:
- ❌ No persistence (lost on restart)
- ❌ Hard to analyze patterns
- ❌ No visual timeline
- ❌ Can't share with team

### LangSmith Tracing

**Pros**:
- ✅ Visual timeline with hierarchy
- ✅ Persistent traces (14-90+ days)
- ✅ Searchable and filterable
- ✅ Shareable links to teammates
- ✅ Token usage and cost tracking
- ✅ Performance analytics

**Cons**:
- ❌ Requires API key setup
- ❌ Costs money (after free tier)
- ❌ Slight latency overhead
- ❌ External dependency

### Recommendation:

**For development**: Use both!
- Console logs for immediate feedback
- LangSmith for deep debugging and analysis

**For production**: Selective tracing only
- Console logs for all requests
- LangSmith for 1-10% of requests (sampling)
- LangSmith for all errors/failures

---

## Example Workflow

### Scenario: Debugging Slow Meme Generation

**Step 1**: Generate email with tracing enabled

```bash
curl -X POST "http://localhost:3003/api/generate-email?trace=true" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-004"}'
```

**Step 2**: Note the slow generation time in console
```
Email generated in 65432ms for Jamie Taylor
```

**Step 3**: Open LangSmith trace

Go to LangSmith → Find the trace → See timeline:
```
Generate Memes: 58.2s (❌ SLOW!)
├─ Meme 1: 22.1s (timeout + retry?)
├─ Meme 2: 18.5s
└─ Meme 3: 17.6s
```

**Step 4**: Identify the issue

Click on "Meme 1" span → See error:
```
Timeout after 30s
Retry attempt 1...
Success after 22.1s
```

**Step 5**: Fix the issue

Increase timeout in `azure.config.ts`:
```typescript
generationTimeout: 45000, // Increased from 30s to 45s
```

**Step 6**: Verify fix with another traced request

```bash
curl -X POST "http://localhost:3003/api/generate-email?trace=true" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-004"}'
```

Check new trace → Meme generation now ~30s (no timeouts!)

---

## Summary

You now have **selective LangSmith tracing** integrated into your app!

### Quick Reference:

**Enable tracing for one request**:
```bash
curl -X POST "http://localhost:3003/api/generate-email?trace=true" ...
```

**View traces**:
https://smith.langchain.com/projects

**Configuration** (`.env`):
```env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_pt_...
LANGCHAIN_PROJECT=demo3-email-generator
```

**Best practice**: Trace selectively (10% of requests or on-demand) to stay within free tier and reduce noise!

---

## Next Steps

1. **Set up LangSmith account** (5 minutes)
2. **Add API key to `.env`** (1 minute)
3. **Generate a traced email** with `?trace=true`
4. **Explore the trace** in LangSmith portal
5. **Use traces to optimize** slow operations

Happy tracing! 🔍
