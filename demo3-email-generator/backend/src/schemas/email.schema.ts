import { z } from 'zod';

// User preferences schema
export const UserPreferencesSchema = z.object({
  detailLevel: z.enum(['low', 'medium', 'high']),
  preferredTone: z.enum(['professional', 'direct', 'encouraging', 'humorous']),
  emailFrequency: z.enum(['daily', 'weekly', 'only-when-needed']),
  includeMemes: z.boolean().optional(),
});

// User profile schema
export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  userType: z.enum(['detail-oriented', 'action-focused', 'inactive', 'meme-loving']),
  preferences: UserPreferencesSchema,
  description: z.string(),
  lastActive: z.string().optional(),
});

// Task activity schema
export const TaskActivitySchema = z.object({
  assigned: z.number(),
  inProgress: z.number(),
  completed: z.number(),
  overdue: z.number(),
  commented: z.number(),
  created: z.number(),
  lastActive: z.string(),
  dateRange: z.string(),
});

// Meme spot schema (for meme-loving persona)
// Note: Position is determined by [MEME_X] markers in the body text, not by a position field
export const MemeSpotSchema = z.object({
  generationPrompt: z.string().describe('Prompt to generate the meme image with DALL-E'),
  altText: z.string().describe('Alt text for accessibility'),
  textFallback: z.string().describe('Text to show if image generation fails'),
});

// Main email schema - the LLM will generate this structure
export const EmailSchema = z.object({
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Full email body content'),
  format: z.enum(['text', 'html']).describe('Email format'),
  tone: z.enum(['professional', 'direct', 'casual', 'humorous', 'encouraging']).describe('Email tone used'),
  priorityActions: z.array(z.string()).optional().describe('List of priority actions for the user'),
  memeSpots: z.array(MemeSpotSchema).optional().describe('Locations for meme images (meme-loving persona only)'),
});

// Email style configuration (determined by business logic)
export const EmailStyleSchema = z.object({
  structure: z.enum(['comprehensive', 'minimal', 'motivational', 'humorous']),
  tone: z.enum(['professional', 'direct', 'encouraging', 'casual']),
  includeStats: z.boolean().optional(),
  includeBreakdowns: z.boolean().optional(),
  bulletPointsOnly: z.boolean().optional(),
  emphasizeTeamNeeds: z.boolean().optional(),
  includeReengagementOptions: z.boolean().optional(),
  includeReferences: z.boolean().optional(),
  includeMemes: z.boolean().optional(),
});

// Types exported from schemas
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type TaskActivity = z.infer<typeof TaskActivitySchema>;
export type MemeSpot = z.infer<typeof MemeSpotSchema>;
export type Email = z.infer<typeof EmailSchema>;
export type EmailStyle = z.infer<typeof EmailStyleSchema>;
