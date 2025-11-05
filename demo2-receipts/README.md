# Demo 2: Receipt Parsing with Vision + Structured Outputs

**For hands-on learning**: See [LEARN.md](./LEARN.md) for step-by-step exercises and implementation guide.

---

## Overview

This demo showcases how **Claude Vision API** transforms receipt processing from brittle, regex-based parsing to intelligent, multimodal document understanding.

**Difficulty**: Intermediate

---

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Anthropic API key (for Claude Vision)

### Setup
```bash
# Backend
cd demo2-receipts/backend
npm install
cp .env.example .env  # Add your ANTHROPIC_API_KEY
npm run dev

# Frontend (new terminal)
cd demo2-receipts/frontend
npm install
npm start
```

**Then**: Visit http://localhost:4201

**For detailed setup and learning exercises**, see [LEARN.md](./LEARN.md)

---

## The Problem vs Solution

### BEFORE: Brittle Regex-Based Parsing

**Traditional approach limitations:**
```typescript
// ❌ Brittle regex patterns
const totalRegex = /TOTAL[\s:$]*(\d+\.\d{2})/i;
const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;

// ❌ Only works with specific formats
// ❌ Fails on handwritten receipts
// ❌ Can't handle rotated images
// ❌ Breaks when merchant changes format
```

**Pain points:**
- 🔴 Only handles **perfect, typed receipts**
- 🔴 Requires **per-merchant templates**
- 🔴 **Breaks constantly** when formats change
- 🔴 **Cannot handle** handwritten text
- 🔴 **High maintenance cost**

### AFTER: Claude Vision + Structured Outputs

**GenAI approach:**
```typescript
// ✅ Single API call to Claude Vision
const result = await visionService.parseReceipt(imagePath);

// ✅ Handles any receipt format automatically
// ✅ Reads handwritten text
// ✅ Works with rotated/skewed images
// ✅ Validates data with Zod schemas
// ✅ Returns structured, type-safe results
```

**Advantages:**
- ✅ **Works with ANY receipt format** (restaurant, grocery, retail, etc.)
- ✅ **Handles handwritten receipts**
- ✅ **Multi-format support**: Images (JPG, PNG, WebP) + PDFs
- ✅ **Graceful error handling**: Partial reads, quality issues, non-receipts
- ✅ **Zero maintenance**: No regex updates needed

---

## Architecture: Two Approaches

### 1. Simple Approach (Recommended)
```
Image/PDF → Claude Vision API → Structured Output → Validation
```
- **Single API call**
- **Fast and efficient** (~2-3 seconds)
- **Best for most use cases**
- **Production-ready**

### 2. Chain Approach (Educational)
```
Image/PDF → Extract Text → Parse Structure → Enrich & Validate
```
- **Multi-step LangChain orchestration** (~4-6 seconds)
- **Better observability** (see each step)
- **Good for learning when to orchestrate vs keep simple**

### Decision Tree

**Use Simple When:**
- Single task (extract receipt data)
- Fast response needed
- Cost-sensitive
- **This covers 90% of use cases!**

**Use Chain When:**
- Multiple processing steps needed
- Complex business logic between steps
- Need step-by-step observability
- Different teams own different steps

---

## Key Concepts

### 1. Discriminated Unions (Zod Pattern)

Handling multiple response states in a type-safe way:

```typescript
export const ReceiptParseResultSchema = z.discriminatedUnion('status', [
  // Success: Got everything
  z.object({
    status: z.literal('success'),
    receipt: ReceiptDataSchema,
    notes: z.string().optional()
  }),

  // Partial: Got some data, but missing fields
  z.object({
    status: z.literal('partial'),
    receipt: ReceiptDataSchema,
    missingFields: z.array(z.string()),
    message: z.string()
  }),

  // Not a receipt: Wrong document type
  z.object({
    status: z.literal('not_a_receipt'),
    reason: z.string()
  }),

  // Unreadable: Image quality too poor
  z.object({
    status: z.literal('unreadable'),
    reason: z.string(),
    suggestions: z.array(z.string())
  })
]);
```

**Why This Matters:**
- ✅ Type-safe handling of multiple states
- ✅ Forces you to handle all cases
- ✅ Clear communication with users
- ✅ Prevents silent failures

### 2. Transformation Layer

**Problem**: Claude might return slightly different field names than your schema expects.

**Solution**: Transform before validation
```typescript
private transformResponse(response: any): any {
  // Map 'name' to 'description', 'amount' to 'price'
  receipt.items = receipt.items.map((item: any) => ({
    description: item.description || item.name,
    price: item.price ?? item.amount,  
    quantity: item.quantity
  }));

  return response;
}
```


### 3. Image vs Document Content Blocks

**For Images:**
```typescript
{
  type: 'image',
  source: {
    type: 'base64',
    media_type: 'image/jpeg',  // or png, gif, webp
    data: base64Data
  }
}
```

**For PDFs:**
```typescript
{
  type: 'document',
  source: {
    type: 'base64',
    media_type: 'application/pdf',
    data: base64Data
  }
}
```

**Important**: Use `type: 'document'` for PDFs, not `type: 'image'`!

---

## API Reference

### POST /api/parse/simple
**Simple approach** - single Claude Vision call

**Request:**
```bash
curl -X POST http://localhost:3001/api/parse/simple \
  -F "receipt=@chicken-fiesta-receipt.jpg"
```

**Response:**
```json
{
  "success": true,
  "approach": "simple",
  "status": "success",
  "receipt": {
    "merchant": "Chicken Fiesta",
    "date": "2025-10-27",
    "subtotal": 59.95,
    "tax": 8.10,
    "taxPercentage": 13.51,
    "total": 68.05,
    "items": [...]
  }
}
```

### POST /api/parse/chain
**Chain approach** - LangChain orchestrated (3 steps)

Same request/response format, but with step-by-step processing.

**Performance Comparison:**
- Simple: ~2-3 seconds
- Chain: ~4-6 seconds (3 separate LLM calls)

---

## What You'll Learn

By completing this demo, you'll understand:

1. **Multimodal AI** - Claude can "see" and understand documents
2. **Structured outputs** - Zod schemas ensure valid, type-safe outputs
3. **Graceful degradation** - Handle edge cases explicitly with discriminated unions
4. **Architecture decisions** - When to use simple vs orchestrated approaches
5. **Production patterns** - Transform layers, error handling, validation

---

## Use Cases

### When to Use This Pattern
- ✅ **Document processing** (receipts, invoices, forms)
- ✅ **Data extraction** from unstructured sources
- ✅ **OCR replacement** (especially for variable formats)
- ✅ **Handwritten text recognition**
- ✅ **Multi-format support** needed (images + PDFs)

### When NOT to Use This Pattern
- ❌ Simple text-only extraction (use regular expressions)
- ❌ Real-time video processing (latency too high)
- ❌ Batch processing millions of documents (cost prohibitive)
- ❌ When exact pixel-perfect accuracy required (use traditional OCR + GenAI hybrid)

---

## Learning Resources

- **[LEARN.md](./LEARN.md)** - Step-by-step learning exercises and implementation guide
- **[INFRASTRUCTURE.md](../../INFRASTRUCTURE.md)** - Cloud setup and API configuration
- [Claude Vision API Docs](https://docs.anthropic.com/en/docs/vision)
- [Zod Documentation](https://zod.dev/)
- [LangChain.js Documentation](https://js.langchain.com/)

---

**Ready to start?** Go to [LEARN.md](./LEARN.md) for hands-on exercises!
