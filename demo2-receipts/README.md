# Demo 2: Receipt Parsing with Vision + Structured Outputs

**Duration**: 15-20 minutes
**Difficulty**: Intermediate
**Focus**: Multimodal AI (Vision) + Structured Outputs + Zod Validation

## Overview

This demo showcases how **Claude Vision API** transforms receipt processing from brittle, regex-based parsing to intelligent, multimodal document understanding. It demonstrates the power of combining vision capabilities with structured output validation.

### Learning Objectives

By the end of this demo, attendees will understand:
1. **Multimodal AI**: How Claude can "see" and extract data from images and PDFs
2. **Structured Outputs**: Using Zod schemas to constrain and validate LLM responses
3. **Discriminated Unions**: Handling multiple response states (success/partial/error)
4. **Simple vs. Orchestrated**: When to use a single LLM call vs. LangChain chains
5. **Graceful Degradation**: Handling edge cases (handwritten receipts, poor quality, non-receipts)

---

## The Problem: Traditional Receipt OCR

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
// ❌ No understanding of context
```

**Pain points:**
- 🔴 Only handles **perfect, typed receipts**
- 🔴 Requires **per-merchant templates**
- 🔴 **Breaks constantly** when formats change
- 🔴 **Cannot handle** handwritten text
- 🔴 **No fraud detection** or validation
- 🔴 **High maintenance cost**

---

## The Solution: Claude Vision + Structured Outputs

### AFTER: Intelligent Multimodal Understanding

**GenAI approach benefits:**
```typescript
// ✅ Single API call to Claude Vision
const result = await visionService.parseReceipt(imagePath);

// ✅ Handles any receipt format automatically
// ✅ Reads handwritten text
// ✅ Works with rotated/skewed images
// ✅ Validates data with Zod schemas
// ✅ Returns structured, type-safe results
```

**Wins:**
- ✅ **Works with ANY receipt format** (restaurant, grocery, retail, etc.)
- ✅ **Handles handwritten receipts** (major WOW moment!)
- ✅ **Multi-format support**: Images (JPG, PNG, WebP) + PDFs
- ✅ **Graceful error handling**: Partial reads, quality issues, non-receipts
- ✅ **Type-safe outputs**: Zod validation ensures data integrity
- ✅ **Zero maintenance**: No regex updates needed

---

## Architecture

### Two Approaches Demonstrated

#### 1. **Simple Approach** (Primary - Production Ready)
```
Image/PDF → Claude Vision API → Structured Output → Validation
```
- **Single API call**
- **Fast and efficient**
- **Best for most use cases**
- **Lower cost and latency**

#### 2. **Chain Approach** (Teaching Moment)
```
Image/PDF → Extract Text → Parse Structure → Enrich & Validate
```
- **Multi-step LangChain orchestration**
- **Better observability** (see each step)
- **Good for complex workflows**
- **Teaching moment: when to orchestrate**

### Decision Tree: Simple vs. Chain

**Use Simple Approach When:**
- Single task (extract receipt data)
- Fast response needed
- Cost-sensitive
- **This covers 90% of use cases!**

**Use Chain Approach When:**
- Multiple processing steps needed
- Complex business logic between steps
- Need step-by-step observability
- Different teams own different steps

---

## Tech Stack

### Backend
- **Runtime**: Node.js + Express
- **AI SDK**: Anthropic Claude SDK v0.67.0
- **Model**: `claude-sonnet-4-20250514` (latest, supports PDFs)
- **Orchestration**: LangChain.js v1.0 (chain approach only)
- **Validation**: Zod v3.22 (critical for structured outputs!)
- **Observability**: Opik (local or cloud, optional)
- **File Upload**: Multer

### Frontend
- **Framework**: Angular 17+ (standalone components)
- **Styling**: Custom CSS with modern design
- **Features**: Drag-and-drop upload, live preview, side-by-side comparison

### AI Configuration
- **Model**: `claude-sonnet-4-20250514`
- **Max Tokens**: 2000
- **Temperature**: 0.0 (deterministic for data extraction)

---

## Quick Start

### Prerequisites
```bash
# Required
node >= 18
npm >= 9

# API Keys
ANTHROPIC_API_KEY=your-key-here

# Optional (for observability)
OPIK_ENABLED=true
OPIK_URL_OVERRIDE=http://localhost:5173/api  # Local Opik
```

### Setup

```bash
# 1. Install backend dependencies
cd demo2-receipts/backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Start backend
npm run dev
# Server runs at http://localhost:3001

# 4. Install frontend dependencies (separate terminal)
cd ../frontend
npm install

