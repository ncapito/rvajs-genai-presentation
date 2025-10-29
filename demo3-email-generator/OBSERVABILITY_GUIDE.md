# Observability & Tracing Guide

## Current Implementation: Enhanced Console Logging

We've added **detailed console logging** to help you understand what's happening during email generation. This provides immediate visibility without requiring external services.

### What You'll See Now

When you generate an email, you'll see structured output like this:

```
[Step 1] Analyze Activity
  Model: gpt-4o
  Endpoint: https://your-resource.openai.azure.com/
  Temperature: 0.7
  Info: Analyzing 8 tasks
  Started: 2025-01-29T10:30:45.123Z
  ✅ Activity Analysis completed in 2.34s

[Step 2] RAG Retrieval
  Info: Using embeddings
  Started: 2025-01-29T10:30:47.456Z
  Retrieved 3 relevant comments
  ✅ RAG Retrieval completed in 0.89s

[Step 3] Determine Style
  Info: User type: meme-loving
  Started: 2025-01-29T10:30:48.345Z
  Selected style: humorous / casual
  ✅ Style Determination completed in 0.02s

[Step 4] Generate Email
  Model: gpt-4o
  Endpoint: https://your-resource.openai.azure.com/
  Temperature: 0.7
  Info: Persona: meme-loving
  Started: 2025-01-29T10:30:48.367Z
  Generated 3 meme spots for Jamie Taylor
  ✅ Email Generation completed in 4.56s

[Step 5] Convert to HTML
  Model: grok-code-fast-1
  Endpoint: https://your-resource.openai.azure.com/
  Temperature: 0.3
  Info: Body length: 2345 chars
  Started: 2025-01-29T10:30:52.927Z
  Converted to 5432 chars HTML
  ✅ HTML Conversion completed in 1.23s

[Step 6] Generate Memes
  Info: 3 images with DALL-E 3
  Started: 2025-01-29T10:30:54.157Z

[Meme 1/3] DALL-E 3
  Prompt: "A cartoon dog sitting calmly at a desk with papers on fire around him..."
  Timeout: 10s
  ✅ Meme 1 completed in 6.78s

[Meme 2/3] DALL-E 3
  Prompt: "A split image showing a person rejecting overtime work and approving..."
  Timeout: 10s
  ✅ Meme 2 completed in 5.92s

[Meme 3/3] DALL-E 3
  Prompt: "An excited developer celebrating with confetti and a trophy..."
  Timeout: 10s
  ✅ Meme 3 completed in 6.45s

  Results: 3 generated, 0 fallback
  ✅ Meme Generation completed in 19.15s

Total: ~28 seconds
```

### What This Tells You

1. **Which models are being used** for each step
2. **Which Azure endpoints** are being called
3. **How long each step takes** (helps identify bottlenecks)
4. **What's happening** at each stage (context for debugging)
5. **Success/failure status** for each operation

### Performance Insights

Based on the logging, you can see:
- **LLM calls** (Steps 1, 4, 5) take 2-5 seconds each
- **RAG retrieval** (Step 2) is fast (~1 second)
- **Meme generation** (Step 6) is the slowest (~6-7 seconds per image)
- **Total generation time** is typically 25-35 seconds

This helps you understand **why things might be slow** and where to optimize.

---

## Next Level: Azure AI Foundry + OpenTelemetry

For **production deployments**, you'll want full observability with trace visualization, metrics, and log aggregation. Azure AI Foundry supports this via OpenTelemetry.

### Why Add Full Observability?

**Current logging (console) is great for:**
- ✅ Local development
- ✅ Debugging single requests
- ✅ Understanding timing
- ✅ Quick feedback

**Azure Monitor OpenTelemetry adds:**
- ✅ Distributed tracing across services
- ✅ Visual trace timelines in Azure Portal
- ✅ Performance metrics and dashboards
- ✅ Alerting and anomaly detection
- ✅ Query and analyze across thousands of requests
- ✅ Correlation across multiple services
- ✅ Production-grade log aggregation

### Architecture: How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Application                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │ LangChain   │→ │ OpenTelemetry│→ │ Azure Monitor   │    │
│  │ Chains      │  │ SDK          │  │ Exporter        │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
│                           ↓                    ↓            │
│                    Auto-instrument      Connection String   │
└─────────────────────────────────────────────────────────────┘
                                                ↓
                                    ┌───────────────────────┐
                                    │ Application Insights   │
                                    │ - Traces               │
                                    │ - Metrics              │
                                    │ - Logs                 │
                                    └───────────────────────┘
                                                ↓
                                    ┌───────────────────────┐
                                    │ Azure Portal           │
                                    │ - Visual trace map     │
                                    │ - Performance graphs   │
                                    │ - Query interface      │
                                    └───────────────────────┘
