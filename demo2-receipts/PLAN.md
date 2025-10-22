# Demo 2: Smart Receipt Parsing - Planning Document

## Overview
Demonstrate vision + structured output for receipt parsing, contrasting traditional brittle parsing with AI flexibility. Show both simple (single call) and orchestrated (LangChain) approaches.

**Duration**: 15-20 minutes
**Format**: Live demo + live coding (tax percentage)

## Core Message
"Vision + Structured Output makes the impossible trivial"

## Objectives
1. Show brittleness of traditional text-only parsing
2. Demonstrate multimodal AI handling ANY format (printed, handwritten, photos)
3. Live code adding computed fields (tax percentage)
4. Teach when/why to use simple vs orchestrated approaches
5. Deliver "wow" moment with handwritten receipt

## The Problem

**Traditional Parsing (Before):**
- Regex/rules for TEXT-ONLY receipts
- Format-specific, brittle logic
- Can't handle images at all
- 100+ lines of if/else statements
- Breaks on new formats
- Manual extraction for each field
- No handling of handwritten content

**What we need:**
- Handle any format: grocery, restaurant, retail
- Parse printed AND handwritten receipts
- Extract structured data reliably
- Adapt to new formats automatically
- Calculate derived fields (like tax %)

## Implementations (Two Approaches)

### Implementation 1: Simplified & Safer (PRIMARY DEMO)
**Single Claude Vision API call with structured output**

```typescript
const result = await generateObject({
  model: azure('claude-3-5-sonnet'),
  schema: ReceiptParseResultSchema,
  prompt: `Analyze this image and extract receipt data.

  Rules:
  - If this is clearly a receipt, parse it and return status: "success"
  - If image quality is poor but you can read some fields, return status: "partial" with what you found
  - If this is not a receipt (e.g., a document, random image), return status: "not_a_receipt"
  - If image is completely unreadable, return status: "unreadable" with suggestions

  For successful/partial parsing:
  - Return all amounts as numbers
  - Date in ISO format (YYYY-MM-DD)
  - Categorize based on merchant type
  - Calculate tax percentage: (tax/subtotal)*100
  - Set confidence level: high (clear), medium (some uncertainty), low (poor quality)
  - If handwritten, read carefully

  For partial success:
  - List which fields you couldn't read
  - Explain why (e.g., "bottom of receipt is faded")
  - Suggest what user could do (e.g., "retake photo with better lighting")

  For errors:
  - Be specific about what went wrong
  - Provide actionable suggestions`,
  image: receiptImage
});

// Handle the different response types
if (result.object.status === 'success') {
  return {
    receipt: result.object.receipt,
    notes: result.object.notes
  };
} else if (result.object.status === 'partial') {
  return {
    receipt: result.object.receipt,
    warning: result.object.message,
    missingFields: result.object.missingFields,
    suggestions: result.object.suggestions
  };
} else if (result.object.status === 'not_a_receipt') {
  return {
    error: result.object.reason,
    suggestion: result.object.suggestion
  };
} else {
  return {
    error: result.object.reason,
    suggestions: result.object.suggestions
  };
}
```

**Benefits:**
- ✅ Single API call (fast, simple)
- ✅ Claude's vision + reasoning in one step
- ✅ Lower latency, fewer failure points
- ✅ Easier to explain
- ✅ Production-ready
- ✅ Graceful error handling with actionable feedback

**When to use:**
- Simple, direct tasks
- Speed matters
- Single model can handle everything
- Lower cost/complexity preferred

**Example Responses:**

**Success Case:**
```json
{
  "status": "success",
  "receipt": {
    "merchant": "Joe's Coffee Shop",
    "date": "2024-10-15",
    "tax": 1.13,
    "total": 13.63,
    "confidence": "high"
  },
  "notes": "Handwritten receipt, all fields clearly legible"
}
```

**Partial Case:**
```json
{
  "status": "partial",
  "receipt": {
    "merchant": "Corner Store",
    "total": 25.43,
    "confidence": "medium"
  },
  "missingFields": ["date", "tax", "items"],
  "message": "Bottom portion of receipt is faded and unreadable",
  "suggestions": [
    "Retake photo with better lighting",
    "Try to flatten the receipt",
    "Take photo from directly above"
  ]
}
```

**Not a Receipt Case:**
```json
{
  "status": "not_a_receipt",
  "reason": "This appears to be an invoice or bill, not a point-of-sale receipt",
  "suggestion": "Please upload a receipt from a purchase transaction"
}
```

