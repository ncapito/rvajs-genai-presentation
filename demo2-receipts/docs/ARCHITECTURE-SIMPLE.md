# Demo 2 - Part 1: Simple Receipt Parsing

**Architecture Overview** - Single Vision API Call for Receipt Parsing

This document covers the **simple approach**: using a single Claude Vision API call to parse receipt images into structured data.

---

## 📊 High-Level Architecture

### BEFORE: Traditional Text-Only Parsing (Brittle)

```
┌─────────────┐
│   Frontend  │  Angular UI
│  (Angular)  │  - File upload
└──────┬──────┘  - Display parsed data
       │
       │ HTTP POST /api/parse/traditional
       │ FormData with TEXT RECEIPT (plain text only)
       ▼
┌─────────────┐
│   Backend   │  Node.js + Express
│  (Express)  │  - Regex-based parsing
└──────┬──────┘  - Format-specific rules
       │
       │ 100+ lines of regex/if-else
       ▼
┌─────────────────────────────────────┐
│  Traditional Text Parsing           │
│  ─────────────────────────────────  │
│  • Regex: /Total:\s*\$?(\d+\.\d+)/ │
│  • Regex: /Tax:\s*\$?(\d+\.\d+)/   │
│  • Regex: /Date:\s*(\d{2}\/\d{2})/ │
│  • 50+ format-specific patterns     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Fragile Output                     │
│  • Breaks on format changes         │
│  • Can't handle images              │
│  • Can't read handwriting           │
│  • Requires constant maintenance    │
└─────────────────────────────────────┘
```

**Key Limitations:**
- ❌ TEXT ONLY: Cannot process image files
- ❌ Format-specific: Breaks when receipt format changes
- ❌ Brittle: 100+ lines of regex that fail easily
- ❌ No handwriting: Can't parse handwritten receipts
- ❌ Maintenance nightmare: New format = new regex patterns
- ❌ No contextual understanding: Can't infer missing fields

---

### AFTER: Vision + Structured Output (Flexible)

```
┌─────────────┐
│   Frontend  │  Angular UI
│  (Angular)  │  - Image/PDF upload
└──────┬──────┘  - Display parsed data
       │
       │ HTTP POST /api/parse/simple
       │ FormData with IMAGE/PDF (any format!)
       ▼
┌─────────────┐
│   Backend   │  Node.js + Express
│  (Express)  │  - Vision service
└──────┬──────┘  - Single API call
       │
       │ Parse with Claude Vision + Zod
       ▼
┌─────────────────────────────────────┐
│  Claude Vision API (Single Call)    │
│  ─────────────────────────────────  │
│  Image → Structured Data             │
│  • Understands ANY receipt format    │
│  • Reads printed AND handwritten     │
│  • Validates with Zod schema         │
│  • Returns discriminated union       │
└─────────────────┬───────────────────┘
                  │
                  │ Returns ReceiptParseResult
                  ▼
┌─────────────────────────────────────┐
│  Intelligent Output                  │
│  • Handles any format automatically  │
│  • Reads handwriting                 │
│  • Graceful partial parsing          │
│  • Actionable error messages         │
└─────────────────────────────────────┘
```

**Key Advantages:**
- ✅ Multimodal: Processes images, PDFs, handwriting
- ✅ Format-agnostic: Works with ANY receipt layout
- ✅ Intelligent: Understands context, infers fields
- ✅ Computes derived fields: Tax percentage automatically
- ✅ Graceful degradation: Partial parsing with suggestions
- ✅ Simple: ~50 lines vs 100+ lines of regex
- ⚠️ Cost: ~$0.01 per receipt parse (vs $0 for regex)
- ⚠️ Latency: ~2-4 seconds (vs ~10ms for regex)

---

## 📋 Data Model

### Receipt Entity

```typescript
ReceiptData {
  merchant: string,              // Business name
  date: string,                  // ISO format: YYYY-MM-DD
  subtotal?: number,             // Amount before tax
  tax: number,                   // Tax amount
  taxPercentage?: number,        // Calculated: (tax/subtotal)*100
  total: number,                 // Final amount
  category: enum,                // 'food' | 'retail' | 'office' | 'travel' | 'entertainment' | 'other'
  items?: Array<{                // Line items (if available)
    description: string,
    price: number,
    quantity?: number
  }>,
  paymentMethod?: string,        // Credit card, cash, etc.
  confidence: enum               // 'high' | 'medium' | 'low'
}
```

