# Image Generation Format Support

## Overview

The image provider now supports **both response formats** from Azure OpenAI image models:

1. **URL-based** (DALL-E 3 default)
2. **Base64-based** (FLUX-1.1-pro, some other models)

This allows you to use **any Azure OpenAI image generation deployment** without code changes!

---

## Supported Models

### 1. DALL-E 3 (URL Response)

**Deployment**: `dall-e-3`

**Response Format**:
```json
{
  "data": [
    {
      "url": "https://dalleprodsec.blob.core.windows.net/...",
      "b64_json": null
    }
  ]
}
```

**Configuration**:
```env
IMAGE_PROVIDER=dalle
IMAGE_DEPLOYMENT_NAME=dall-e-3
```

**Pros**:
- ✅ Highest quality images
- ✅ External URL (smaller HTML)
- ✅ Production-proven

**Cons**:
- ❌ Slower generation (6-15 seconds per image)
- ❌ Content safety filters can reject prompts

---

### 2. FLUX-1.1-pro (Base64 Response)

**Deployment**: `FLUX-1.1-pro`

**Response Format**:
```json
{
  "data": [
    {
      "url": null,
      "b64_json": "iVBORw0KGgoAAAANSUhEUgAAA..."
    }
  ]
}
```

**Configuration**:
```env
IMAGE_PROVIDER=dalle
IMAGE_DEPLOYMENT_NAME=FLUX-1.1-pro
```

**Pros**:
- ✅ Fast generation (2-5 seconds per image)
- ✅ High quality
- ✅ More flexible prompting

**Cons**:
- ❌ Larger HTML (base64 embedded)
- ❌ May have different availability

---

## How It Works

### Automatic Format Detection

The provider automatically detects which format the model returns:

```typescript
// Check for URL (DALL-E 3)
if (imageData?.url) {
  return imageData.url;  // Return as-is
}

// Check for base64 (FLUX)
if (imageData?.b64_json) {
  // Convert to data URL for HTML embedding
  return `data:image/png;base64,${imageData.b64_json}`;
}
```

### Data URL Format

Base64 images are converted to **data URLs** that can be embedded directly in HTML:

```html
<img src="data:image/png;base64,iVBORw0KGgo..." />
```

**Advantages**:
- ✅ Works in HTML emails
- ✅ No external dependencies
- ✅ No CORS issues

**Disadvantages**:
- ❌ Increases HTML size (~100-200KB per image)
- ❌ Not cacheable like external URLs

---

## Switching Between Models

### Option 1: Use DALL-E 3 (URL-based)

```env
IMAGE_DEPLOYMENT_NAME=dall-e-3
```

### Option 2: Use FLUX (Base64-based)

```env
IMAGE_DEPLOYMENT_NAME=FLUX-1.1-pro
```

### Option 3: Use Any Other Model

```env
IMAGE_DEPLOYMENT_NAME=your-custom-image-model
```

**That's it!** No code changes needed. The provider auto-detects the format.

---

## Console Output

### With URL Response (DALL-E 3)

```
🖼️  DALL-E Request:
   Model: dall-e-3
   Endpoint: https://your-resource.openai.azure.com/
   Timeout: 300000ms

✅ Image URL received
✅ Meme 1 completed in 8.45s
```

### With Base64 Response (FLUX)

```
🖼️  DALL-E Request:
   Model: FLUX-1.1-pro
   Endpoint: https://your-resource.openai.azure.com/
   Timeout: 300000ms

✅ Base64 image received, converting to data URL
✅ Meme 1 completed in 3.21s
```

---

## HTML Rendering

### URL-Based Images

```html
<img src="https://dalleprodsec.blob.core.windows.net/..."
     alt="Meme description"
     style="max-width: 100%; ..." />
```

**File size**: ~5KB (just the URL)

### Base64-Based Images

```html
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."
     alt="Meme description"
     style="max-width: 100%; ..." />
```

**File size**: ~150KB (entire image embedded)

**Both render identically in the browser!**

---

## Performance Comparison

### DALL-E 3 (URL)

- **Generation time**: 6-15 seconds per image
- **Total for 3 memes**: ~20-45 seconds
- **HTML size**: Small (~15KB URLs)
- **Quality**: Excellent

### FLUX-1.1-pro (Base64)

- **Generation time**: 2-5 seconds per image
- **Total for 3 memes**: ~6-15 seconds
- **HTML size**: Large (~450KB embedded)
- **Quality**: Excellent

### Recommendation

**For demos/presentations**: Use FLUX for speed ⚡

**For production emails**: Use DALL-E 3 for smaller HTML 📧

**For web display**: Either works great! 🎨

---

## Troubleshooting

### Issue: "No URL or base64 data in response"

**Cause**: Model returned unexpected format

**Debug**:
1. Check console output for the full response
2. Verify deployment name is correct
3. Check Azure portal for deployment details

**Example output**:
```
❌ Image generation: No URL or base64 data in response
   Response: {
     "data": [
       {
         "url": null,
         "b64_json": null,
         "revised_prompt": "..."
       }
     ]
   }
```

### Issue: Base64 images not displaying

**Cause**: Browser security restrictions or malformed data URL

**Fix**:
1. Verify Angular's DomSanitizer is bypassing security (already done)
2. Check console for base64 data corruption
3. Ensure full base64 string is being passed

### Issue: HTML email too large

**Cause**: Multiple base64 images embedded

**Solutions**:
1. Switch to URL-based model (DALL-E 3)
2. Reduce number of memes
3. Disable meme generation for certain emails

---

## Configuration Examples

### Example 1: Single Resource (Everything Together)

```env
# Main Azure OpenAI resource
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# Image generation uses SAME resource
IMAGE_DEPLOYMENT_NAME=FLUX-1.1-pro
# IMAGE_API_KEY, IMAGE_ENDPOINT_URL not needed (fallback to main)
```

### Example 2: Separate Resources

```env
# Main resource for LLMs
AZURE_OPENAI_API_KEY=main_key
AZURE_OPENAI_ENDPOINT=https://main-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# Separate resource for images
IMAGE_API_KEY=image_key
IMAGE_ENDPOINT_URL=https://image-resource.openai.azure.com/
IMAGE_DEPLOYMENT_NAME=dall-e-3
```

---

## Summary

The image provider now **automatically handles both formats**:

| Format | Models | Response Field | Output |
|--------|--------|----------------|--------|
| URL | DALL-E 3 | `url` | External URL |
| Base64 | FLUX-1.1-pro | `b64_json` | Data URL |

**Key takeaway**: Set `IMAGE_DEPLOYMENT_NAME` to any model you want, and it just works! 🚀

No code changes needed when switching between DALL-E 3, FLUX, or any other Azure OpenAI image model.
