# Multi-Deployment Setup Guide

## Overview

This demo supports using **different Azure OpenAI resources/deployments** for different tasks:
- **LLMs** (GPT-4o, Grok): Main resource for text generation
- **DALL-E 3**: Separate resource for image generation (common scenario)
- **Embeddings**: For RAG vector store

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LangChain Pipeline                    │
├─────────────────────────────────────────────────────────┤
│ Step 1-4: azureLLM         → Main Azure Resource        │
│ Step 5:   codeLLM          → Main Azure Resource        │
│ Step 6:   azureImageClient → Separate Image Resource!   │
└─────────────────────────────────────────────────────────┘
```

## Configuration in Code

Your `azure.config.ts` already has this set up correctly:

```typescript
// Main LLM client (GPT-4o, Grok)
export const azureLLM = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  // ...
});

// Image client (DALL-E 3) - SEPARATE resource
export const azureImageClient = new AzureOpenAI({
  apiKey: process.env.IMAGE_API_KEY || process.env.AZURE_OPENAI_API_KEY!,
  endpoint: process.env.IMAGE_ENDPOINT_URL || process.env.AZURE_OPENAI_ENDPOINT!,
  apiVersion: process.env.IMAGE_API_VERSION || process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview",
});
```

**Key Point**: `azureImageClient` falls back to main credentials if `IMAGE_*` vars aren't set.

## Environment Variables Setup

### Scenario 1: DALL-E in Different Azure Resource

In your `.env` file:

```env
# Main LLM Resource
AZURE_OPENAI_API_KEY=abc123...
AZURE_OPENAI_ENDPOINT=https://main-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-08-01-preview

# Image Resource (DIFFERENT from main)
IMAGE_API_KEY=xyz789...
IMAGE_ENDPOINT_URL=https://image-resource.openai.azure.com/
IMAGE_API_VERSION=2024-02-01
IMAGE_DEPLOYMENT_NAME=dall-e-3

# Other
CODE_DEPLOYMENT=grok-code-fast-1
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-ada-002
```

### Scenario 2: DALL-E in Same Resource

In your `.env` file:

```env
# Main Resource (has both LLM and DALL-E)
AZURE_OPENAI_API_KEY=abc123...
AZURE_OPENAI_ENDPOINT=https://main-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-08-01-preview

# Just specify the deployment name
IMAGE_DEPLOYMENT_NAME=dall-e-3