**Example Receipt:**
```json
{
  "merchant": "Whole Foods Market",
  "date": "2025-10-28",
  "subtotal": 42.50,
  "tax": 3.83,
  "taxPercentage": 9.01,
  "total": 46.33,
  "category": "food",
  "items": [
    { "description": "Organic Bananas", "price": 3.99, "quantity": 2 },
    { "description": "Greek Yogurt", "price": 5.49, "quantity": 1 }
  ],
  "paymentMethod": "Visa ****1234",
  "confidence": "high"
}
```

---

## 🔗 Request Flow

### Simple Vision Parsing Flow

```
User Action: Upload receipt image/PDF
           │
           ▼
┌─────────────────────────────────────────────────┐
│  POST /api/parse/simple                         │
│  ────────────────────────────────────────────   │
│  Input:  FormData with file                     │
│  Does:   Validate file type (image/PDF)         │
│          Save to uploads/                       │
│  Calls:  visionService.parseReceipt()           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Vision Service (Single API Call)               │
│  ────────────────────────────────────────────   │
│  Input:  Image path                             │
│  Does:   Read file → base64                     │
│          Build prompt                           │
│          Call Claude Vision API                 │
│          Parse JSON response                    │
│          Validate with Zod schema               │
│  Output: ReceiptParseResult                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Handle Response by Status                      │
│  ────────────────────────────────────────────   │
│  Status: 'success'                              │
│    → Return receipt data + notes                │
│                                                  │
│  Status: 'partial'                              │
│    → Return partial data + missing fields       │
│                                                  │
│  Status: 'not_a_receipt'                        │
│    → Return error + suggestion                  │
│                                                  │
│  Status: 'unreadable'                           │
│    → Return error + actionable suggestions      │
└─────────────────────────────────────────────────┘
```

## 🧩 Component Breakdown

### Schemas (`schemas/`)

```
receipt.schema.ts
  ├─ ReceiptDataSchema
  │   ├─ merchant: string
  │   ├─ date: string (ISO format)
  │   ├─ subtotal?: number
  │   ├─ tax: number
  │   ├─ total: number
  │   ├─ category: enum
  │   ├─ items?: array
  │   ├─ paymentMethod?: string
  │   └─ confidence?: enum
  │
  └─ ReceiptParseResultSchema (Discriminated Union)
      ├─ Success: { status: 'success', receipt, notes }
      ├─ Partial: { status: 'partial', receipt, missingFields, message, suggestions }
      ├─ Not a Receipt: { status: 'not_a_receipt', reason, suggestion }
      └─ Unreadable: { status: 'unreadable', reason, suggestions }
```

### Services (`services/`)

```
vision.service.ts
  ├─ parseReceipt(imagePath)
  │   ├─ Read file and convert to base64
  │   ├─ Detect media type (image vs PDF)
  │   ├─ Build prompt (from prompts/)
  │   ├─ Call Claude Vision API
  │   ├─ Parse JSON response
  │   ├─ Validate with Zod
  │   └─ Return ReceiptParseResult
  │
  └─ getClient()
      └─ Lazy initialization of Anthropic client
```

### Prompts (`shared/prompts/`)

```
receipt.prompt.ts
  └─ buildReceiptPrompt()
      ├─ Instructions for parsing
      ├─ Schema field definitions
      ├─ Status selection rules
      ├─ Examples of each status
      └─ Safety/validation rules
```

**Prompt Structure:**
1. **Task**: "Analyze this image and extract receipt data"
2. **Rules**:
   - If clearly a receipt → status: "success"
   - If poor quality but readable → status: "partial"
   - If not a receipt → status: "not_a_receipt"
   - If completely unreadable → status: "unreadable"
3. **Field Instructions**:
   - Return amounts as numbers
   - Date in ISO format (YYYY-MM-DD)
   - Categorize based on merchant type
   - Calculate tax percentage: (tax/subtotal)*100
4. **Examples**: Show each status with sample outputs

### Routes (`routes/`)

```
receipt.routes.ts
  ├─ POST /api/parse/simple (PRIMARY DEMO)
  │   ├─ Multer file upload
  │   ├─ Validate file type (images + PDF)
  │   ├─ Call visionService.parseReceipt()
  │   ├─ Clean up uploaded file
  │   └─ Return result
  │
  ├─ POST /api/parse/chain (ADVANCED - not in Part 1)
  └─ POST /api/match/stream (ADVANCED - not in Part 1)
```

