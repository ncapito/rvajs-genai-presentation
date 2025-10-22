import { z } from 'zod';

// The actual query structure that users can filter by
export const TaskQuerySchema = z.object({
  assignee: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
  dueDate: z.object({
    after: z.string().optional(),  // ISO format YYYY-MM-DD
    before: z.string().optional()  // ISO format YYYY-MM-DD
  }).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
});

export type TaskQuery = z.infer<typeof TaskQuerySchema>;

// Wrapper schema to handle success, clarification, and invalid cases
// This uses a discriminated union based on the 'status' field
export const QueryResultSchema = z.discriminatedUnion('status', [
  // Success case - query was understood and valid
  z.object({
    status: z.literal('success'),
    query: TaskQuerySchema,
    explanation: z.string().optional() // What the query does (helpful for debugging)
  }),
  // Clarification case - query is ambiguous and needs user input
  z.object({
    status: z.literal('needs_clarification'),
    message: z.string(), // What's ambiguous
    suggestions: z.array(z.string()).optional() // Possible interpretations
  }),
  // Invalid case - query is unsafe or can't be processed
  z.object({
    status: z.literal('invalid'),
    reason: z.string() // Why it's invalid/unsafe
  })
]);

export type QueryResult = z.infer<typeof QueryResultSchema>;