**Unreadable Case:**
```json
{
  "status": "unreadable",
  "reason": "Image is too blurry and dark to read any text",
  "suggestions": [
    "Take photo in better lighting",
    "Hold camera steady to avoid blur",
    "Move closer to the receipt",
    "Clean the camera lens"
  ]
}
```

### Implementation 2: LangChain Orchestration (TEACHING MOMENT)
**Multi-step chain with different models**

```typescript
// Step 1: Vision extraction (Claude)
const visionChain = RunnableLambda.from(async (input) => {
  return await azure('claude-3-5-sonnet').invoke([
    { type: 'text', text: 'Extract all text from this receipt image' },
    { type: 'image', image: input.image }
  ]);
});

// Step 2: Structured parsing (GPT-4o)
const parsingChain = RunnableLambda.from(async (extractedText) => {
  return await generateObject({
    model: azure('gpt-4o'),
    schema: ReceiptSchema,
    prompt: `Parse this receipt text into structured data: ${extractedText}`
  });
});

// Step 3: Categorization/enrichment (could be another model)
const enrichmentChain = RunnableLambda.from(async (receipt) => {
  // Add business logic, categorization, validation
  return { ...receipt, enriched: true };
});

// Chain them together
const fullChain = visionChain
  .pipe(parsingChain)
  .pipe(enrichmentChain);

const result = await fullChain.invoke({ image: receiptImage });
```

**Benefits:**
- ✅ Different models for different strengths
- ✅ Claude for vision, GPT-4o for parsing
- ✅ Modular, testable components
- ✅ Can insert business logic between steps
- ✅ Retry/fallback strategies per step
- ✅ Better observability (see each step)

**When to use:**
- Complex workflows
- Need different models' strengths
- Business logic between LLM calls
- Advanced error handling/retries
- Team collaboration (different devs per step)

## Demo Flow

### Part 1: The "Before" - Traditional Parsing (3 min)
Show pseudo code for brittle text parsing:

```typescript
// Traditional approach - PSEUDO CODE
function parseReceipt(text: string): Receipt {
  // Assume specific format
  const lines = text.split('\n');

  // Find total - fragile!
  const totalLine = lines.find(l =>
    l.includes('Total') || l.includes('TOTAL')
  );
  const total = parseFloat(
    totalLine?.match(/\$?(\d+\.\d{2})/)?.[1] || '0'
  );

  // Find date - breaks on different formats!
  const dateLine = lines.find(l =>
    /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(l)
  );
  // ... 50 more lines of brittle regex ...

  // Can't handle images at all!
  // Can't handle handwritten!
  // Breaks on new formats!

  return { total, /* ... */ };
}
```

**Talking points:**
- Only works for text input
- Format-specific assumptions
- Breaks easily
- Can't handle images/handwriting
- No error handling - just crashes or returns garbage
- High maintenance cost

### Part 2: Implementation 1 - Simplified (5-7 min)
Demo the single Claude Vision call:

1. **Show 3 different printed receipts** (success cases)
   - Grocery (standard format) → `status: "success"`, `confidence: "high"`
   - Restaurant (different layout) → `status: "success"`, `confidence: "high"`
   - Retail (noisy with ads) → `status: "success"`, `confidence: "medium"`
2. All parse perfectly with SAME code
3. Show structured JSON output
4. "Same code, any format!"

5. **OPTIONAL: Show error handling** (if time permits)
   - Upload faded receipt → `status: "partial"` with missing fields + suggestions
   - Show how system provides actionable feedback
   - "Not just success/fail - intelligent degradation!"

### Part 3: The "WOW" - Handwritten Receipt (3 min)
1. Pull out pre-prepared handwritten receipt photo
2. "Let's see if it can handle this..."
3. Run through same code
4. Show perfect parsing
5. Audience reaction: "It reads handwriting?!"

### Part 4: Live Code - Tax Percentage (5 min)
**Main teaching moment for structured outputs**

1. Show current ReceiptSchema
2. "Let's add tax percentage calculation"
3. Add to schema:
```typescript
taxPercentage: z.number().optional()
```
4. Update prompt: "Calculate tax percentage: (tax/subtotal)*100, round to 2 decimals"
5. Re-run a receipt
6. Show output now includes computed field
7. **Key point**: LLM does math and derives data!

### Part 5: LangChain Alternative (3-4 min)
**Teaching moment for orchestration**

1. "That was simple, one call. But what if we need more control?"
2. Show LangChain chained version side-by-side
3. Walk through each step in the chain
4. **Key teaching points:**
   - When to use simple vs orchestrated
   - LangChain value: modularity, observability, different models
   - Trade-offs: complexity vs flexibility