---

## 🎨 Prompt Engineering Strategy

### Vision Prompt Design

```typescript
// Simplified version for illustration
const prompt = `Analyze this image and extract receipt data.

IMPORTANT RULES:
- If this is clearly a receipt, parse it and return status: "success"
- If image quality is poor but you can read some fields, return status: "partial"
- If this is not a receipt, return status: "not_a_receipt"
- If completely unreadable, return status: "unreadable"

FIELD EXTRACTION:
- Return all amounts as numbers (not strings)
- Date must be in ISO format (YYYY-MM-DD)
- Categorize based on merchant type: food, retail, office, travel, entertainment, other
- Calculate taxPercentage: (tax / subtotal) * 100
- Set confidence level: high (clear), medium (some uncertainty), low (poor quality)

HANDLING HANDWRITING:
- Read handwritten text carefully
- If handwritten, note this in the 'notes' field
- Maintain high confidence if handwriting is clear

PARTIAL SUCCESS:
- List which fields you couldn't read in 'missingFields'
- Explain why in 'message' (e.g., "bottom of receipt is faded")
- Provide suggestions for improvement

RESPONSE FORMAT:
Return valid JSON matching the ReceiptParseResultSchema.`;
```

### Safety Features

```
✓ ACCEPTED INPUTS:
- Printed receipts (any format)
- Handwritten receipts
- Receipt photos
- Scanned receipt PDFs
- Multi-page PDFs (parse first page)

❌ REJECTED INPUTS:
- Invoices → status: 'not_a_receipt'
- Random documents → status: 'not_a_receipt'
- Completely illegible images → status: 'unreadable'

⚠️ PARTIAL PARSING:
- Faded sections → parse what's readable
- Missing items section → parse header/footer
- Poor lighting → best effort + suggestions
```

---

## 🛡️ Validation & Safety

### 1. Zod Schema Validation

```typescript
// Ensures LLM output matches expected structure
ReceiptDataSchema = z.object({
  merchant: z.string(),
  date: z.string(),  // Further validation: must be YYYY-MM-DD
  tax: z.number(),
  total: z.number(),
  category: z.enum(['food', 'retail', 'office', 'travel', 'entertainment', 'other']),
  // ... more fields
});
```

**Prevents:**
- Invalid data types
- Missing required fields
- Invalid enum values
- Malformed dates

### 2. File Upload Validation

```typescript
// Multer configuration
fileFilter: (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';

  if (!isImage && !isPdf) {
    return cb(new Error('Only image and PDF files allowed'));
  }
  cb(null, true);
}
```

**Prevents:**
- Malicious file uploads
- Unsupported formats
- Oversized files (10MB limit)

### 3. Discriminated Union Response

```typescript
// Explicit status handling prevents ambiguity
if (result.status === 'success') {
  // TypeScript knows result.receipt exists
  return { success: true, receipt: result.receipt };
} else if (result.status === 'partial') {
  // TypeScript knows result.missingFields exists
  return { warning: true, receipt: result.receipt, missing: result.missingFields };
}
// ... handle other statuses
```

**Benefits:**
- Type-safe response handling
- Exhaustive case checking
- Clear error messages
- Actionable user feedback

---

## 📊 Performance Characteristics

| Metric | Traditional Regex | Vision API | Notes |
|--------|------------------|------------|-------|
| Input Types | Text only | Images, PDFs, handwriting | Vision wins |
| Latency | ~10ms | ~2-4 seconds | Regex faster |
| Cost | $0 | ~$0.01/parse | Regex cheaper |
| Accuracy | 60-70% | 95%+ | Vision far better |
| Maintenance | High (constant updates) | Low (no code changes) | Vision saves time |
| Format Support | One at a time | Any format | Vision flexible |
| Handwriting | Impossible | Yes | Vision only |

**When to Use Which:**
- **Traditional Regex**: When you have perfect, consistent TEXT input
- **Vision API**: When handling real-world receipts (images, various formats)

**Optimization Opportunities:**
- Cache common merchant categorizations
- Batch multiple receipts in single request (if API supports)
- Use image compression before upload
- Implement retry logic for transient failures

---

## 🔬 Live Coding Demonstration

### Adding Tax Percentage Field

**Step 1: Show the Problem**
```typescript
// Current schema doesn't have taxPercentage
ReceiptDataSchema = z.object({
  merchant: z.string(),
  tax: z.number(),
  subtotal: z.number().optional(),
  total: z.number(),
  // ❌ No taxPercentage field
});
```

