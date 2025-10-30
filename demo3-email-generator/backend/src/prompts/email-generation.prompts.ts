import type { UserProfile, TaskActivity } from '../schemas/email.schema.js';

/**
 * Prompts for Email Generation
 *
 * These prompts are extracted for easy reading and modification during demos.
 * Each function returns a formatted prompt string for a specific chain step.
 */

// ============================================================================
// Step 1: Analyze Activity Prompt
// ============================================================================

export function getAnalyzeActivitySystemPrompt(): string {
  return `You are an expert at analyzing task activity data and identifying the most important points for a user.

Your role is to:
1. Identify urgent items (overdue tasks)
2. Highlight active discussions (tasks with comments)
3. Recognize progress highlights (completed tasks)
4. Assess overall workload

Provide a concise, actionable analysis that can be used to generate a personalized email.`;
}

export function getAnalyzeActivityUserPrompt(
  taskActivity: TaskActivity,
  recentActivity: any[],
  overdueTasks: any[],
  inProgressTasks: any[]
): string {
  return `Analyze this task activity and identify key points that would be relevant in an email summary:

Task Activity Summary:
- Assigned: ${taskActivity.assigned} tasks
- In Progress: ${taskActivity.inProgress} tasks
- Completed: ${taskActivity.completed} tasks
- Overdue: ${taskActivity.overdue} tasks
- Commented on: ${taskActivity.commented} tasks
- Created: ${taskActivity.created} tasks

Recent Activity:
${JSON.stringify(recentActivity, null, 2)}

Overdue Tasks:
${JSON.stringify(overdueTasks, null, 2)}

In Progress Tasks:
${JSON.stringify(inProgressTasks, null, 2)}

Provide a concise analysis focusing on:
1. Most urgent items (overdue tasks)
2. Active discussions (tasks with comments)
3. Progress highlights (completed tasks)
4. Overall workload assessment`;
}

// ============================================================================
// Step 4: Generate Email Prompts (Main LLM Generation)
// ============================================================================

export function getEmailGenerationSystemPrompt(
  user: UserProfile,
  formatInstructions: string
): string {
  const styleGuidance = getStyleGuidanceForUserType(user.userType);

  return `You are an expert email writer specializing in personalized task management communications.

Your goal is to generate a task summary email that matches the user's preferences and personality.

User Profile:
- Name: ${user.name}
- Type: ${user.userType}
- Preferences: ${JSON.stringify(user.preferences, null, 2)}
- Description: ${user.description}

Style Requirements:
${styleGuidance}

IMPORTANT: Generate ONLY the fields specified in the schema. Do not add extra fields.
${formatInstructions}`;
}

export function getEmailGenerationUserPrompt(
  user: UserProfile,
  activityAnalysis: string,
  taskActivity: TaskActivity,
  recentActivity: any[],
  overdueTasks: any[],
  inProgressTasks: any[],
  collaborationContext?: string[]
): string {
  const memeGuidance = user.preferences.includeMemes
    ? `

MEME INSTRUCTIONS:
- Insert [MEME_1], [MEME_2], [MEME_3] markers directly in the body text where images fit contextually
- Populate the "memeSpots" array with corresponding image generation details
- Example body text: "Database migration is 3 days overdue! [MEME_1] Time to tackle..."
- Example memeSpot (no position field needed, markers control placement):
  {
    "generationPrompt": "Developer stressed juggling multiple tasks with coffee and laptop, cartoon style",
    "altText": "Stressed developer juggling tasks",
    "textFallback": "When your task list is longer than your coffee break"
  }`
    : '';

  return `Generate a personalized task summary email for ${user.name}.

Activity Analysis:
${activityAnalysis}

Task Data:
- Date Range: ${taskActivity.dateRange}
- Assigned: ${taskActivity.assigned}, In Progress: ${taskActivity.inProgress}
- Completed: ${taskActivity.completed}, Overdue: ${taskActivity.overdue}
- Commented: ${taskActivity.commented}, Created: ${taskActivity.created}

Recent Activity:
${recentActivity.map(a => `- ${a.title}: ${a.action}${a.comment ? ` - "${a.comment}"` : ''}`).join('\n')}

Overdue Tasks (HIGH PRIORITY):
${overdueTasks.map(t => `- ${t.title} (${t.priority} priority, ${t.daysPastDue} days overdue)`).join('\n')}

In Progress Tasks:
${inProgressTasks.map(t => `- ${t.title} (${t.commentCount} comments)`).join('\n')}

Collaboration Context (comments where user was mentioned):
${collaborationContext && collaborationContext.length > 0 ? collaborationContext.join('\n\n') : 'No recent mentions'}${memeGuidance}

Generate the email following the style requirements and user preferences.`;
}

// ============================================================================
// Helper: Style Guidance by User Type
// ============================================================================

function getStyleGuidanceForUserType(userType: string): string {
  const styleMap: Record<string, string> = {
    'detail-oriented': `
- Use professional, comprehensive tone
- Include detailed statistics and breakdowns
- Organize with clear sections (Overview, In Progress, Overdue, etc.)
- Include trends and analysis
- Provide full context for each item
- Use emojis sparingly for section headers only`,

    'action-focused': `
- Be direct and brief
- Lead with what needs immediate action
- Use bullet points, no fluff
- Skip detailed explanations
- Focus on priorities and next steps
- Keep it short and scannable`,

    'inactive': `
- Use encouraging, motivational tone
- Emphasize that the team needs their input
- Show what they're missing (collaboration)
- Acknowledge they may be busy
- Offer help and support options
- Include clear call-to-action to re-engage`,

    'meme-loving': `
- Use casual, humorous tone (internet culture)
- Include meme references and jokes in the text
- Be playful but still informative
- Use modern slang (but not cringe)
- Make them smile while conveying info
- CRITICAL: If includeMemes is true, insert [MEME_1], [MEME_2], [MEME_3] markers directly in the body text:
  - Place markers where images would contextually fit (e.g., after mentioning overdue tasks, show stressed dev meme)
  - Also populate the memeSpots array with corresponding image generation details
  - Each memeSpot needs: generationPrompt, altText, textFallback (NO position field needed)
  - The markers in body text control placement; memeSpots provide image generation instructions
  - Example: "Database migration is 3 days overdue. [MEME_1] Time to tackle this beast!"`,
  };

  return styleMap[userType] || styleMap['action-focused'];
}
