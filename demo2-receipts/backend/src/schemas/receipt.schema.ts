import { z } from 'zod';

// The actual receipt data structure
export const ReceiptDataSchema = z.object({
  merchant: z.string(),
  date: z.string(), // ISO format YYYY-MM-DD
  subtotal: z.number().optional(),
  tax: z.number(),
  total: z.number(),
  category: z.enum(['food', 'retail', 'office', 'travel', 'entertainment', 'other']),
  items: z.array(z.object({
    description: z.string(),
    price: z.number(),
    quantity: z.number().optional()
  })).optional(),
  paymentMethod: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional() // AI's confidence in the parsing
});

export type ReceiptData = z.infer<typeof ReceiptDataSchema>;

// Wrapper schema to handle success, partial success, and error cases
// Uses discriminated union pattern (same as Demo 1!)
export const ReceiptParseResultSchema = z.discriminatedUnion('status', [
  // Success case - receipt parsed successfully
  z.object({
    status: z.literal('success'),
    receipt: ReceiptDataSchema,
    notes: z.string().optional() // Any parsing notes (e.g., "Handwritten receipt parsed successfully")
  }),
  // Partial case - some fields couldn't be read
  z.object({
    status: z.literal('partial'),
    receipt: ReceiptDataSchema, // What we could parse
    missingFields: z.array(z.string()), // What we couldn't read
    message: z.string(), // Why partial (e.g., "Image quality poor in bottom section")
    suggestions: z.array(z.string()).optional() // What user could do to improve
  }),
  // Not a receipt - wrong document type
  z.object({
    status: z.literal('not_a_receipt'),
    reason: z.string(), // What we think this is instead
    suggestion: z.string().optional() // What to do
  }),
  // Unreadable - image too poor quality
  z.object({
    status: z.literal('unreadable'),
    reason: z.string(), // Why we can't read it
    suggestions: z.array(z.string()) // How to improve (better lighting, retake photo, etc.)
  })
]);

export type ReceiptParseResult = z.infer<typeof ReceiptParseResultSchema>;