# 5. Start frontend
npm start
# App opens at http://localhost:4200
```

### Test It Out

1. **Visit** http://localhost:4200
2. **Upload** a receipt image (JPG/PNG) or PDF
3. **Choose** Simple or Chain approach
4. **See** structured data extracted!

---

## Key Concepts Demonstrated

### 1. Discriminated Unions (Zod Pattern)

**The Pattern:**
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
    message: z.string(),
    suggestions: z.array(z.string()).optional()
  }),

  // Not a receipt: Wrong document type
  z.object({
    status: z.literal('not_a_receipt'),
    reason: z.string(),
    suggestion: z.string().optional()
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
  // Extract category from nested merchant object
  if (typeof receipt.merchant === 'object' && receipt.merchant.category) {
    category = receipt.merchant.category;
  }

  // Flatten merchant to string
  if (typeof receipt.merchant === 'object' && receipt.merchant.name) {
    receipt.merchant = receipt.merchant.name;
  }

  // Map 'name' to 'description', 'amount' to 'price'
  receipt.items = receipt.items.map((item: any) => ({
    description: item.description || item.name,
    price: item.price ?? item.amount,  // Use ?? to handle 0 properly!
    quantity: item.quantity
  }));

  return response;
}
```

**Key Lesson**: Use nullish coalescing (`??`) not logical OR (`||`) to handle `0` values!

### 3. Prompt Engineering for Structured Outputs

**Critical prompting techniques:**
```typescript
const prompt = `
IMPORTANT RULES:
- If this is clearly a receipt, parse it and return status: "success"
- If image quality is poor but readable, return status: "partial"
- If not a receipt, return status: "not_a_receipt"
- If unreadable, return status: "unreadable" with suggestions

CRITICAL: Respond with ONLY raw JSON. Do NOT wrap in markdown code blocks.

JSON structure:
- Success: {"status": "success", "receipt": {...}, "notes": "..."}
...
`;
```

**Why This Works:**
- Clear instructions prevent ambiguity
- Explicit format requirements (no markdown!)
- Provides examples for each case
- Defines confidence levels

### 4. Image vs. Document Content Blocks

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

**Key**: Use `type: 'document'` for PDFs, not `type: 'image'`!

---

## Live Coding Sections

### Section 1: Add Tax Percentage Calculation (5 minutes)

**Current State**: Receipt shows tax amount ($8.10) but not percentage

**Goal**: Calculate and display tax percentage

**Steps:**

1. **Update Zod Schema** (`backend/src/schemas/receipt.schema.ts:9`):
```typescript
export const ReceiptDataSchema = z.object({
  merchant: z.string(),
  date: z.string(),
  subtotal: z.number().optional(),
  tax: z.number(),
  taxPercentage: z.number().optional(), // 👈 Add this!
  total: z.number(),
  // ... rest of schema
});
```

2. **Update Transformation Layer** (`backend/src/services/vision.service.ts:~195`):
```typescript
// After transforming receipt data, calculate tax percentage
if (receipt.tax && receipt.subtotal) {
  receipt.taxPercentage = (receipt.tax / receipt.subtotal) * 100;
}
```

3. **Update Frontend Display** (`frontend/src/app/components/upload/upload.component.html:~124`):
```html
@if (result.receipt?.taxPercentage) {
  <div class="detail-row highlight">
    <span class="label">Tax %:</span>
    <span class="value">{{ result.receipt.taxPercentage.toFixed(2) }}%</span>
  </div>
}
```

4. **Test It!**
   - Upload Chicken Fiesta receipt
   - Should show: **13.51%** tax percentage

**Teaching Points:**
- LLMs can **compute derived fields** (not just extract!)
- Schema additions are **non-breaking** (optional fields)
- Transformation layer is perfect for **business logic**

---

### Section 2: Business Rules & Validation (Optional - 5 minutes)

**Ideas for Extended Demo:**

#### A. Tip Validation (Fraud Detection)
```typescript
// In transformation layer
if (receipt.tip && receipt.subtotal) {
  const tipPercentage = (receipt.tip / receipt.subtotal) * 100;

  if (tipPercentage > 25) {
    return {
      status: 'partial',
      receipt,
      missingFields: [],
      message: `Unusual tip amount detected: ${tipPercentage.toFixed(1)}% tip`,
      suggestions: ['Please verify tip amount', 'Check for duplicate charges']
    };
  }
}
```

#### B. Duplicate Detection
```typescript
// Check against recent receipts
const isDuplicate = await checkDuplicateReceipt({
  merchant: receipt.merchant,
  total: receipt.total,
  date: receipt.date
});

if (isDuplicate) {
  return {
    status: 'not_a_receipt',
    reason: 'Duplicate receipt detected',
    suggestion: 'This receipt was already submitted on [date]'
  };
}
```

#### C. Category Validation
```typescript
// Validate category matches merchant
const knownMerchants = {
  'Chicken Fiesta': 'food',
  'Office Depot': 'office',
  'Shell': 'travel'
};

if (receipt.merchant in knownMerchants) {
  const expectedCategory = knownMerchants[receipt.merchant];
  if (receipt.category !== expectedCategory) {
    console.warn(`Category mismatch: ${receipt.category} vs expected ${expectedCategory}`);
  }
}
```

**Teaching Points:**
- GenAI doesn't replace business logic
- Combine **LLM intelligence** with **programmatic rules**
- Multiple validation layers create robust systems

---

## Sample Data Requirements

### For Demo

