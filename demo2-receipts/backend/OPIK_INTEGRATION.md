# Opik Integration Guide

## Overview

This project integrates Opik for LLM observability with two different approaches:

1. **LangChain Approach** (chain service) - Uses `OpikCallbackHandler` for automatic tracing
2. **Direct SDK Approach** (vision service) - Uses manual `withOpikTrace()` wrapper

## Setup

### 1. Install Dependencies

```bash
npm install opik opik-langchain
```

### 2. Configure Environment

```bash
# Local Opik (recommended for development)
OPIK_ENABLED=true
OPIK_URL_OVERRIDE=http://localhost:5173/api
OPIK_PROJECT_NAME=demo2-receipts

# Cloud Opik (alternative)
# OPIK_API_KEY=your-api-key
# OPIK_WORKSPACE=your-workspace
# OPIK_PROJECT_NAME=demo2-receipts
```

## How It Works

### LangChain Integration (Automatic)

The `OpikCallbackHandler` is set as a **global callback** for all LangChain operations:

```typescript
// config/opik.config.ts
import { OpikCallbackHandler } from 'opik-langchain';
import { setGlobalCallbacks } from '@langchain/core/callbacks/manager';

const opikHandler = new OpikCallbackHandler({
  projectName: 'demo2-receipts',
  tags: ['demo2-receipts', 'receipt-parsing'],
  metadata: { demo: 'demo2-receipts' },
  baseUrl: process.env.OPIK_URL_OVERRIDE // For local Opik
});

// This makes ALL LangChain operations automatically traced!
setGlobalCallbacks([opikHandler]);
```

**Chain Service** (services/chain.service.ts):
```typescript
// No manual wrapping needed!
// The global callback handler automatically traces:
// - Each ChatAnthropic.invoke() call
// - Each RunnableLambda step
// - Token usage, latency, prompts, responses

async parseReceipt(imagePath: string): Promise<ReceiptParseResult> {
  const chain = this.buildChain();
  const result = await chain.invoke({ imagePath }); // ✅ Auto-traced!
  return result;
}
```

### Direct SDK Integration (Manual)

For non-LangChain code (like direct Anthropic SDK calls), use manual tracing:

**Vision Service** (services/vision.service.ts):
```typescript
import { withOpikTrace } from '../config/opik.config';

async parseReceipt(imagePath: string): Promise<ReceiptParseResult> {
  return withOpikTrace(
    'simple-vision-parse',
    async () => {
      // Your Anthropic SDK call here
      const response = await this.client.messages.create({...});
      return parsedResult;
    },
    { approach: 'simple', service: 'vision' }
  );
}
```

## What Gets Traced

### LangChain Approach (Chain Service)
- ✅ **Each chain step** (extraction → parsing → enrichment)
- ✅ **Full prompts** sent to Claude
- ✅ **Complete responses** from Claude
- ✅ **Token usage** per step
- ✅ **Latency** per step
- ✅ **Chain composition** (pipeline visualization)

### Direct SDK Approach (Vision Service)
- ✅ **Function execution** (start/end)
- ✅ **Success/failure** status
- ✅ **Metadata** (approach, service type)
- ⚠️ No automatic prompt/response capture (would need manual logging)

## Viewing Traces

### Local Opik
```bash
# Start local Opik (in separate terminal)
docker run -p 5173:5173 comet-opik/opik

# Access UI
open http://localhost:5173
```

### Cloud Opik
Visit: https://www.comet.com/

## Best Practices

### 1. Always Flush Before Shutdown
```typescript
import { flushOpikTraces } from './config/opik.config';

process.on('SIGTERM', async () => {
  await flushOpikTraces();
  process.exit(0);
});
```

### 2. Use Tags and Metadata
```typescript
const opikHandler = new OpikCallbackHandler({
  projectName: 'demo2-receipts',
  tags: ['production', 'receipt-parsing', 'v1.0'],
  metadata: {
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    approach: 'chain'
  }
});
```

### 3. Conditional Enabling
The integration is **conditional** - app works normally without Opik:
- If `OPIK_ENABLED=false` → No tracing, no performance impact
- If no URL/API key → No tracing, no errors
- If Opik fails → Graceful fallback, app continues

## Architecture Comparison

### ❌ Wrong (Old Approach)
```typescript
// Manually wrapping LangChain calls
async parseReceipt(imagePath: string) {
  return withOpikTrace('chain-parse', async () => {
    const chain = this.buildChain();
    return chain.invoke({ imagePath });
  });
}
// Result: Only sees outer trace, misses internal LangChain steps!
```

### ✅ Correct (Current Approach)
```typescript
// Let global callback handle it
async parseReceipt(imagePath: string) {
  const chain = this.buildChain();
  return chain.invoke({ imagePath });
}
// Result: Full visibility into each step, automatic token counting!
```

## Troubleshooting

### "Workspace not found"
**Problem**: Local Opik doesn't use workspaces
**Solution**: Don't set `OPIK_WORKSPACE` for local mode

### "Missing required key 'name'"
**Problem**: Using wrong Opik API
**Solution**: Use `OpikCallbackHandler` for LangChain, not manual `opikClient.trace()`

### No traces appearing
**Problem**: Traces not flushed
**Solution**: Call `await opikHandler.flushAsync()` before app exits

### Circular JSON error
**Problem**: Trying to serialize trace objects
**Solution**: Don't return trace objects, only return your actual result

## References

- [Opik LangChain.js Docs](https://www.comet.com/docs/opik/integrations/langchainjs)
- [Opik Python Docs](https://www.comet.com/docs/opik/)
- [LangChain Callbacks](https://js.langchain.com/docs/concepts/callbacks)