**Step 2: Add to Schema**
```typescript
// Add the new field
ReceiptDataSchema = z.object({
  merchant: z.string(),
  tax: z.number(),
  subtotal: z.number().optional(),
  taxPercentage: z.number().optional(), // 👈 NEW!
  total: z.number(),
});
```

**Step 3: Update Prompt**
```typescript
// In receipt.prompt.ts
const prompt = `...
FIELD EXTRACTION:
- Calculate taxPercentage: (tax / subtotal) * 100  // 👈 NEW INSTRUCTION!
- Round to 2 decimal places
...`;
```

**Step 4: Test**
```bash
# Upload a receipt with tax
curl -X POST http://localhost:3002/api/parse/simple \
  -F "receipt=@grocery-receipt.jpg"
```

**Expected Output:**
```json
{
  "status": "success",
  "receipt": {
    "merchant": "Whole Foods",
    "subtotal": 42.50,
    "tax": 3.83,
    "taxPercentage": 9.01,  // 👈 COMPUTED BY LLM!
    "total": 46.33
  }
}
```

**WOW Moment**: The LLM computed the tax percentage without us writing any calculation code!

---

## 🎯 Design Decisions

### Why Single API Call (Not Chains)?

**Simplicity wins for simple tasks:**
- ✓ One API call = fast, easy to debug
- ✓ No orchestration complexity
- ✓ Lower latency (no multiple round-trips)
- ✓ Sufficient for receipt parsing task

**When to use chains instead:**
- Need multiple LLM calls (e.g., parse → validate → categorize)
- Want explicit control over each step
- Need to integrate non-LLM logic between calls
- **See ARCHITECTURE-FULL.md for chain example**

### Why Claude Vision vs GPT-4V?

**Claude Vision Advantages:**
- Better structured output support
- Excellent at following complex instructions
- Strong schema adherence
- Good at handwriting recognition

**GPT-4V Advantages:**
- Slightly faster
- Better at some visual tasks (charts, diagrams)
- More training data

**Verdict**: Both work well; choice depends on your use case and existing stack.

### Why Discriminated Unions?

```typescript
// ❌ BAD: Flat structure
{ success?: boolean, receipt?: Receipt, error?: string, missing?: string[] }

// ✓ GOOD: Discriminated union
{ status: 'success', receipt, notes }
| { status: 'partial', receipt, missingFields, message, suggestions }
| { status: 'not_a_receipt', reason, suggestion }
| { status: 'unreadable', reason, suggestions }
```

**Benefits:**
- Type safety: TypeScript knows which fields exist
- Explicit states: No ambiguity about response type
- Exhaustive checking: Compiler ensures all cases handled
- Better UX: Clear, actionable error messages

---

## 🔍 Observability

### Logging Points
- File upload received: filename, size, type
- Vision API call: model, image size, request timestamp
- Parse result: status, confidence, fields extracted
- Errors: API failures, validation errors, file I/O issues

### Debug Information
```typescript
console.log('Parsing receipt:', req.file.originalname);
console.log('File size:', req.file.size, 'bytes');
console.log('API Response status:', result.status);
console.log('Confidence:', result.receipt?.confidence);
console.log('Took:', elapsed, 'ms');
```

### Metrics to Track
- Parse success rate by status
- Average latency per parse
- Cost per successful parse
- Most common categories
- Confidence distribution
- Error rate by type (not_a_receipt, unreadable, partial)

---

**Key Takeaway**: Demo 2 (Part 1) shows how **vision + structured output** makes previously impossible tasks trivial. A single API call with a well-designed prompt and schema replaces 100+ lines of brittle regex code, while handling images, handwriting, and any receipt format automatically.

## 🎬 Impact Summary

### Lines of Code
- **Before** (Regex parsing): ~150 lines
  - 50+ regex patterns
  - Format-specific logic
  - Error handling for each pattern
- **After** (Vision API): ~50 lines
  - Single API call
  - Schema validation
  - Unified error handling

### Capabilities
- **Before**: Text-only, one format at a time
- **After**: Images, PDFs, handwriting, any format

### Maintenance
- **Before**: Constant updates for new formats
- **After**: Zero maintenance, adapts automatically

### User Experience
- **Before**: Manual transcription if receipt is image
- **After**: Just take a photo and upload