Prepare 3-4 receipts covering:

#### 1. Restaurant Receipt (Primary Demo)
- **Example**: Chicken Fiesta receipt
- **Format**: Photo (JPG/PNG)
- **Features**: Line items, tax, tip calculations
- **Purpose**: Show clean, successful parsing

#### 2. Handwritten Receipt (WOW Moment!)
- **Example**: Small business hand-written receipt
- **Format**: Photo with good lighting
- **Purpose**: Demonstrate Claude can read handwriting
- **Pro Tip**: Pre-test this! Ensure handwriting is legible

#### 3. PDF Receipt (Format Flexibility)
- **Example**: Anthropic API invoice, airline receipt
- **Format**: PDF file
- **Purpose**: Show document format support
- **Note**: Model supports PDFs natively with `type: 'document'`

#### 4. Edge Cases (Optional)
- **Faded receipt**: For `partial` status demo
- **Non-receipt image**: For `not_a_receipt` status demo
- **Poor quality**: For `unreadable` status with suggestions

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
    "category": "food",
    "items": [...],
    "confidence": "high"
  },
  "notes": "Clear restaurant receipt..."
}
```

### POST /api/parse/chain
**Chain approach** - LangChain orchestrated (3 steps)

**Request:**
```bash
curl -X POST http://localhost:3001/api/parse/chain \
  -F "receipt=@chicken-fiesta-receipt.jpg"
```

**Response:** (Same structure as simple approach)

**Performance Comparison:**
- Simple: ~2-3 seconds
- Chain: ~4-6 seconds (3 separate LLM calls)

---

## Troubleshooting

### Backend Won't Start

**Error**: `Missing Anthropic API key`
```bash
# Solution: Check .env file
cat .env | grep ANTHROPIC_API_KEY

# Should output: ANTHROPIC_API_KEY=sk-ant-...
# If missing, add it:
echo "ANTHROPIC_API_KEY=your-key-here" >> .env
```

### PDF Upload Fails

**Error**: `Only image files are allowed`
```typescript
// Check multer configuration accepts PDFs
fileFilter: (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  if (!isImage && !isPdf) {
    return cb(new Error('Only image and PDF files are allowed'));
  }
  cb(null, true);
}
```

### Zod Validation Errors

**Error**: `Expected number, received undefined`

**Common causes:**
1. **Zero values treated as falsy**: Use `??` not `||`
   ```typescript
   // ❌ Wrong
   price: item.price || item.amount  // Fails when price = 0

   // ✅ Correct
   price: item.price ?? item.amount  // Works with 0
   ```

2. **Field name mismatch**: Add transformation
   ```typescript
   description: item.description || item.name,
   ```

### Opik Tracing Not Working

**Issue**: No traces appearing in local Opik

**Check:**
```bash
# 1. Is Opik running?
curl http://localhost:5173/api/health

# 2. Check environment config
cat .env | grep OPIK

# Should have:
OPIK_ENABLED=true
OPIK_URL_OVERRIDE=http://localhost:5173/api
OPIK_PROJECT_NAME=demo2-receipts

# 3. Check logs for initialization
# Should see: "✓ Opik observability enabled (local mode: ...)"
```

---

## Demo Flow (15-20 minutes)

### Part 1: Show Traditional Approach (2 min)
**Talk through** the brittle regex approach:
- Format-specific rules
- Breaks on new formats
- Can't handle images
- Can't handle handwriting

### Part 2: Simple Approach Demo (5 min)
**Upload 2-3 different receipts:**
1. Restaurant receipt → Parse successfully
2. PDF invoice → Parse successfully
3. Show structured JSON output

**Key point**: Same code, any format!

### Part 3: WOW Moment - Handwritten Receipt (3 min)
1. Show a handwritten receipt
2. Upload it
3. Parse it perfectly
4. **Audience reaction**: "It reads handwriting?!"

### Part 4: Live Code - Tax Percentage (5 min)
See "Live Coding Section 1" above

### Part 5: Business Rules Discussion (3 min)
Talk through fraud detection, tip validation examples

### Part 6: Simple vs Chain Comparison (2 min)
Explain decision tree for when to use each approach

---

## Key Takeaways

### What We Learned
1. **Multimodal AI is transformative** - Claude can "see" and understand documents
2. **Simple often wins** - Don't over-engineer with chains
3. **Structure constrains hallucinations** - Zod schemas ensure valid outputs
4. **Handle edge cases explicitly** - Discriminated unions force completeness
5. **GenAI + Business Rules** - Combine LLM intelligence with programmatic validation

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

## Additional Resources

- [Claude Vision API Docs](https://docs.anthropic.com/en/docs/vision)
- [Zod Documentation](https://zod.dev/)
- [LangChain.js v1 Migration](https://js.langchain.com/docs/versions/v1)
- [Opik Observability](https://www.comet.com/docs/opik/)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

---

**Demo Duration**: 15-20 minutes
**Audience**: Developers familiar with TypeScript/JavaScript
**Prerequisites**: Demo 1 (introduces structured outputs and Zod)
