# Infrastructure Setup Guide

This guide explains what cloud resources you need to run these demos and how to configure them.

## 🌐 Overview

These demos use a mix of AI services:
- **Azure AI Foundry** (formerly Azure OpenAI) - Access to GPT-4, embeddings, and various AI models
- **Anthropic API** (direct) - Claude Vision for Demo 2
- **Optional**: LangSmith for observability/tracing

## 🎯 Quick Decision Guide

### Already Have Azure?
→ Use **Azure AI Foundry** (provides access to OpenAI, Anthropic, and other models through one platform)

### Don't Have Azure?
→ Use **Direct APIs** (OpenAI + Anthropic separately)

### Want to Try Without Signing Up?
→ See the "Free Tier Options" section below

---

## 📋 Requirements by Demo

### Demo 1: Natural Language Task Querying

**Required Models:**
- GPT-4 (or GPT-4o, GPT-4o-mini)

**Azure Foundry Setup:**
```env
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

**Alternative (Direct OpenAI):**
```env
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4o
```

---

### Demo 2: Receipt Parsing with Vision

**Required Models:**
- Claude 3.5 Sonnet (vision capabilities)
- Text embeddings (optional, for extended features)

**Recommended Setup (Anthropic Direct):**
```env
ANTHROPIC_API_KEY=your_anthropic_key_here
PORT=3001
NODE_ENV=development
```

**Alternative (Azure Foundry with Claude):**
```env
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_API_VERSION=2024-08-01-preview
# Note: Not all Azure regions support Claude through Foundry
```

---

### Demo 3: Email Personalization with RAG

**Required Models:**
- GPT-4 (or alternative chat model)
- Text embeddings (for RAG)
- Image generation (optional, for meme feature)

**Azure Foundry Setup:**
```env
# Core LLM
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Embeddings (for RAG)
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-3-small

# Image Generation (optional)
IMAGE_PROVIDER=azurefoundry
IMAGE_ENDPOINT_URL=https://your-resource.openai.azure.com/
IMAGE_DEPLOYMENT_NAME=FLUX-1.1-pro
# Alternatives: dall-e-3 (requires different region)

