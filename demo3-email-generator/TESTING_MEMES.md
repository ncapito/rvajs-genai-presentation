# Testing Meme Generation - Quick Guide

## Step 1: Verify Jamie Has Memes Enabled

Check `backend/src/data/users.json`:
```json
{
  "id": "user-004",
  "name": "Jamie Taylor",
  "userType": "meme-loving",
  "preferences": {
    "includeMemes": true  // ← Should be true
  }
}
```

## Step 2: Generate Email WITHOUT Images First

Keep memes disabled to test if memeSpots are being generated:

1. **Leave meme generation disabled** in `backend/src/config/azure.config.ts`:
   ```typescript
   export const memeConfig = {
     enabled: false,  // ← Keep false for now
     // ...
   };
   ```

2. **Restart backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Generate email for Jamie**:
   ```bash
   curl -X POST http://localhost:3003/api/generate-email \
     -H "Content-Type: application/json" \
     -d '{"userId": "user-004"}' | jq
   ```

4. **Check console output** - you should see:
   ```
   Generating email for Jamie Taylor (meme-loving)...
   ✅ Generated 2 meme spots for Jamie Taylor  ← This means it's working!
   Converting email to HTML using coding-optimized model...
   Email generated in 7234ms for Jamie Taylor
   ```

5. **Check the API response** - look for `memeSpots` array:
   ```json
   {
     "email": {
       "subject": "...",
       "body": "...",
       "memeSpots": [
         {
           "position": 2,
           "generationPrompt": "A meme in the 'This is Fine' format...",
           "altText": "This is fine dog with burning office",
           "textFallback": "*Insert 'This is Fine' meme here*"
         }
       ]
     }
   }
   ```

## Step 3: Enable Meme Image Generation

Once you confirm memeSpots are being generated:

1. **Enable DALL-E** in `backend/src/config/azure.config.ts`:
   ```typescript
   export const memeConfig = {
     enabled: true,  // ← Change to true
     generationTimeout: 10000,
     fallbackToText: true,
     dalleDeployment: process.env.AZURE_OPENAI_DALLE_DEPLOYMENT || 'dall-e-3',
   };
   ```

2. **Make sure DALL-E is configured** in `.env`:
   ```env
   AZURE_OPENAI_DALLE_DEPLOYMENT=dall-e-3
   ```

3. **Restart backend**:
   ```bash
   cd backend
   npm run dev
   ```

4. **Generate email again**:
   ```bash
   curl -X POST http://localhost:3003/api/generate-email \
     -H "Content-Type: application/json" \
     -d '{"userId": "user-004"}' | jq
   ```

5. **Watch console for meme generation**:
   ```
   Generating email for Jamie Taylor (meme-loving)...
   ✅ Generated 2 meme spots for Jamie Taylor
   Converting email to HTML using coding-optimized model...
   Meme generation enabled in chain
   Generating 2 memes for Jamie Taylor...
   Generating meme 1: "A meme in the 'This is Fine' format..."
   ✅ Meme 1 generated successfully
   Generating meme 2: "A 'Drake Hotline Bling' meme..."
   ✅ Meme 2 generated successfully
   ✅ Memes: 2 generated, 0 fallback
   Email generated in 18234ms for Jamie Taylor
   ```

6. **Check the HTML** - should have `<img>` tags:
   ```html
   <div style="text-align: center; margin: 24px 0;">
     <img src="https://dalleprodsec.blob.core.windows.net/..."
          alt="This is fine dog with burning office"
          style="max-width: 100%; ..." />
   </div>
   ```

## Troubleshooting

### Issue: No meme spots generated
**Console shows**: `⚠️  No meme spots generated for Jamie Taylor (meme-loving user!)`

**Solutions**:
1. Check that `includeMemes: true` in users.json
2. Restart backend after changes
3. Try regenerating the email
4. Check backend logs for parsing errors

### Issue: Meme spots generated but no images
**Console shows**: `✅ Generated 2 meme spots` but no "Generating memes..."

**Solutions**:
1. Check `memeConfig.enabled = true` in azure.config.ts
2. Restart backend
3. Verify DALL-E deployment is set in .env

### Issue: DALL-E errors
**Console shows**: `Failed to generate meme X: ...`

**Solutions**:
- Check DALL-E deployment name is correct
- Verify API quotas (DALL-E has rate limits)
- Images will fall back to text (by design)

## Quick Command Shortcuts

### Test memeSpots generation (fast, no DALL-E):
```bash
# 1. Ensure memes disabled in config
# 2. Generate email
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-004"}' | jq '.email.memeSpots'
```

### Test full meme generation (slow, with DALL-E):
```bash
# 1. Ensure memes enabled in config
# 2. Generate email
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-004"}' | jq '.email.body' | grep -o 'img src'
```

### Check console logs:
```bash
# In backend terminal, look for:
# - "✅ Generated X meme spots"
# - "Generating X memes"
# - "✅ Meme X generated successfully"
```

## Expected Behavior

### Phase 1: MemeSpots Only (DALL-E disabled)
- ✅ Email has humorous text
- ✅ memeSpots array in response
- ✅ Text fallbacks in email (e.g., "*Insert meme here*")
- ⏱️ Fast (~7-8 seconds)

### Phase 2: Full Meme Generation (DALL-E enabled)
- ✅ Email has humorous text
- ✅ memeSpots array generated
- ✅ Actual `<img>` tags with DALL-E URLs
- ✅ Images display in browser
- ⏱️ Slow (~15-20 seconds)

## Demo Recommendation

**For reliability during presentation**:
1. Test Phase 1 first (verify memeSpots work)
2. Pre-generate Phase 2 and take screenshots
3. During demo, show Phase 1 live
4. Show Phase 2 screenshots
5. Optional: attempt live Phase 2 if time allows