**Decision tree for audience:**
```
Simple task? → Single call (Implementation 1)
Complex workflow? → LangChain (Implementation 2)
Need different models? → LangChain
Need business logic between steps? → LangChain
```

## Technical Implementation

### Tech Stack
- **Frontend**: Angular (file upload, display results)
- **Backend**: Node.js
- **Schema Validation**: Zod
- **LLM**: Azure OpenAI (Claude 3.5 Sonnet + GPT-4o)
- **AI Framework**: LangChain.js v1
- **Database**: Not needed (demo only)

### Receipt Schema (Zod)

```typescript
// The actual receipt data structure
const ReceiptDataSchema = z.object({
  merchant: z.string(),
  date: z.string(), // ISO format
  subtotal: z.number().optional(),
  tax: z.number(),
  taxPercentage: z.number().optional(), // 👈 Live code this!
  total: z.number(),
  category: z.enum(['food', 'retail', 'office', 'travel', 'entertainment', 'other']),
  items: z.array(z.object({
    description: z.string(),
    price: z.number(),
    quantity: z.number().optional()
  })).optional(),
  paymentMethod: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional() // How confident in the parsing
});

// Wrapper to handle success, partial success, and error cases
const ReceiptParseResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    receipt: ReceiptDataSchema,
    notes: z.string().optional() // Any parsing notes
  }),
  z.object({
    status: z.literal('partial'),
    receipt: ReceiptDataSchema, // What we could parse
    missingFields: z.array(z.string()), // What we couldn't read
    message: z.string(), // Why partial (e.g., "Image quality poor in bottom section")
    suggestions: z.array(z.string()).optional() // What user could do
  }),
  z.object({
    status: z.literal('not_a_receipt'),
    reason: z.string(), // What we think this is instead
    suggestion: z.string().optional() // What to do
  }),
  z.object({
    status: z.literal('unreadable'),
    reason: z.string(), // Why we can't read it
    suggestions: z.array(z.string()) // How to improve (better lighting, retake photo, etc.)
  })
]);
```

### Sample Receipts to Prepare

#### Receipt 1: Grocery Store (Printed) - SUCCESS
- Standard format, clear print
- Multiple items with prices
- Clear tax line
- Easy baseline
- **Expected**: `status: "success"`, `confidence: "high"`

#### Receipt 2: Restaurant (Printed) - SUCCESS
- Different layout from grocery
- Tip line, subtotal, tax breakdown
- Shows format flexibility
- Tests date format variation
- **Expected**: `status: "success"`, `confidence: "high"`

#### Receipt 3: Retail - CVS/Target (Printed) - SUCCESS
- Long receipt with ads/coupons
- Tests noise filtering
- Different date format
- Multiple sections
- **Expected**: `status: "success"`, `confidence: "medium"` (lots of noise)

#### Receipt 4: Handwritten (THE WOW) - SUCCESS
**Pre-write before presentation, take clear photo**

```
       Joe's Coffee Shop
          12/15/2024

2x Coffee                $8.00
1x Muffin                $4.50
                      --------
Subtotal                $12.50
Tax                      $1.13
                      --------
Total                   $13.63

       Thanks! ☕
```

**Writing tips:**
- Clear but natural handwriting
- Include some character (coffee emoji, underlines)
- Make it readable but authentic
- Take photo in good lighting
- Test it beforehand!
- **Expected**: `status: "success"`, `confidence: "high"`, `notes: "Handwritten receipt parsed successfully"`

#### Receipt 5: Faded/Worn Receipt (OPTIONAL) - PARTIAL
**For demonstrating partial success**
- Use an old receipt with faded bottom section
- Top is readable (merchant, some items)
- Bottom is illegible (tax, total faded)
- **Expected**: `status: "partial"`, `missingFields: ["tax", "total"]`, suggestions for better photo

#### Receipt 6: Not a Receipt (OPTIONAL) - ERROR
**For demonstrating "not_a_receipt" handling**
- Use an invoice, bill, or shipping label
- **Expected**: `status: "not_a_receipt"`, `reason: "This is an invoice/bill/shipping label"`

#### Receipt 7: Very Blurry Image (OPTIONAL) - ERROR
**For demonstrating "unreadable" handling**
- Intentionally blurry photo
- **Expected**: `status: "unreadable"`, suggestions for retaking photo

### Parsing Challenges Highlighted

**Successfully Handled:**
1. **Format Variety**: Grocery vs restaurant vs retail layouts
2. **Layout Differences**: Tax at top vs bottom, different sections
3. **Noise**: Ads, coupons, return policies, barcodes
4. **Date Formats**: MM/DD/YYYY vs DD/MM/YYYY vs written out
5. **Handwritten**: The ultimate flexibility test
6. **Computed Fields**: Tax percentage calculation