# LangSmith (optional, for observability)
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_key
LANGCHAIN_PROJECT=demo3-email-generator
```

**Alternative Models:**
The code supports multiple models via Azure Foundry:
- `gpt-4.1-mini` - Newer mini model (April 2025), excellent cost/performance, 1M context window
- `gpt-4o` - Solid general-purpose model, well-tested
- `gpt-4o-mini` - Cheaper option for simple tasks
- `DeepSeek-R1-0528` - Alternative model (East US 2)
- `grok-3` - Alternative code-focused model

---

## 🔧 Azure AI Foundry Setup

### What is Azure AI Foundry?

Azure AI Foundry (formerly Azure OpenAI Service) provides access to:
- **OpenAI models** (GPT-4, GPT-4o, DALL-E 3)
- **Non-OpenAI models** (Claude, DeepSeek, Grok, Llama)
- **Image generators** (FLUX-1.1-pro, DALL-E 3)
- **Embeddings** (text-embedding-3-small/large)

### Step 1: Create Azure Account

1. Go to https://azure.microsoft.com/
2. Click "Start Free" or "Sign In"
3. Free tier includes $200 credit for 30 days

### Step 2: Create AI Foundry Resource

1. **Navigate to Azure Portal**: https://portal.azure.com
2. **Search for** "Azure AI Foundry" or "Azure OpenAI"
3. **Click** "Create"
4. **Configure**:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new (e.g., "genai-demos-rg")
   - **Region**: **East US 2** (recommended - supports most models)
   - **Name**: Your resource name (e.g., "genai-sandbox-resource")
   - **Pricing Tier**: Standard

### Step 3: Deploy Models

After resource is created:

1. **Go to Azure AI Studio**: https://oai.azure.com/
2. **Select your resource**
3. **Click "Deployments" → "Create new deployment"**

**Deploy these models:**

| Model | Deployment Name | Required For | Region | Notes |
|-------|----------------|--------------|---------|-------|
| `gpt-4.1-mini` | `gpt-4.1-mini` | Demos 1 & 3 | East US 2 | Recommended - best cost/performance |
| `gpt-4o` | `gpt-4o` | Demos 1 & 3 | East US 2 | Alternative, well-tested |
| `text-embedding-3-small` | `text-embedding-3-small` | Demo 3 | East US 2 | For RAG |
| `FLUX-1.1-pro` | `FLUX-1.1-pro` | Demo 3 (optional) | East US 2 | Meme generation |
| `dall-e-3` | `dall-e-3` | Demo 3 (alternative) | East US, Sweden Central | Alternative image gen |

**Note on DALL-E 3**: Not available in all regions. If using East US 2, use FLUX-1.1-pro instead.

### Step 4: Get API Credentials

1. **Go to your resource** in Azure Portal
2. **Click "Keys and Endpoint"**
3. **Copy**:
   - **Key 1** → `AZURE_OPENAI_API_KEY`
   - **Endpoint** → `AZURE_OPENAI_ENDPOINT`

### Step 5: Configure Environment

Create `.env` files in each demo's backend folder with your credentials.

---

## 🔑 Direct API Setup (Without Azure)

### Option 1: OpenAI Direct (Demos 1 & 3)

1. **Get API Key**: https://platform.openai.com/api-keys
2. **Modify code** to use OpenAI directly:

```typescript
// Instead of Azure OpenAI
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI({
  modelName: 'gpt-4o',
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7
});
```

3. **Update .env**:
```env
OPENAI_API_KEY=your_openai_key_here
```

### Option 2: Anthropic Direct (Demo 2)

Demo 2 already uses Anthropic directly! Just add:

```env
ANTHROPIC_API_KEY=your_anthropic_key_here
```

Get your key at: https://console.anthropic.com/

---

## 🎨 Image Generation Options (Demo 3)

Demo 3's meme generation feature is **optional** and supports multiple providers:

### Option 1: FLUX-1.1-pro (Recommended)

**Pros**: Better quality, faster, available in East US 2
**Setup**: Deploy through Azure Foundry

```env
IMAGE_PROVIDER=azurefoundry
IMAGE_ENDPOINT_URL=https://your-resource.openai.azure.com/
IMAGE_DEPLOYMENT_NAME=FLUX-1.1-pro
```

### Option 2: DALL-E 3

**Pros**: From OpenAI, well-tested
**Cons**: Not available in all regions (requires East US or Sweden Central)

```env
IMAGE_PROVIDER=azurefoundry
IMAGE_DEPLOYMENT_NAME=dall-e-3
```

### Option 3: Disable Image Generation

Set in `.env`:
```env
MEME_GENERATION_ENABLED=false
```

Emails will still generate but without images (text-only fallback).

---

## 📊 LangSmith Setup (Optional)

LangSmith provides observability for LangChain applications (tracing, debugging).

### Setup:

1. **Sign up**: https://smith.langchain.com/
2. **Get API key**: https://smith.langchain.com/settings
3. **Add to .env**:

```env
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_key_here
LANGCHAIN_PROJECT=demo3-email-generator
```

### Benefits:
- Trace chain execution steps
- Debug prompt/response pairs
- Monitor costs and latency
- Share traces with team

**Not required** - demos work fine without it!

---

## 🌍 Region Recommendations

| Region | Models Available | Notes |
|--------|-----------------|-------|
| **East US 2** | GPT-4o, FLUX-1.1-pro, embeddings, DeepSeek, Grok | **Recommended** - most complete |
| East US | GPT-4o, DALL-E 3, embeddings | Good for DALL-E 3 |
| Sweden Central | DALL-E 3, Claude (via Foundry) | Good EU option |
| West Europe | GPT-4o, embeddings | Limited image options |

**Tip**: Choose **East US 2** for maximum model availability.

---

## 💰 Cost Estimates

### Azure Foundry Pricing (Approximate)

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|---------------------|---------------------|
| GPT-4o | $0.0025 | $0.01 |
| GPT-4o-mini | $0.00015 | $0.0006 |
| text-embedding-3-small | $0.00002 | N/A |
| FLUX-1.1-pro | N/A | ~$0.04/image |
| DALL-E 3 | N/A | ~$0.04/image (1024x1024) |

### Anthropic Direct Pricing

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|---------------------|---------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |

### Demo Cost Estimates

**Demo 1**: ~$0.01 per query (GPT-4o)
**Demo 2**: ~$0.05 per receipt (Claude Vision)
**Demo 3**: ~$0.05-0.10 per email (with/without images)

**For learning/testing**: Expect $5-20 total across all demos.

---

## 🔄 Switching Between Providers

### Azure ↔ Direct API

The code is designed to be provider-agnostic. To switch:

**1. Update imports**:
```typescript
// Azure
import { AzureChatOpenAI } from '@langchain/openai';

