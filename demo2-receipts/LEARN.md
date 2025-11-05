# Demo 2: Receipt Parsing with Vision - Learning Guide

## 🎯 Learning Objectives

By completing this demo, you'll learn how to:
- Use multimodal AI (Claude Vision) for image + text analysis
- Parse unstructured visual data into structured formats
- Handle multiple document formats with a single solution
- Implement discriminated unions for response states
- Choose between simple vs orchestrated approaches

## 📖 Overview

This demo shows how GenAI with vision capabilities can replace brittle regex-based parsers with a flexible, format-agnostic solution.

**The Transformation:**
- **Before**: Regex patterns for specific formats (breaks on variations), text-only
- **After**: Vision AI that handles ANY format (grocery, restaurant, retail, handwritten)

## 🏗️ Architecture

The system provides **two implementations**:

### Implementation 1: Simple (Recommended)
- **Single Claude Vision API call**
- **Fast and reliable**
- **Production-ready**
- **Location**: `backend/src/services/vision.service.ts`

### Implementation 2: Orchestrated (Educational)
- **Multi-step LangChain workflow**
- **Shows when orchestration adds value**
- **More complex but more observable**
- **Location**: `backend/src/services/chain.service.ts`

**Tech Stack**:
- Frontend: Angular with file upload
- Backend: Node.js + Express
- Vision AI: Claude 3.5 Sonnet
- Validation: Zod schemas

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Anthropic API key (for Claude Vision)
- Basic understanding of async/await

### Setup

1. Navigate to backend:
   ```bash
   cd demo2-receipts/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```

5. Start backend:
   ```bash
   npm run dev
   ```

6. Start frontend (new terminal):
   ```bash
   cd demo2-receipts/frontend
   npm install
   npm start
   ```

7. Open http://localhost:4201

## 📚 Implementation Exercises

### Exercise 1: Create the Receipt Schema

**Goal**: Define a Zod schema that handles receipt data with multiple response states.

**Location**: `backend/src/schemas/receipt.schema.ts`

**Your Task**:
Create a discriminated union schema with four states:

1. **Success** - Complete receipt parsed
   - Fields: `merchantName`, `date`, `items[]`, `subtotal`, `tax`, `total`
   - Items have: `name`, `quantity`, `price`

2. **Partial** - Some fields missing or unclear
   - Same fields as success, but all optional
   - Include `missingFields` array
   - Include `issues` description

3. **Not a Receipt** - Image doesn't contain a receipt
   - Include `reason` and `detectedContent`

4. **Unreadable** - Image quality too poor
   - Include `reason` and optional `suggestions`

**Starter Code**:
```typescript
import { z } from 'zod';

const ReceiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number().optional(),
  price: z.number()
});

// TODO: Create ReceiptDataSchema with all fields

// TODO: Create discriminated union for all states
const ReceiptParseResultSchema = z.discriminatedUnion('status', [
  // success, partial, not_a_receipt, unreadable
]);
```

**Why This Matters**: Receipts vary wildly in quality and format. Handling partial success gracefully provides better UX than all-or-nothing parsing.

---

### Exercise 2: Implement Basic Vision Parsing

**Goal**: Use Claude Vision to extract receipt data from images.

**Location**: `backend/src/services/vision.service.ts`

**Your Task**:
Implement the `parseReceipt` function:

1. **Load the image** from the provided path
2. **Convert to base64** for API transmission
3. **Call Claude Vision** with the image
4. **Parse response** against your Zod schema

**Starter Code**:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export async function parseReceipt(imagePath: string) {
  // TODO: Read image file
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // TODO: Determine image type (jpeg, png, etc.)
  const imageType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  // TODO: Call Claude Vision API
  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageType,
              data: base64Image
            }
          },
          {
            type: 'text',
            text: 'Extract receipt data from this image...' // TODO: Complete prompt
          }
        ]
      }
    ]
  });

  // TODO: Parse and validate response
}
```

**Test It**:
```bash
curl -X POST http://localhost:3001/api/receipts/parse-simple \
  -F "receipt=@sample-receipts/receipt.jpg"