**Graceful Error Handling:**
7. **Partial Data**: Poor image quality → returns what it can read + asks for better photo
8. **Wrong Document Type**: Invoice instead of receipt → helpful error message
9. **Unreadable Images**: Blurry/dark → actionable suggestions (better lighting, retake, etc.)
10. **Confidence Levels**: High/medium/low confidence in parsing accuracy
11. **Missing Fields**: Explicitly lists what couldn't be read and why

### Components to Build

**Frontend (Angular):**
- File upload component
- Receipt display component (shows parsed data)
- Error/warning display component (for partial/error cases)
- Success/partial/error state indicators
- Suggestions list component (actionable next steps)
- Missing fields indicator (what couldn't be read)
- JSON output viewer
- Side-by-side comparison view
- Live code editor (for showing tax % addition)

**Backend (Node.js):**
1. `/api/parse-receipt-simple` - Implementation 1 endpoint (with error handling)
2. `/api/parse-receipt-chain` - Implementation 2 endpoint
3. Receipt schema definitions (including result wrapper)
4. LangChain setup and chains

## Live Coding: Tax Percentage

**Pre-demo state:**
```typescript
const ReceiptSchema = z.object({
  merchant: z.string(),
  date: z.string(),
  subtotal: z.number().optional(),
  tax: z.number(),
  // taxPercentage: NOT HERE YET
  total: z.number(),
  category: z.enum(['food', 'retail', 'office', 'travel', 'other']),
});
```

**Live additions:**
1. Add to schema: `taxPercentage: z.number().optional()`
2. Update prompt: Add "Calculate tax percentage as (tax/subtotal)*100, round to 2 decimals"
3. Re-run same receipt
4. Show JSON output now includes `taxPercentage: 9.04`

**Teaching moment:**
- LLMs can do math
- Can derive fields from other fields
- Structured outputs enforce this
- Same pattern as Demo 1 (query parsing)

## Talking Points

### Why This Matters
1. **Vision is a Game Changer**: Text-only → multimodal opens new possibilities
2. **Structured Outputs**: No more parsing LLM responses, type-safe data
3. **Format Agnostic**: Write once, works everywhere
4. **Maintenance**: New format? No code changes needed
5. **Handwritten**: The impossible becomes trivial
6. **Intelligent Error Handling**: System knows when it can't read something and tells you why
7. **Actionable Feedback**: Not just "error" - specific suggestions for fixing issues
8. **Partial Success**: Can extract what's readable even if some fields are illegible
9. **Confidence Levels**: Transparency about parsing certainty
10. **Architectural Choice**: Simple vs orchestrated - pick what fits your needs

### LangChain Value Prop
- **Modularity**: Different models for different strengths
- **Observability**: See each step in the pipeline
- **Flexibility**: Insert business logic between LLM calls
- **Error Handling**: Retry/fallback per step
- **Team Collaboration**: Different devs own different steps

### When to Use What
| Scenario | Approach |
|----------|----------|
| Simple, direct task | Single call (Impl 1) |
| Need different models' strengths | LangChain (Impl 2) |
| Complex workflow | LangChain (Impl 2) |
| Business logic between steps | LangChain (Impl 2) |
| Speed/cost critical | Single call (Impl 1) |
| Team collaboration | LangChain (Impl 2) |

## Success Criteria

By the end, audience should understand:
- How vision + structured output transforms parsing
- When to use simple vs orchestrated approaches
- How to add computed fields to schemas
- The power of LLMs for "impossible" tasks (handwriting)
- **Production-ready error handling** (success/partial/error states)
- **Discriminated unions for multi-state responses** (just like Demo 1)
- **Providing actionable feedback** when things go wrong
- **Confidence levels** and transparency in AI systems
- LangChain's value for complex workflows
- Trade-offs: simplicity vs flexibility

## Risk Mitigation

1. **Pre-test everything**: All receipts tested beforehand
2. **Backup screenshots**: Have JSON outputs ready if API fails
3. **Fallback narrative**: "This usually works, here's the output..."
4. **No live audience receipts**: Too unpredictable
5. **Handwritten receipt**: Pre-prepared, tested photo
6. **Keep it simple**: Don't over-engineer the LangChain example

## Notes
- Simplified approach is primary demo (low risk)
- LangChain is teaching moment (bonus content)
- Focus on before/after contrast
- Tax percentage live coding is the "aha moment"
- Handwritten receipt is the "wow moment"
- 15-20 minutes total - pace accordingly
- Have fun with the handwritten receipt reveal!