// Direct
import { ChatOpenAI } from '@langchain/openai';
```

**2. Update initialization**:
```typescript
// Azure
const llm = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAIApiInstanceName: 'your-resource',
  azureOpenAIApiDeploymentName: 'gpt-4o',
  azureOpenAIApiVersion: '2024-08-01-preview'
});

// Direct
const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o'
});
```

**3. Update .env file** accordingly

---

## 🆓 Free Tier Options

### Azure Free Tier
- **$200 credit** for 30 days
- No credit card required for trial
- Upgrade to pay-as-you-go after trial

### OpenAI Free Tier
- **$5 credit** for new accounts
- Expires after 3 months
- Credit card required

### Anthropic
- **Pay-as-you-go** only
- ~$5 minimum usage to start
- Credit card required

### LangSmith
- **Free tier**: 5,000 traces/month
- No credit card required

---

## 🔒 Security Best Practices

### API Key Management

✅ **DO**:
- Use `.env` files (already gitignored)
- Rotate keys regularly
- Use separate keys for dev/prod
- Set budget alerts in Azure

❌ **DON'T**:
- Commit keys to git
- Share keys in issues/PRs
- Use production keys in demos
- Hardcode credentials

### Cost Control

1. **Set budget alerts** in Azure Portal
2. **Use rate limiting** in production
3. **Enable caching** for repeated queries
4. **Choose cheaper models** when possible (gpt-4o-mini)
5. **Disable optional features** (meme generation)

---

## 🛠️ Troubleshooting

### "Deployment not found"
- Verify deployment name matches `.env`
- Check model is deployed in Azure AI Studio
- Ensure API version is correct

### "Quota exceeded"
- Check Azure Portal for quota limits
- Request quota increase (can take 1-2 days)
- Try different region

### "Region not supported"
- Some models only in specific regions
- See "Region Recommendations" above
- Redeploy resource in supported region

### "Invalid API key"
- Regenerate key in Azure Portal
- Check for trailing spaces in `.env`
- Ensure using Key 1 or Key 2 (not connection string)

---

## 📞 Getting Help

### Azure Support
- **Documentation**: https://learn.microsoft.com/azure/ai-services/openai/
- **Forum**: https://learn.microsoft.com/answers/
- **Support tickets**: Available in Azure Portal

### Model-Specific Help
- **OpenAI**: https://platform.openai.com/docs
- **Anthropic**: https://docs.anthropic.com/
- **LangChain**: https://js.langchain.com/docs

### This Repository
- **Issues**: https://github.com/ncapito/rvajs-genai-presentation/issues
- **Discussions**: For questions and community help

---

## ✅ Setup Checklist

Before running demos, ensure:

**Demo 1:**
- [ ] Azure Foundry resource created
- [ ] GPT-4o deployed
- [ ] API key and endpoint in `.env`

**Demo 2:**
- [ ] Anthropic API key obtained
- [ ] API key in `.env`

**Demo 3:**
- [ ] GPT-4o deployed
- [ ] Text embeddings deployed
- [ ] (Optional) FLUX-1.1-pro or DALL-E 3 deployed
- [ ] (Optional) LangSmith account created
- [ ] All keys in `.env`

**All Demos:**
- [ ] `.env` files not committed to git
- [ ] Dependencies installed (`npm install`)
- [ ] Can start backend (`npm run dev`)
- [ ] Can start frontend (`npm start`)

---

## 🎓 Summary

**Simplest Setup**:
- Azure Foundry in East US 2 with GPT-4o, text-embedding-3-small, and FLUX-1.1-pro
- Anthropic direct API for Demo 2

**Cheapest Setup**:
- Direct OpenAI API with gpt-4o-mini
- Anthropic direct API
- Disable image generation

**Most Flexible Setup**:
- Azure Foundry (access to many models)
- Can swap between models in `.env`
- LangSmith for debugging

Choose what works for your budget and use case! All demos are designed to be flexible.

---

**Questions?** See [CONTRIBUTING.md](./CONTRIBUTING.md) or open an issue!
