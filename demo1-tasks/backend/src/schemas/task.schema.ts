import { z } from 'zod';

// Task data structure
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  assignee: z.string().nullable(),
  status: z.enum(['todo', 'in-progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string(), // ISO format YYYY-MM-DD
  createdAt: z.string()
});

export type Task = z.infer<typeof TaskSchema>;

// User data structure
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string()
});

export type User = z.infer<typeof UserSchema>;
