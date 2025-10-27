# Demo 2 Backend - Receipt Parsing with Vision

Backend API demonstrating vision + structured output for receipt parsing.

## Features

- **Two Approaches**:
  - **Simple** (`/api/parse/simple`) - Single Claude Vision call (primary demo)
  - **Chain** (`/api/parse/chain`) - Multi-step LangChain orchestration (teaching moment)

- **Discriminated Union Responses** - Handles success, partial, not_a_receipt, unreadable states
- **File Upload** - Accepts receipt images via multipart/form-data
- **Zod Validation** - Type-safe response structures

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure Azure OpenAI in `.env`:
```
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_CLAUDE_DEPLOYMENT=claude-3-5-sonnet
AZURE_OPENAI_GPT4_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview
PORT=3001
```

## Running

```bash
npm run dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### POST /api/parse/simple
Parse receipt using single Claude Vision call (RECOMMENDED)

**Request:**
```bash
curl -X POST http://localhost:3001/api/parse/simple \
  -F "receipt=@path/to/receipt.jpg"
```

**Response (Success):**
```json
{
  "success": true,
  "approach": "simple",
  "status": "success",
  "receipt": {
    "merchant": "Joe's Coffee Shop",
    "date": "2024-10-15",
    "subtotal": 12.50,
    "tax": 1.13,
    "total": 13.63,
    "category": "food",
    "confidence": "high"
  },
  "notes": "Handwritten receipt parsed successfully"
}
```

**Response (Partial):**
```json
{
  "success": true,
  "approach": "simple",
  "status": "partial",
  "receipt": { ... },
  "missingFields": ["date", "tax"],
  "message": "Bottom portion of receipt is faded",
  "suggestions": ["Retake photo with better lighting"]
}
```

### POST /api/parse/chain
Parse using multi-step LangChain (for comparison)

Same request/response format, but uses 3-step chain:
1. Extract text (Claude Vision)
2. Parse structure (GPT-4o)
3. Enrich data (compute fields)

## Key Files

| File | Purpose |
|------|---------|
| `src/schemas/receipt.schema.ts` | Zod schemas with discriminated unions |
| `src/services/vision.service.ts` | **⭐ Simple approach** - Single Vision call |
| `src/services/chain.service.ts` | **⭐ Orchestrated approach** - LangChain |
| `src/routes/receipt.routes.ts` | API endpoints + file upload |

## Testing

Place sample receipts in `sample-receipts/` directory, then:

```bash
# Test simple approach
curl -X POST http://localhost:3001/api/parse/simple \
  -F "receipt=@sample-receipts/grocery.jpg"

# Test chain approach
curl -X POST http://localhost:3001/api/parse/chain \
  -F "receipt=@sample-receipts/restaurant.jpg"
```

## Response States

Using discriminated unions (same pattern as Demo 1):

- **success** - Receipt parsed successfully
- **partial** - Some fields couldn't be read (e.g., faded image)
- **not_a_receipt** - Wrong document type
- **unreadable** - Image too poor quality

## Simple vs Chain: When to Use What

### Use Simple (`/api/parse/simple`)
- ✅ Single task (just parse the receipt)
- ✅ Speed matters
- ✅ Lower cost preferred
- ✅ **RECOMMENDED for production**

### Use Chain (`/api/parse/chain`)
- ✅ Need different models for different steps
- ✅ Business logic between LLM calls
- ✅ Better observability required
- ✅ **Good for complex workflows**

## Live Coding Target

During presentation, add `taxPercentage` field to schema:

**File**: `src/schemas/receipt.schema.ts`
**Line**: 11 (commented out by default)
**Demo**: Uncomment and show it calculating automatically!

```typescript
taxPercentage: z.number().optional(), // 👈 Uncomment during demo!
```
