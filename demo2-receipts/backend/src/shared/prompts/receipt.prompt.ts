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

IMPORTANT RULES:
- If this is clearly a receipt, parse it and return status: "success"
- If image quality is poor but you can read some fields, return status: "partial" with what you found
- If this is not a receipt (e.g., a document, random image), return status: "not_a_receipt"
- If image is completely unreadable, return status: "unreadable" with suggestions

For successful/partial parsing:
- Return all amounts as numbers (no currency symbols)
- Date in ISO format (YYYY-MM-DD) - if year is missing, use ${currentYear}
- Categorize based on merchant type:
  * food: restaurants, cafes, grocery stores
  * retail: clothing, electronics, general stores
  * office: office supplies, business services
  * travel: gas stations, airlines, hotels
  * entertainment: movies, events, recreation
  * other: anything else
- Set confidence level based on image quality:
  * high: clear, easy to read
  * medium: some uncertainty or unclear parts
  * low: poor quality but readable
- If handwritten, read carefully and note in the response
- Extract items if clearly visible

For partial success:
- List which fields you couldn't read in missingFields array
- Explain why in message (e.g., "bottom of receipt is faded")
- Provide actionable suggestions in suggestions array

For errors:
- Be specific about what went wrong
- Provide actionable suggestions for improvement

Current date: ${today}

CRITICAL: Respond with ONLY raw JSON. Do NOT wrap in markdown code blocks or use \`\`\`json formatting.
Return the JSON object directly without any additional text, explanations, or formatting.

JSON structure:
- Success: {"status": "success", "receipt": {...}, "notes": "..."}
- Partial: {"status": "partial", "receipt": {...}, "missingFields": [...], "message": "...", "suggestions": [...]}
- Not a receipt: {"status": "not_a_receipt", "reason": "...", "suggestion": "..."}
- Unreadable: {"status": "unreadable", "reason": "...", "suggestions": [...]}`;
}