```

---

### Exercise 3: Build the Vision Prompt

**Goal**: Create a prompt that guides Claude to extract structured receipt data.

**Your Task**:
Write a comprehensive prompt that:

1. **Describes the task** - Extract receipt information
2. **Specifies the schema** - List all expected fields
3. **Handles edge cases** - Missing info, unclear text, non-receipts
4. **Returns structured JSON** - Matching your Zod schema

**Prompt Template**:
```typescript
const prompt = `Analyze this image and extract receipt information.

IMPORTANT: Your response must be valid JSON matching one of these structures:

1. SUCCESS (complete receipt):
{
  "status": "success",
  "data": {
    "merchantName": "Store Name",
    "date": "YYYY-MM-DD",
    "items": [
      {"name": "Item", "quantity": 1, "price": 9.99}
    ],
    "subtotal": 9.99,
    "tax": 0.80,
    "total": 10.79
  }
}

2. PARTIAL (some fields missing):
{
  "status": "partial",
  "data": { /* whatever you can extract */ },
  "missingFields": ["tax", "date"],
  "issues": "Date is illegible due to fading"
}

3. NOT A RECEIPT:
{
  "status": "not_a_receipt",
  "reason": "This image contains...",
  "detectedContent": "menu" | "invoice" | "other"
}

4. UNREADABLE:
{
  "status": "unreadable",
  "reason": "Image is too blurry",
  "suggestions": ["Take photo in better lighting"]
}

Rules:
- Dates must be YYYY-MM-DD format
- Prices should be numbers (not strings)
- If you can't read something, mark as partial
- Be helpful in error messages

Return ONLY the JSON, no other text.`;
```

**Why This Matters**: Clear instructions with examples dramatically improve structured output quality.

---

### Exercise 4: Add Computed Fields

**Goal**: Have the LLM calculate derived fields like tax percentage.

**Your Task**:

1. **Add to schema**:
   ```typescript
   taxPercentage: z.number().optional() // e.g., 8.0 for 8%
   ```

2. **Update prompt**:
   ```
   - Calculate taxPercentage as (tax / subtotal) * 100
   - Round to 2 decimal places
   ```

3. **Test with receipts** that have different tax rates

**Example Output**:
```json
{
  "status": "success",
  "data": {
    "merchantName": "Grocery Store",
    "subtotal": 50.00,
    "tax": 4.00,
    "taxPercentage": 8.0,
    "total": 54.00
  }
}
```

**Why This Matters**: LLMs can compute derived fields that would require complex logic in traditional code.

---

### Exercise 5: Handle Handwritten Receipts

**Goal**: Test the flexibility of vision AI with handwritten text.

**Your Task**:

1. **Take a photo** of a handwritten receipt or use `sample-receipts/hand-written.png`

2. **Test the parser**:
   ```bash
   curl -X POST http://localhost:3001/api/receipts/parse-simple \
     -F "receipt=@sample-receipts/hand-written.png"
   ```

3. **Observe the results** - What fields were extracted? What was marked partial?

4. **Improve the prompt** if needed:
   ```
   - Handle handwritten text carefully
   - If handwriting is unclear, mark those fields in "issues"
   - Make best effort but don't guess wildly
   ```

**Expected Behavior**:
- Should return `status: "success"` or `status: "partial"`
- Partial results should list which fields were unclear
- Should NOT fail completely unless truly unreadable

**Why This Matters**: Vision AI handles variability that would break traditional OCR + regex approaches.

---

### Exercise 6 (Advanced): Implement the Orchestrated Approach

**Goal**: Build a multi-step LangChain workflow for receipt parsing.

**Location**: `backend/src/services/chain.service.ts`

**Your Task**:
Create a 3-step chain:

**Step 1: Analyze Image**
- Determine if it's a receipt
- Check image quality
- Return: `{ isReceipt: boolean, isReadable: boolean, reason?: string }`

**Step 2: Extract Text (if valid)**
- Use Claude Vision to extract all visible text
- Return raw extracted data

**Step 3: Structure Data**
- Parse raw text into schema-compliant JSON
- Handle missing fields gracefully

**Chain Structure**:
```typescript
import { RunnableLambda, RunnableSequence } from '@langchain/core/runnables';

const analyzeImageChain = RunnableLambda.from(async (input: { imagePath: string }) => {
  // TODO: Check if receipt and if readable
  return { ...input, isReceipt: true, isReadable: true };
});

const extractTextChain = RunnableLambda.from(async (input) => {
  if (!input.isReceipt || !input.isReadable) {
    return input; // Skip extraction
  }
  // TODO: Extract text from image
  return { ...input, extractedText: "..." };
});

const structureDataChain = RunnableLambda.from(async (input) => {
  if (!input.extractedText) {
    // Return appropriate error state
  }
  // TODO: Convert extracted text to structured format
  return { status: 'success', data: {...} };
});

export const receiptParsingChain = RunnableSequence.from([
  analyzeImageChain,
  extractTextChain,
  structureDataChain
]);
```

**When to Use This Approach**:
- ✅ Need detailed logging/observability
- ✅ Want to plug into LangSmith tracing
- ✅ Each step requires different models
- ✅ Steps can be reused in other workflows
- ❌ Simple tasks (use single call instead)

**Test Both Approaches**:
```bash
# Simple (single call)
curl -X POST http://localhost:3001/api/receipts/parse-simple \
  -F "receipt=@sample-receipts/receipt.jpg"

# Orchestrated (multi-step)
curl -X POST http://localhost:3001/api/receipts/parse-chain \
  -F "receipt=@sample-receipts/receipt.jpg"
