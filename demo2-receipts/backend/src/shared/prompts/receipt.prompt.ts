/**
 * Shared Receipt Parsing Prompt
 *
 * This prompt is used by both:
 * - vision.service.ts (Simple approach - single API call)
 * - chain.service.ts (Orchestrated approach - LangChain)
 *
 * Ensures consistency in extraction quality, rules, and error handling
 * across both approaches.
 */

/**
 * Build the comprehensive receipt parsing prompt
 *
 * Handles all response states:
 * - success: Clean, readable receipt
 * - partial: Some fields missing but recoverable
 * - not_a_receipt: Wrong document type
 * - unreadable: Image quality too poor
 */
export function buildReceiptPrompt(): string {
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  return `Analyze this receipt image and extract structured data.

CRITICAL: Respond with ONLY raw JSON. Do NOT wrap in markdown code blocks or use \`\`\`json formatting.
Return the JSON object directly without any additional text, explanations, or formatting.

IMPORTANT RULES:
- If this is clearly a receipt, parse it and return status: "success"
- If image quality is poor but you can read some fields, return status: "partial" with what you found
- If this is not a receipt (e.g., a document, random image), return status: "not_a_receipt"
- If image is completely unreadable, return status: "unreadable" with suggestions

For successful/partial parsing:
- Return all amounts as numbers (no currency symbols)
- Date in ISO format (YYYY-MM-DD) - if year is missing, use ${currentYear}
- merchant: string (just the name, e.g. "Starbucks")
- category: one of: "food", "retail", "office", "travel", "entertainment", "other"
  * food: restaurants, cafes, grocery stores
  * retail: clothing, electronics, general stores
  * office: office supplies, business services
  * travel: gas stations, airlines, hotels
  * entertainment: movies, events, recreation
  * other: anything else
- confidence: "high", "medium", or "low" based on image quality
- items (if visible): array of objects with "description" (string), "price" (number), "quantity" (number, optional)

For partial success:
- List which fields you couldn't read in missingFields array
- Explain why in message (e.g., "bottom of receipt is faded")
- Provide actionable suggestions in suggestions array

Current date: ${today}

EXACT JSON SCHEMA - Follow this structure precisely:

SUCCESS:
{
  "status": "success",
  "receipt": {
    "merchant": "Store Name",
    "date": "2025-10-31",
    "subtotal": 50.00,
    "tax": 4.50,
    "total": 54.50,
    "category": "food",
    "items": [
      {"description": "Coffee", "price": 5.50, "quantity": 2}
    ],
    "paymentMethod": "Credit Card",
    "confidence": "high"
  },
  "notes": "Optional notes"
}

PARTIAL:
{
  "status": "partial",
  "receipt": {
    "merchant": "Store Name",
    "date": "2025-10-31",
    "tax": 0,
    "total": 54.50,
    "category": "other",
    "confidence": "low"
  },
  "missingFields": ["subtotal", "items"],
  "message": "Bottom of receipt is faded",
  "suggestions": ["Retake photo with better lighting"]
}

NOT A RECEIPT:
{
  "status": "not_a_receipt",
  "reason": "This appears to be a menu, not a receipt",
  "suggestion": "Please upload an actual receipt"
}

UNREADABLE:
{
  "status": "unreadable",
  "reason": "Image is too blurry to read",
  "suggestions": ["Retake photo with better focus", "Ensure good lighting"]
}`;
}