```

---

## Implementation Guide

### Step 1: Prerequisites

1. **Create Application Insights resource** (if you don't have one):
   ```bash
   az monitor app-insights component create \
     --app my-app-insights \
     --location eastus \
     --resource-group my-resource-group
   ```

2. **Get the connection string**:
   ```bash
   az monitor app-insights component show \
     --app my-app-insights \
     --resource-group my-resource-group \
     --query connectionString -o tsv
   ```

3. **Add to `.env`**:
   ```env
   APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...;IngestionEndpoint=...
   ```

### Step 2: Install Packages

```bash
cd backend
npm install @azure/monitor-opentelemetry @azure/ai-projects
```

### Step 3: Update Your Application Entry Point

**Create `src/telemetry.ts`** (must be imported first!):

```typescript
/**
 * Telemetry configuration for Azure Monitor + OpenTelemetry
 * IMPORTANT: This must be imported before any other application code!
 */

import { useAzureMonitor, AzureMonitorOpenTelemetryOptions } from '@azure/monitor-opentelemetry';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Only enable telemetry if connection string is set
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  const options: AzureMonitorOpenTelemetryOptions = {
    azureMonitorExporterOptions: {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    },

    // Sampling: 1 = 100% (all requests), 0.5 = 50%, etc.
    samplingRatio: 1,

    // Enable live metrics streaming (real-time monitoring)
    enableLiveMetrics: true,

    // Enable standard metrics (request duration, dependencies, etc.)
    enableStandardMetrics: true,

    // Automatically instrument common libraries
    instrumentationOptions: {
      http: { enabled: true },      // Trace HTTP requests
      azureSdk: { enabled: true },  // Trace Azure SDK calls
    },
  };

  console.log('✅ Azure Monitor OpenTelemetry enabled');
  useAzureMonitor(options);
} else {
  console.log('ℹ️  Azure Monitor disabled (no connection string)');
}

// Export OpenTelemetry APIs for custom instrumentation
import { trace, metrics } from '@opentelemetry/api';

export const tracer = trace.getTracer('demo3-email-generator', '1.0.0');
export const meter = metrics.getMeter('demo3-email-generator', '1.0.0');
```

**Update `src/server.ts`** (import telemetry FIRST):

```typescript
// CRITICAL: Import telemetry configuration BEFORE anything else!
import './telemetry.js';

// Now import everything else
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateEmailRoute } from './routes/email.routes.js';
// ... rest of imports
```

### Step 4: Add Custom Spans (Optional)

For even richer tracing, add custom spans to your chains:

**Update `src/chains/email.chains.ts`**:

```typescript
import { tracer } from '../telemetry.js';

export const analyzeActivityChain = RunnableLambda.from(async (input) => {
  // Create a custom span for this operation
  return tracer.startActiveSpan('analyzeActivity', async (span) => {
    try {
      // Add custom attributes
      span.setAttribute('user.id', input.user.id);
      span.setAttribute('user.type', input.user.userType);
      span.setAttribute('task.count', input.taskActivity.assigned);

      logChainStep(1, 'Analyze Activity', azureLLM, `Analyzing ${taskActivity.assigned} tasks`);
      const timer = new StepTimer('Activity Analysis');

      const response = await azureLLM.invoke(messages);
      timer.end();

      // Mark span as successful
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return { ...input, activityAnalysis: response.content };
    } catch (error: any) {
      // Record error in span
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span.end();
      throw error;
    }
  });
});
```

### Step 5: Custom Metrics (Optional)

Track business metrics like email generation success rate:

**Update `src/routes/email.routes.ts`**:

```typescript
import { meter } from '../telemetry.js';

// Create counters
const emailGenerationCounter = meter.createCounter('email.generation.total', {
  description: 'Total number of email generation attempts',
});

const emailGenerationDuration = meter.createHistogram('email.generation.duration', {
  description: 'Time taken to generate emails',
  unit: 'ms',
});

