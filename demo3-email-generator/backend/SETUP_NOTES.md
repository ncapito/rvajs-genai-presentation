# Backend Setup Notes

## Environment Configuration

### Required Variables
```env
# Main model for content generation
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-08-01-preview
```

### Optional Variables

#### Grok Code Fast (for HTML generation)
```env
GROK_CODE_FAST_DEPLOYMENT=grok-code-fast-1
```
**Note**: If not set, falls back to `AZURE_OPENAI_DEPLOYMENT_NAME`

#### Embeddings (for RAG)
```env
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-ada-002
```
**Note**: If not set, RAG is disabled (emails generate without collaboration context)

#### DALL-E (for meme generation)
```env
AZURE_OPENAI_DALLE_DEPLOYMENT=dall-e-3
```
**Note**: Feature is disabled by default in `azure.config.ts`

## Models Used

### Multi-Model Pipeline

```typescript
Step 1: analyzeActivityChain      → azureLLM (GPT-4o, temp: 0.7)
Step 2: relevantCommentsChain      → Vector store + embeddings
Step 3: determineStyleChain        → Business logic (no LLM)
Step 4: generateEmailChain         → azureLLM (GPT-4o, temp: 0.7)
Step 5: convertToHTMLChain         → codeLLM (Grok/fallback, temp: 0.3)
```

### Model Selection Logic

**codeLLM** (for HTML generation):
1. If `GROK_CODE_FAST_DEPLOYMENT` is set → Uses Grok Code Fast
2. Otherwise → Falls back to `AZURE_OPENAI_DEPLOYMENT_NAME`
3. Temperature: 0.3 (lower for deterministic code generation)

**azureLLM** (for content generation):
1. Always uses `AZURE_OPENAI_DEPLOYMENT_NAME`
2. Temperature: 0.7 (higher for creative content)

## Features and Toggles

### HTML Conversion (Enabled by Default)
```typescript
// In routes/email.routes.ts
const emailChain = createFullEmailChain(vectorStore, true);  // HTML on
const emailChain = createFullEmailChain(vectorStore, false); // Markdown only
```

### RAG (Auto-detected)
- **Enabled**: If `AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT` is set
- **Disabled**: If not set (vector store returns null)

### Meme Generation (Disabled by Default)
```typescript
// In config/azure.config.ts
export const memeConfig = {
  enabled: false,  // Change to true to enable
  // ...
};
```

## Console Output

### Successful Startup
```
Initializing vector store for comment RAG...
✅ Vector store initialized with 8 comments
✅ Server running on http://localhost:3003
```

### Without Embeddings
```
⚠️  AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT not set - RAG disabled
   Emails will generate without collaboration context
✅ Server running on http://localhost:3003
```

### During Email Generation
```
Generating email for Sarah Chen (detail-oriented)...
Converting email to HTML using coding-optimized model...
Email generated in 7234ms for Sarah Chen
```

## Performance

### With Grok Code Fast
```
Total: ~7-8 seconds
- Analysis: 2s (GPT-4o)
- RAG: 0.5s (if enabled)
- Style: 0s (business logic)
- Content: 3s (GPT-4o)
- HTML: 1.5s (Grok Code Fast)  ← Optimized
```

### Without Grok (Fallback to Main Model)
```
Total: ~8-10 seconds
- Analysis: 2s (GPT-4o)
- RAG: 0.5s (if enabled)
- Style: 0s (business logic)
- Content: 3s (GPT-4o)
- HTML: 3s (GPT-4o)  ← Same model, not optimized for code
```

## API Endpoints

### Generate Single Email
```bash
POST http://localhost:3003/api/generate-email
Content-Type: application/json

{
  "userId": "user-001"  # Sarah Chen (detail-oriented)
}
```

### Generate All Emails (Batch)
```bash
POST http://localhost:3003/api/generate-email-batch
```

### Get Users
```bash
GET http://localhost:3003/api/users
```

### Get Task Data
```bash
GET http://localhost:3003/api/task-data
```

## Troubleshooting

### Vector Store Errors
**Symptom**: `404 The API deployment for this resource does not exist`
**Solution**: Set `AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT` in `.env` or let it run without RAG

### Model Not Found
**Symptom**: `DeploymentNotFound` error
**Solution**:
- Check deployment names in Azure AI Foundry
- Verify exact spelling in `.env`
- Ensure deployments are in the same resource

### HTML Not Generating
**Symptom**: Emails still in markdown format
**Solution**:
- Check `includeHTML: true` in routes
- Verify console shows "Converting email to HTML..."
- Check for errors in backend logs

### Slow Generation
**Symptom**: Takes >15 seconds per email
**Solution**:
- Check model deployments (use Standard, not Provisioned if slow)
- Verify network connectivity to Azure
- Consider using Grok Code Fast for HTML step

## Testing and Experimentation Tips

### Before Running
1. **Pre-warm models**: Generate one email first to warm up connections (initial requests are slower)
2. **Monitor console**: Shows which models are being used and execution progress
3. **Test RAG**: Ensure embeddings are set up if testing collaboration context features

### Experimentation Ideas
1. **Add HTML conversion**: Try adding `.pipe(convertToHTMLChain)` to see formatted output
2. **Switch models**: Experiment with different model deployments to compare quality/speed
3. **Toggle RAG**: Enable/disable collaboration context to see the impact on personalization
4. **Adjust temperature**: Try different temperature values to see how it affects creativity vs consistency

## Development

### Watch Mode
```bash
npm run dev  # Auto-restarts on file changes
```

### Build
```bash
npm run build  # Compiles TypeScript to dist/
```

### Production
```bash
npm start  # Runs compiled JavaScript from dist/
```

## Security Notes

- ✅ API keys in environment variables (not in code)
- ✅ CORS enabled for local development (restrict for production)
- ✅ No user data stored (all mock data)
- ✅ No authentication (add for production)
- ✅ No rate limiting (add for production)

## Next Steps

1. ✅ Set up `.env` with your credentials
2. ✅ Test with single email generation
3. ✅ Test batch generation (all 4 personas)
4. ✅ Verify HTML emails render correctly
5. ✅ Test RAG with embeddings (optional)
6. ✅ Explore the LEARN.md exercises to understand the implementation
