# Image Provider Abstraction

## Overview

The meme generation feature now uses a **provider abstraction** that allows you to easily switch between different image generation services without changing the chain logic.

## Supported Providers

### 1. DALL-E (Default) ✅ Fully Implemented
Azure OpenAI DALL-E 3 - production-ready

```env
IMAGE_PROVIDER=dalle
IMAGE_DEPLOYMENT_NAME=dall-e-3
IMAGE_API_KEY=your_key
IMAGE_ENDPOINT_URL=https://your-resource.openai.azure.com/
```

### 2. Stability AI 🚧 Template Ready
Stability AI's Stable Diffusion - needs API implementation

```env
IMAGE_PROVIDER=stability
STABILITY_API_KEY=your_key_here
```

### 3. Claude-Style Prompting 🚧 Template Ready
Use Claude to enhance prompts, then pass to another service

```env
IMAGE_PROVIDER=claude-style
CLAUDE_API_KEY=your_key_here
```

### 4. Text Fallback Only ✅ Fully Implemented
Disables image generation, uses text fallbacks only

```env
IMAGE_PROVIDER=fallback
```

## How to Switch Providers

### Option 1: Use DALL-E (Current Setup)

In `.env`:
```env
IMAGE_PROVIDER=dalle  # or omit, it's the default
IMAGE_DEPLOYMENT_NAME=dall-e-3
# ... other IMAGE_* vars
```

### Option 2: Disable Images (Fast Demo)

In `.env`:
```env
IMAGE_PROVIDER=fallback
```

This will:
- ✅ Still generate memeSpots
- ✅ Show text fallbacks in emails
- ✅ Skip all API calls to image services
- ⚡ Fast (~7-8 seconds instead of 15-20)

### Option 3: Add Your Own Provider

1. **Create provider class** in `backend/src/services/image-providers.ts`:

```typescript
export class MyCustomProvider implements ImageGenerationProvider {
  name = 'My Custom Service';

  async generateImage(prompt: string, timeout: number): Promise<string | null> {
    try {
      // Your API call here
      const response = await fetch('https://api.myservice.com/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, timeout }),
      });

      const data = await response.json();
      return data.imageUrl || null;
    } catch (error: any) {
      console.warn(`My service failed: ${error.message}`);
      return null; // Graceful fallback
    }
  }
}
```

2. **Add to factory** in same file:

```typescript
export function getImageProvider(): ImageGenerationProvider {
  const providerName = process.env.IMAGE_PROVIDER || 'dalle';

  switch (providerName.toLowerCase()) {
    case 'dalle':
      return new DalleProvider();

    case 'mycustom':
      return new MyCustomProvider();  // Add your provider

    case 'fallback':
      return new FallbackProvider();

    default:
      return new DalleProvider();
  }
}
```

3. **Configure in `.env`**:

```env
IMAGE_PROVIDER=mycustom
MY_API_KEY=your_key_here
```

4. **Restart backend** and it will use your provider!

## Architecture Benefits

### Before (Tightly Coupled)
```typescript
// meme.chains.ts directly called azureImageClient
const result = await azureImageClient.images.generate({ ... });
```

**Problem**: Hard to switch providers, test, or add alternatives.

### After (Abstraction Layer)
```typescript
// meme.chains.ts uses provider interface
const imageUrl = await imageProvider.generateImage(prompt, timeout);
```

**Benefits**:
- ✅ Easy to switch providers (change one env var)
- ✅ Easy to test (mock the provider)
- ✅ Easy to add new services
- ✅ Graceful fallback built-in
- ✅ Consistent error handling

## Console Output

When generating memes, you'll see the provider name:

```
Generating meme 1 with DALL-E 3: "A cartoon dog sitting calmly..."
✅ Meme 1 generated successfully

Generating meme 2 with DALL-E 3: "A split image showing..."
✅ Meme 2 generated successfully
```

Or with fallback:

```
Generating meme 1 with Text Fallback Only: "A cartoon dog..."
Using text fallback (no image generation)
Failed to generate meme 1: No image URL returned
```

## Demo Strategies

### Strategy 1: DALL-E (Full Experience)
**Best for**: Technical audience, adequate time

```env
IMAGE_PROVIDER=dalle
# ... configure DALL-E credentials
```

- ✅ Real images in emails
- ❌ Slow (15-20 seconds)
- ❌ Can fail (safety filters, rate limits)
- ✅ Big WOW factor

### Strategy 2: Fallback Only (Safe & Fast)
**Best for**: Time-constrained, unreliable connection

```env
IMAGE_PROVIDER=fallback
```

- ✅ Fast (~7-8 seconds)
- ✅ Never fails
- ✅ Shows humor via text
- ❌ No actual images

### Strategy 3: Mixed (Recommended)
**Best for**: Flexibility

1. Pre-generate with DALL-E (take screenshots)
2. During demo, use fallback (fast, reliable)
3. Show screenshots when discussing feature
4. Optionally attempt live generation if time allows

```env
# For live demo:
IMAGE_PROVIDER=fallback

# For pre-generation:
IMAGE_PROVIDER=dalle
```

## Testing

### Test Current Provider

```bash
# Check which provider is active
curl http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-004"}'

# Watch console for:
# "Generating meme 1 with [Provider Name]: ..."
```

### Test Provider Switching

```bash
# 1. Set provider in .env
IMAGE_PROVIDER=fallback

# 2. Restart backend
npm run dev

# 3. Generate email - should use fallback
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-004"}'

# Should see: "Using text fallback (no image generation)"
```

### Test New Provider

Create a test file:

```typescript
// test-provider.ts
import { imageProvider } from './src/services/image-providers.js';

async function test() {
  console.log(`Testing provider: ${imageProvider.name}`);

  const url = await imageProvider.generateImage(
    'A simple test image of a blue cube',
    10000
  );

  if (url) {
    console.log('✅ Success:', url);
  } else {
    console.log('❌ Failed (using fallback)');
  }
}

test();
```

## Error Handling

All providers implement graceful fallback:

```typescript
async generateImage(prompt: string, timeout: number): Promise<string | null> {
  try {
    // Attempt generation
    return imageUrl;
  } catch (error) {
    // Return null → triggers text fallback
    return null;
  }
}
```

**Key Point**: Returning `null` is not a failure - it triggers the text fallback system, which is intentional!

## Future Providers to Add

### Midjourney
- Would need Discord bot integration or official API
- Known for high-quality artistic images

### FLUX
- Open-source Stable Diffusion alternative
- Can run locally or via API

### Replicate
- Unified API for multiple models
- Good for experimentation

### Local Generation
- Run Stable Diffusion locally
- No API costs, full control
- Requires GPU

## Summary

The provider abstraction makes it **trivial** to:
- ✅ Switch between image services (1 env var change)
- ✅ Test with fallback mode (fast, reliable)
- ✅ Add new providers (implement interface, add to factory)
- ✅ Handle errors gracefully (always has text fallback)

**For your demo**: Use `IMAGE_PROVIDER=fallback` for reliability, or `IMAGE_PROVIDER=dalle` for the full experience. The architecture is ready for any future provider you want to add!