```

**Compare**:
- Latency (simple should be faster)
- Code complexity (simple is clearer)
- Observability (chain gives more insight)

---

## 🎓 Key Concepts Explained

### Multimodal AI
Models that understand multiple input types:
- **Text**: Read printed and handwritten words
- **Layout**: Understand table structures, headers
- **Visual Context**: Distinguish receipts from menus

### Vision Prompting
Best practices:
1. **Be specific** about format requirements
2. **Provide examples** of desired JSON output
3. **Handle ambiguity** with partial states
4. **Guide on edge cases** (faded text, torn paper)

### Simple vs Orchestrated

**Use Simple When**:
- Task is straightforward
- Single model call suffices
- Speed matters
- Production simplicity desired

**Use Orchestrated When**:
- Complex multi-step logic
- Different models per step
- Observability requirements
- Reusable components needed

## 📝 Testing Suite

### Test Receipts Provided

1. **Printed Grocery Receipt** (`1-aws-receipt.png`)
   - Clear, standard format
   - Should parse completely

2. **Restaurant Receipt** (`receipt.jpg`)
   - Includes tip line
   - Multiple tax lines possible

3. **Handwritten Receipt** (`hand-written.png`)
   - Tests OCR capabilities
   - May return partial results

4. **Faded Receipt** (create your own)
   - Tests partial handling
   - Should identify missing fields

5. **Non-Receipt** (use any other image)
   - Tests "not_a_receipt" state
   - Should identify what it actually is

### Test Scenarios

```bash
# 1. Perfect case
curl -X POST http://localhost:3001/api/receipts/parse-simple \
  -F "receipt=@sample-receipts/receipt.jpg"
# Expected: status="success", all fields populated

# 2. Handwritten
curl -X POST http://localhost:3001/api/receipts/parse-simple \
  -F "receipt=@sample-receipts/hand-written.png"
# Expected: status="success" or "partial", some fields may be unclear

# 3. Non-receipt
curl -X POST http://localhost:3001/api/receipts/parse-simple \
  -F "receipt=@path/to/random-image.jpg"
# Expected: status="not_a_receipt", helpful reason

# 4. Compare approaches
# Simple
time curl -X POST http://localhost:3001/api/receipts/parse-simple \
  -F "receipt=@sample-receipts/receipt.jpg"

# Chain
time curl -X POST http://localhost:3001/api/receipts/parse-chain \
  -F "receipt=@sample-receipts/receipt.jpg"
# Compare latency and response detail
```

## 🔍 Reference Implementation

Complete code available in:
- **Schema**: `backend/src/schemas/receipt.schema.ts`
- **Simple Service**: `backend/src/services/vision.service.ts`
- **Chain Service**: `backend/src/services/chain.service.ts`
- **Prompt**: `backend/src/shared/prompts/receipt.prompt.ts`
- **API Routes**: `backend/src/routes/receipt.routes.ts`

## 🎯 Success Criteria

You've completed this demo when:
- ✅ Can parse multiple receipt formats
- ✅ Handles handwritten receipts gracefully
- ✅ Returns partial results when appropriate
- ✅ Rejects non-receipts with helpful messages
- ✅ Computes derived fields (tax percentage)
- ✅ Understand simple vs orchestrated tradeoffs

## 🚀 Going Further

**Challenge Exercises**:

1. **Multi-Page Receipts**
   - Handle receipts split across multiple images
   - Combine data from front/back

2. **Receipt Categories**
   - Classify receipt type (grocery, restaurant, retail)
   - Extract category-specific fields (tip for restaurants)

3. **Expense Matching**
   - Match receipts to expense categories
   - Flag unusual amounts for review

4. **Receipt Validation**
   - Check if math adds up (subtotal + tax = total)
   - Flag suspicious values

5. **Batch Processing**
   - Process multiple receipts at once
   - Generate summary reports

**Production Considerations**:
- Add image size/format validation
- Implement retry logic for API failures
- Cache results to avoid re-processing
- Add rate limiting for API costs
- Store processed receipts in database
- Add audit logging for compliance

## 📚 Additional Resources

- [Claude Vision API Docs](https://docs.anthropic.com/claude/docs/vision)
- [LangChain Vision Guide](https://js.langchain.com/docs/integrations/chat/anthropic)
- [Multimodal Prompt Engineering](https://www.promptingguide.ai/techniques/multimodal)
- [Zod Schema Validation](https://zod.dev)

## 🆘 Troubleshooting

**Issue**: "API key not found"
- **Solution**: Check `.env` file has `ANTHROPIC_API_KEY=...`

**Issue**: Image not uploading
- **Solution**: Check file size (max 5MB), format (jpg/png)

**Issue**: Returns empty data
- **Solution**: Improve prompt with more examples and instructions

**Issue**: Always returns "not_a_receipt"
- **Solution**: Check image quality, try different receipt

**Issue**: Tax percentage incorrect
- **Solution**: Verify calculation prompt: `(tax / subtotal) * 100`

## 🎨 Frontend Integration

The Angular frontend shows:
- **File upload** with drag-and-drop
- **Preview** of uploaded image
- **Parsed results** with formatted display
- **Error handling** for all response states

Check `frontend/src/app/components/upload/` for implementation details.

---

**Ready to parse some receipts?** Start with Exercise 1 and work through each step. Have fun! 🧾