# Other (IMAGE_* vars will fall back to AZURE_OPENAI_*)
CODE_DEPLOYMENT=grok-code-fast-1
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-ada-002
```

## Verification Steps

### 1. Check Your Azure Resources

In Azure Portal or Azure AI Foundry:

**Option A: Separate Resources**
- Resource 1 (LLMs): Has GPT-4o, Grok, embeddings
- Resource 2 (Images): Has DALL-E 3

**Option B: Single Resource**
- Resource 1: Has everything (GPT-4o, Grok, DALL-E 3, embeddings)

### 2. Set Environment Variables

Based on your setup, configure `.env` (see scenarios above).

### 3. Test Each Component Separately

#### Test Main LLM (GPT-4o)
```bash
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}' | jq '.email.subject'
```

Should work if main credentials are correct.

#### Test Meme Spots Generation
```bash
# Ensure memeConfig.enabled = false first
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-004"}' | jq '.email.memeSpots'
```

Should return memeSpots array (doesn't call DALL-E yet).

#### Test DALL-E Image Generation
```bash
# Ensure memeConfig.enabled = true
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-004"}'
```

Watch console for:
```
Generating 3 memes for Jamie Taylor...
Generating meme 1: "..."
✅ Meme 1 generated successfully  ← Should see this
```

### 4. Debug Image Generation Errors

If you see errors like:
```
Failed to generate meme 1: DeploymentNotFound
```

**Check**:
1. `IMAGE_DEPLOYMENT_NAME` matches your actual DALL-E deployment name
2. `IMAGE_ENDPOINT_URL` is correct (note: different from LLM endpoint if separate)
3. `IMAGE_API_KEY` has access to the image resource
4. API version is compatible (try `2024-02-01` for DALL-E)

## Common Issues & Solutions

### Issue: "DeploymentNotFound" for DALL-E

**Cause**: Wrong deployment name or endpoint

**Solution**:
1. Check Azure Portal: What is your exact DALL-E deployment name?
2. Update `IMAGE_DEPLOYMENT_NAME` in `.env`
3. Verify endpoint URL (is DALL-E in a different resource?)

### Issue: "401 Unauthorized" for images only

**Cause**: API key doesn't have access to image resource

**Solution**:
1. If separate resource: Set correct `IMAGE_API_KEY`
2. Verify key has "Cognitive Services OpenAI User" role on image resource

### Issue: Memes timing out

**Cause**: DALL-E generation is slow (can take 10-15 seconds per image)

**Solution**:
1. Increase timeout: `generationTimeout: 20000` in `memeConfig`
2. Generate fewer memes (LLM will create 2-3 by default)
3. Use fallback (it's designed for this!)

### Issue: Console shows "Meme generation enabled" but no images

**Cause**: Silent failure in DALL-E generation

**Check**:
1. Backend logs for error messages
2. Try generating a single meme manually to test credentials
3. Verify API quotas (DALL-E has rate limits)

## Manual DALL-E Test

To test your DALL-E credentials directly:

```javascript
// test-dalle.js
import { AzureOpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const client = new AzureOpenAI({
  apiKey: process.env.IMAGE_API_KEY || process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.IMAGE_ENDPOINT_URL || process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: process.env.IMAGE_API_VERSION || '2024-02-01',
});

async function testDalle() {
  try {
    const result = await client.images.generate({
      model: process.env.IMAGE_DEPLOYMENT_NAME || 'dall-e-3',
      prompt: 'A simple test image of a blue cube',
      n: 1,
      size: '1024x1024',
    });
    console.log('✅ DALL-E works!', result.data[0]?.url);
  } catch (error) {
    console.error('❌ DALL-E failed:', error.message);
  }
}

testDalle();
```

Run:
```bash
node test-dalle.js
```

## Deployment Strategy for Demo

### Option 1: Skip Image Generation (Safest)
```typescript
// In azure.config.ts
export const memeConfig = {
  enabled: false,  // Keep disabled
  // ...
};
```
- Emails will have meme references and fallback text
- Fast (~7-8 seconds)
- No DALL-E credentials needed

### Option 2: Pre-Generate Images (Recommended)
1. Enable memes before demo
2. Generate Jamie's email
3. Take screenshots
4. Disable memes during demo
5. Show screenshots when discussing feature

### Option 3: Live Generate (High Risk)
- Only if you have DALL-E set up and tested
- Takes 15-20 seconds
- Can fail due to rate limits
- Always have backup screenshots!

## Environment Variable Checklist

Before demo, verify your `.env` has:

**Required for basic demo**:
- [x] `AZURE_OPENAI_API_KEY`
- [x] `AZURE_OPENAI_ENDPOINT`
- [x] `AZURE_OPENAI_DEPLOYMENT_NAME`
- [x] `CODE_DEPLOYMENT` (optional, falls back to main)
- [x] `AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT` (optional, RAG disabled if missing)

**Required for meme generation**:
- [x] `IMAGE_DEPLOYMENT_NAME` or `AZURE_OPENAI_DALLE_DEPLOYMENT`
- [ ] `IMAGE_API_KEY` (if separate resource)
- [ ] `IMAGE_ENDPOINT_URL` (if separate resource)
- [ ] `IMAGE_API_VERSION` (if different from main)

## Summary

Your setup **already supports** different deployments:
- ✅ `azureLLM` → Main resource for text
- ✅ `codeLLM` → Main resource (or separate CODE_DEPLOYMENT)
- ✅ `azureImageClient` → Separate IMAGE_* vars or falls back to main

The chains are properly isolated - they each use their own client. Just configure your `.env` correctly based on where your DALL-E deployment lives!

**For Demo**: Start with memes disabled, test that memeSpots are generated, then decide whether to enable actual image generation based on your setup.
