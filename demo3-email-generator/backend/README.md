# Demo 3: Email Generator - Backend

Backend service for personalized email generation with RAG (Retrieval Augmented Generation).

## Features

- **LangChain Orchestration**: Multi-step chain (analyze → retrieve → style → generate)
- **RAG Integration**: Vector store for pulling relevant collaboration context
- **4 User Personas**: Detail-oriented, action-focused, inactive, meme-loving
- **Structured Output**: Zod schemas for type-safe LLM responses
- **Azure OpenAI**: GPT-4o via Foundry

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Azure OpenAI credentials:

```bash
cp .env.example .env
```

Required variables:
- `AZURE_OPENAI_API_KEY` - Your Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT` - Your Azure OpenAI endpoint (e.g., https://your-resource.openai.azure.com/)
- `AZURE_OPENAI_DEPLOYMENT_NAME` - Your GPT-4o deployment name
- `AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT` - Your embeddings deployment (e.g., text-embedding-ada-002)

### 3. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3003`

## API Endpoints

### Get All Users
```bash
GET /api/users
```

Returns all 4 user personas.

### Get Specific User
```bash
GET /api/users/:userId
```

Returns a specific user profile.

### Generate Email for One User
```bash
POST /api/generate-email
Content-Type: application/json

{
  "userId": "user-001"
}
```

Generates a personalized email for the specified user.

### Generate Emails for All Users (Batch)
```bash
POST /api/generate-email-batch
```

Generates emails for all 4 users in parallel.

### Get Task Data
```bash
GET /api/task-data
```

Returns the task activity data (same for all users).

## Example Usage

### Generate Email for Sarah (Detail-Oriented)
```bash
curl -X POST http://localhost:3003/api/generate-email \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-001"}'
```

### Generate Emails for All Users
```bash
curl -X POST http://localhost:3003/api/generate-email-batch
```

## Architecture

### LangChain Orchestration

The email generation uses a multi-step LangChain pipeline:

1. **Analyze Activity Chain**: Analyzes task data to identify key points
2. **Relevant Comments Chain**: Retrieves collaboration context via RAG
3. **Determine Style Chain**: Business logic for style based on user type
4. **Generate Email Chain**: Generates structured email with LLM

```typescript
const fullChain =
  analyzeActivityChain
    .pipe(relevantCommentsChain)
    .pipe(determineStyleChain)
    .pipe(generateEmailChain);
```

### RAG Integration

Comments are stored in a vector store (in-memory) for semantic search:

```typescript
// At startup: Load comments into vector store
await initializeVectorStore();

// During generation: Retrieve relevant comments
const query = `Comments mentioning ${user.name}`;
const relevantComments = await vectorStore.similaritySearch(query, 5);
```

### User Personas

1. **Sarah Chen** (detail-oriented): Comprehensive stats, professional tone
2. **Mike Rodriguez** (action-focused): Brief, direct, action-oriented
3. **Alex Kumar** (inactive): Motivational, re-engagement focused
4. **Jamie Taylor** (meme-loving): Humorous, casual, with meme references

## Project Structure

```
backend/
├── src/
│   ├── chains/
│   │   └── email.chains.ts       # LangChain orchestration
│   ├── config/
│   │   ├── azure.config.ts       # Azure OpenAI setup
│   │   └── vectorstore.config.ts # Vector store initialization
│   ├── data/
│   │   ├── users.json            # 4 user personas
│   │   ├── tasks.json            # Task activity data
│   │   └── comments.json         # Comments for RAG
│   ├── routes/
│   │   └── email.routes.ts       # API endpoints
│   ├── schemas/
│   │   └── email.schema.ts       # Zod schemas
│   └── server.ts                 # Express server
├── package.json
├── tsconfig.json
└── .env.example
```

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express
- **AI Framework**: LangChain.js v1
- **LLM**: Azure OpenAI (GPT-4o)
- **Embeddings**: Azure OpenAI (text-embedding-ada-002)
- **Schema Validation**: Zod
- **Vector Store**: LangChain MemoryVectorStore

## Development

### Watch Mode
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Notes

- Vector store is initialized once at startup
- Same task data is used for all users to demonstrate personalization
- Emails are generated fresh each time (not cached)
- RAG retrieves up to 5 relevant comments per request
