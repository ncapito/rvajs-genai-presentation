# Demo 3: Quick Start Guide

Get Demo 3 running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Azure OpenAI API credentials (GPT-4o + embeddings)

## Step-by-Step Setup

### 1. Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env` with your credentials:**
```env
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT=text-embedding-ada-002
PORT=3003
```

```bash
# Start backend
npm run dev
```

You should see:
```
✅ Server running on http://localhost:3003
📧 Demo 3: Email Personalization with RAG
Vector store initialized with 8 comments
```

### 2. Frontend Setup (2 minutes)

Open a **new terminal**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend
npm start
```

Frontend will open at `http://localhost:4203`

### 3. Test It Out (1 minute)

1. Open `http://localhost:4203` in your browser
2. Click on **Sarah Chen** (detail-oriented persona)
3. Click **"Generate Email for Sarah Chen"**
4. Watch as a personalized email is generated!
5. Try the other personas to see how different they are
6. Click **"Side-by-Side Comparison"** → **"Generate All Emails"** for the WOW moment

## What You Should See

### Sarah's Email (Detail-Oriented)
- Long, comprehensive email with stats
- Professional tone
- Multiple sections with breakdowns
- Trends and analysis

### Mike's Email (Action-Focused)
- Brief and direct
- Bullet points
- Focus on overdue items
- No fluff

### Alex's Email (Inactive)
- Motivational tone
- Emphasizes team needs
- Re-engagement call-to-action
- Supportive language

### Jamie's Email (Meme-Loving)
- Humorous and casual
- Internet culture references
- Playful but informative
- Makes you smile!

## Quick Test API Endpoints

### Get All Users
```bash
curl http://localhost:3003/api/users
```

### Generate Email for Sarah
```bash
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}'
```

### Generate All Emails
```bash
curl -X POST http://localhost:3003/api/generate-email-batch
```

## Troubleshooting

### Backend won't start
- Check that your `.env` file has valid Azure credentials
- Verify your Azure OpenAI deployment names are correct
- Make sure port 3003 is not already in use

### Frontend won't start
- Run `npm install` in the frontend directory
- Check that port 4203 is available
- Clear npm cache: `npm cache clean --force`

### API calls failing
- Verify backend is running on port 3003
- Check browser console for CORS errors
- Test backend health: `curl http://localhost:3003/health`

### Vector store errors
- Ensure `AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT` is set correctly
- Check that your Azure OpenAI instance has an embeddings deployment

## Demo Tips

### For Presentation

1. **Pre-generate emails**: Run batch generation before demo to show results quickly
2. **Have screenshots**: In case API is slow or fails
3. **Side-by-side view**: Most impactful visual - same data, different emails!
4. **Live code the RAG**: Show adding `relevantCommentsChain` to the pipeline

### For Development

1. **Watch mode**: Backend uses `tsx watch` for hot reload
2. **Check logs**: Backend logs show generation time and steps
3. **Inspect network**: Use browser DevTools to see API responses
4. **Test personas**: Each persona has distinct characteristics

## Next Steps

- [ ] Test all 4 personas individually
- [ ] Try side-by-side comparison mode
- [ ] Review the LangChain orchestration in `backend/src/chains/email.chains.ts`
- [ ] Check out the RAG setup in `backend/src/config/vectorstore.config.ts`
- [ ] Read the full documentation in `README.md`
- [ ] Practice live coding the RAG integration (see PLAN.md)

## Key Files to Review

- **Backend**:
  - `src/chains/email.chains.ts` - LangChain orchestration
  - `src/config/vectorstore.config.ts` - RAG setup
  - `src/schemas/email.schema.ts` - Zod schemas
  - `src/data/*.json` - Mock data

- **Frontend**:
  - `src/app/app.component.ts` - Main component
  - `src/app/email.service.ts` - API service

## Questions?

Refer to:
- `PLAN.md` - Comprehensive demo plan with flow
- `README.md` - Full documentation
- `backend/README.md` - Backend architecture
- `frontend/README.md` - Frontend details

## Ready for the Demo!

You now have:
✅ Backend API with LangChain orchestration
✅ RAG integration for collaboration context
✅ 4 user personas with different preferences
✅ Frontend UI with single and comparison modes
✅ Structured output with Zod schemas

**The key message**: Same data, wildly different emails - that's the power of AI personalization!