export async function generateEmailRoute(req: Request, res: Response) {
  const startTime = Date.now();
  const userId = req.body.userId;

  try {
    const result = await fullEmailChain.invoke(input);

    const duration = Date.now() - startTime;

    // Record metrics
    emailGenerationCounter.add(1, {
      status: 'success',
      user_type: user.userType,
      has_memes: result.email.format === 'html' && user.preferences.includeMemes
    });

    emailGenerationDuration.record(duration, {
      user_type: user.userType
    });

    res.json(result);
  } catch (error: any) {
    const duration = Date.now() - startTime;

    emailGenerationCounter.add(1, {
      status: 'error',
      user_type: user?.userType || 'unknown'
    });

    emailGenerationDuration.record(duration, {
      user_type: user?.userType || 'unknown'
    });

    res.status(500).json({ error: error.message });
  }
}
```

---

## Viewing Traces in Azure Portal

Once deployed with telemetry enabled:

1. **Go to Azure Portal** → Your Application Insights resource

2. **View distributed traces**:
   - Go to "Transaction search" to see individual requests
   - Click any request to see the full trace timeline
   - See all chain steps, LLM calls, and dependencies

3. **Analyze performance**:
   - Go to "Performance" to see average durations
   - Identify slow dependencies (which LLM calls are slowest?)
   - See P50, P95, P99 percentiles

4. **Query with KQL** (Kusto Query Language):
   ```kusto
   // Find slow email generations
   traces
   | where operation_Name == "generateEmail"
   | where duration > 30000  // Over 30 seconds
   | summarize count() by user_type

   // See which personas take longest
   traces
   | where operation_Name == "generateEmail"
   | summarize avg(duration) by user_type
   | order by avg_duration desc

   // Track meme generation failures
   traces
   | where operation_Name contains "generateMemes"
   | where severityLevel >= 3  // Warning or Error
   | project timestamp, message, user_type
   ```

5. **Set up alerts**:
   - Create alerts for slow requests (e.g., >45 seconds)
   - Alert on high error rates
   - Monitor Azure OpenAI rate limit errors

---

## LangChain-Specific Tracing

### Option 1: LangSmith (LangChain's Observability Platform)

LangChain has its own tracing platform called **LangSmith**:

```bash
npm install langsmith
```

```typescript
// .env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_PROJECT=demo3-email-generator
```

**Pros:**
- Purpose-built for LangChain
- Beautiful chain visualization
- Playground to test prompts
- Dataset management for evals

**Cons:**
- Separate platform (not Azure)
- Additional service to manage
- Costs separate from Azure

### Option 2: Azure Monitor (Recommended for Azure-First Teams)

Use the approach described above with `@azure/monitor-opentelemetry`.

**Pros:**
- Integrated with Azure ecosystem
- Single pane of glass for all telemetry
- Works with existing Azure monitoring
- Cost-efficient (part of App Insights)

**Cons:**
- Not LangChain-specific UI
- Requires more manual span creation
- Less out-of-the-box chain visualization

### Option 3: Hybrid Approach

Use **both** for different purposes:
- **Development/debugging**: LangSmith for rich LangChain-specific insights
- **Production**: Azure Monitor for operational monitoring

---

## Debugging & Troubleshooting

### Enable OpenTelemetry Debug Logging

Add to `.env`:
```env
APPLICATIONINSIGHTS_INSTRUMENTATION_LOGGING_LEVEL=DEBUG
APPLICATIONINSIGHTS_LOG_DESTINATION=file+console
```

This will show what OpenTelemetry is capturing.

### Common Issues

**Issue: No traces appearing in Application Insights**

Solutions:
1. Check connection string is correct
2. Verify `src/telemetry.ts` is imported FIRST in `server.ts`
3. Wait 2-3 minutes (traces are batched)
4. Check console for OpenTelemetry errors

**Issue: Traces appear but no LangChain-specific details**

Solution: Add custom spans (see Step 4 above)

**Issue: Too much noise in traces**

Solution: Reduce sampling ratio:
```typescript
samplingRatio: 0.1  // Only trace 10% of requests
```

---

## Cost Considerations

### Current Setup (Console Logging)
- **Cost**: $0
- **Storage**: None (ephemeral logs)
- **Retention**: Until server restart

### Azure Monitor OpenTelemetry
- **Ingestion**: $2.30/GB (first 5GB free per month)
- **Retention**: 90 days included, then $0.12/GB/month
- **Typical usage**: ~100-500 MB/month for this demo (well within free tier)

### LangSmith
- Free tier: 5,000 traces/month
- Developer: $39/month (50K traces)
- Team: $299/month (500K traces)

---

## Recommendation

**For this demo/presentation:**
✅ **Keep the enhanced console logging** - it's perfect for local dev and demos

**For production:**
✅ **Add Azure Monitor OpenTelemetry** - gives you production-grade observability within Azure ecosystem

**For advanced LangChain development:**
✅ **Consider LangSmith** - best-in-class for iterating on chains and prompts

---

## Summary

You now have **two levels of observability**:

### Level 1: Enhanced Console Logging (✅ Implemented)
- Shows model, endpoint, timing for every step
- Perfect for development and debugging
- Zero cost, zero setup
- Immediate feedback

### Level 2: Azure Monitor OpenTelemetry (Optional)
- Production-grade distributed tracing
- Visual trace timelines in Azure Portal
- Custom metrics and alerts
- Query and analyze at scale
- ~15 minutes setup, free tier covers most demos

Choose based on your needs:
- **Demo/Learning**: Level 1 is perfect
- **Production**: Add Level 2
- **Advanced LangChain Dev**: Consider LangSmith

The enhanced logging you have now gives you **80% of the value** with **0% of the complexity** - a great starting point!
