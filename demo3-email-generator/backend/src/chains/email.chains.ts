import { RunnableLambda } from '@langchain/core/runnables';
import type { RunnableConfig } from '@langchain/core/runnables';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { azureLLM, codeLLM, memeConfig } from '../config/azure.config.js';
import {
  EmailSchema,
  type UserProfile,
  type TaskActivity,
  type EmailStyle,
  type Email
} from '../schemas/email.schema.js';
import type { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { generateMemesChain } from './meme.chains.js';
import { logChainStep, StepTimer } from '../utils/logging.utils.js';
import { traceable } from 'langsmith/traceable';

// Step 1: Analyze user activity to identify key points
export const analyzeActivityChain = RunnableLambda.from(async (input: {
  user: UserProfile;
  taskActivity: TaskActivity;
  recentActivity: any[];
  overdueTasks: any[];
  inProgressTasks: any[];
}) => {
  const { taskActivity, recentActivity, overdueTasks, inProgressTasks } = input;

  logChainStep(1, 'Analyze Activity', azureLLM, `Analyzing ${taskActivity.assigned} tasks`);
  const timer = new StepTimer('Activity Analysis');

  const messages = [
    new SystemMessage(
      'You are an expert at analyzing task activity data and identifying the most important points for a user.'
    ),
    new HumanMessage(
      `Analyze this task activity and identify key points that would be relevant in an email summary:

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
4. Overall workload assessment`
    ),
  ];

  try {
    const response = await azureLLM.invoke(messages);
    timer.end();

    return {
      ...input,
      activityAnalysis: response.content,
    };
  } catch (error: any) {
    timer.endWithError(error);
    throw error;
  }
});

// Step 2: Retrieve relevant collaboration context using RAG
export const createRelevantCommentsChain = (vectorStore: MemoryVectorStore | null) => {
  return RunnableLambda.from(async (input: {
    user: UserProfile;
    taskActivity: TaskActivity;
    activityAnalysis: string;
    recentActivity: any[];
    overdueTasks: any[];
    inProgressTasks: any[];
  }) => {
    const { user } = input;

    logChainStep(2, 'RAG Retrieval', undefined, vectorStore ? ('Using embeddings:' + process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT) : 'Skipped (no vector store)');
    const timer = new StepTimer('RAG Retrieval');

    // Skip RAG if vector store is not available
    if (!vectorStore) {
      timer.end();
      return {
        ...input,
        collaborationContext: [],
      };
    }

    // Retrieve comments where user is mentioned
    const query = `Comments and mentions for ${user.name}`;

    try {
      const relevantComments = await vectorStore.similaritySearch(query, 5);
      console.log(`  Retrieved ${relevantComments.length} relevant comments`);
      timer.end();

      return {
        ...input,
        collaborationContext: relevantComments.map((doc) => doc.pageContent),
      };
    } catch (error: any) {
      timer.endWithError(error);
      // Fallback: return empty array
      return {
        ...input,
        collaborationContext: [],
      };
    }
  });
};

// Step 3: Determine email style based on user type (Business logic)
export const determineStyleChain = RunnableLambda.from(async (input: {
  user: UserProfile;
  taskActivity: TaskActivity;
  activityAnalysis: string;
  collaborationContext: string[];
  recentActivity: any[];
  overdueTasks: any[];
  inProgressTasks: any[];
}) => {
  const { user } = input;
  const userType = user.userType;
  const preferences = user.preferences;

  logChainStep(3, 'Determine Style', undefined, `User type: ${userType}`);
  const timer = new StepTimer('Style Determination');

  // Business logic for style determination based on user type
  const styleMap: Record<string, EmailStyle> = {
    'detail-oriented': {
      structure: 'comprehensive',
      tone: 'professional',
      includeStats: true,
      includeBreakdowns: true,
    },
    'action-focused': {
      structure: 'minimal',
      tone: 'direct',
      includeStats: false,
      bulletPointsOnly: true,
    },
    'inactive': {
      structure: 'motivational',
      tone: 'encouraging',
      emphasizeTeamNeeds: true,
      includeReengagementOptions: true,
    },
    'meme-loving': {
      structure: 'humorous',
      tone: 'casual',
      includeReferences: true,
      includeMemes: preferences.includeMemes || false,
    },
  };

  const emailStyle = styleMap[userType] || styleMap['action-focused'];
  console.log(`  Selected style: ${emailStyle.structure} / ${emailStyle.tone}`);
  timer.end();

  return {
    ...input,
    emailStyle,
  };
});

// Step 4: Generate email content using LLM with structured output
export const generateEmailChain = RunnableLambda.from(async (input: {
  user: UserProfile;
  taskActivity: TaskActivity;
  activityAnalysis: string;
  collaborationContext: string[];
  emailStyle: EmailStyle;
  recentActivity: any[];
  overdueTasks: any[];
  inProgressTasks: any[];
}) => {
  const {
    user,
    taskActivity,
    activityAnalysis,
    collaborationContext,
    emailStyle,
    recentActivity,
    overdueTasks,
    inProgressTasks
  } = input;

  // Create parser for structured output
  const parser = StructuredOutputParser.fromZodSchema(EmailSchema);
  const formatInstructions = parser.getFormatInstructions();

  // Build detailed prompt based on user type and style
  let styleGuidance = '';

  switch (user.userType) {
    case 'detail-oriented':
      styleGuidance = `
- Use professional, comprehensive tone
- Include detailed statistics and breakdowns
- Organize with clear sections (Overview, In Progress, Overdue, etc.)
- Include trends and analysis
- Provide full context for each item
- Use emojis sparingly for section headers only`;
      break;

    case 'action-focused':
      styleGuidance = `
- Be direct and brief
- Lead with what needs immediate action
- Use bullet points, no fluff
- Skip detailed explanations
- Focus on priorities and next steps
- Keep it short and scannable`;
      break;

    case 'inactive':
      styleGuidance = `
- Use encouraging, motivational tone
- Emphasize that the team needs their input
- Show what they're missing (collaboration)
- Acknowledge they may be busy
- Offer help and support options
- Include clear call-to-action to re-engage`;
      break;

    case 'meme-loving':
      styleGuidance = `
- Use casual, humorous tone (internet culture)
- Include meme references and jokes
- Be playful but still informative
- Use modern slang (but not cringe)
- Make them smile while conveying info

CRITICAL: This user has includeMemes=${user.preferences.includeMemes}
${user.preferences.includeMemes ? `
YOU MUST include a "memeSpots" array with 2-3 meme locations:
- position: paragraph number where meme should appear (1, 2, 3, etc.)
- generationPrompt: detailed prompt describing the MEME with TEXT OVERLAYS

  CRITICAL MEME FORMAT REQUIREMENTS:
  • Include BOLD, CLEAR TEXT OVERLAY on the image (white text with black outline, Impact font style)
  • Text should be the PUNCHLINE/CAPTION that makes it funny
  • Use meme text structure: either "top text / bottom text" OR a single prominent caption
  • Text must relate to the task management situation (overdue tasks, comments, team collaboration)

  Example 1: "A stressed cartoon developer at desk with multiple screens showing overdue tasks.
  Large white text overlay at top reads 'ME SEEING 8 OVERDUE TASKS' and bottom text reads 'THIS IS FINE'.
  Comic/meme style with bold Impact font text overlay."

  Example 2: "A person confidently pointing at a completion checklist with sparkles.
  Big white text overlay with black outline reads 'DEPLOYED ON FRIDAY' at the top.
  Meme style image with prominent text."

- altText: short description for accessibility (e.g., "Meme showing stressed developer with 'This is fine' text")
- textFallback: funny text to show if image generation fails (e.g., "*Insert 'This is Fine' meme here*")

The meme prompts MUST:
1. **Include prominent text overlays** - this is what makes it a meme, not just an image!
2. Use **bold, readable text** - white text with black outline (classic meme style)
3. Have a **clear punchline** in the text - relate to their tasks/comments/activity
4. Be **workplace-appropriate** but funny
5. Text should be **SHORT and PUNCHY** (2-8 words per line maximum)

EXAMPLES OF GOOD MEME TEXT:
• "WHEN YOU HAVE 3 OVERDUE TASKS" / "BUT COFFEE EXISTS"
• "8 COMMENTS UNREAD" / "I'M FINE"
• "FRIDAY 4:59 PM" / "JUST ONE MORE COMMIT"
• "TASK MARKED COMPLETE" / "DOPAMINE UNLOCKED"

DO NOT just reference memes in text - actually generate the memeSpots array with TEXT OVERLAY instructions!
` : '- Do not include memeSpots array'}`;
      break;
  }

  const systemPrompt = `You are an expert email writer specializing in personalized task management communications.

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

  const userPrompt = `Generate a personalized task summary email for ${user.name}.

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
${collaborationContext.length > 0 ? collaborationContext.join('\n\n') : 'No recent mentions'}

Email Style Configuration:
${JSON.stringify(emailStyle, null, 2)}

Generate the email following the style requirements and user preferences.`;

  logChainStep(4, "Generate Email", azureLLM, `Persona: ${user.userType}`);
  const timer = new StepTimer('Email Generation');

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ];

  try {
    const response = await azureLLM.invoke(messages);
    const email = await parser.parse(response.content as string);

    // Debug: Log meme spots if present
    if (email.memeSpots && email.memeSpots.length > 0) {
      console.log(`  Generated ${email.memeSpots.length} meme spots for ${user.name}`);
    } else if (user.userType === 'meme-loving') {
      console.log(`  ⚠️  No meme spots generated for ${user.name} (meme-loving user!)`);
    }

    timer.end();

    return {
      ...input,
      email,
    };
  } catch (error: any) {
    timer.endWithError(error);
    console.error('Failed to parse email response:', error);
    // Fallback: create a basic email structure
    return {
      ...input,
      email: {
        subject: `Task Summary for ${user.name}`,
        body: `Error generating email: ${error.message}`,
        format: 'text' as const,
        tone: emailStyle.tone,
      },
    };
  }
});

// Step 5: Convert markdown email to HTML (NEW - for live demo!)
export const convertToHTMLChain = RunnableLambda.from(async (input: {
  user: UserProfile;
  taskActivity: TaskActivity;
  activityAnalysis: string;
  collaborationContext: string[];
  emailStyle: EmailStyle;
  email: Email;
  recentActivity: any[];
  overdueTasks: any[];
  inProgressTasks: any[];
}) => {
  const { email } = input;

  // Skip HTML conversion if body is too short or already HTML
  if (!email.body || email.body.length < 50 || email.body.includes('<html')) {
    console.log('\n[Step 5] Convert to HTML - Skipped (already HTML or too short)');
    return input;
  }

  logChainStep(5, 'Convert to HTML', codeLLM, `Body length: ${email.body.length} chars`);
  const timer = new StepTimer('HTML Conversion');

  const systemPrompt = `You are an expert at converting markdown content into beautiful, email-safe HTML with inline styles.

CRITICAL: Every HTML element MUST have a style="" attribute with inline CSS. Email clients do not support external stylesheets or <style> tags.

Your task is to convert the markdown email body into visually stunning HTML that renders perfectly in all email clients.

INLINE STYLE REQUIREMENTS (MANDATORY):
- EVERY element must have style="" attribute
- Use inline styles for ALL formatting (colors, fonts, spacing, etc)
- No external CSS, no <style> tags, no classes without inline styles

SPECIFIC STYLE RULES:
• Container <div>: style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #ffffff; color: #1f2937; line-height: 1.6;"

• <h1>: style="color: #667eea; font-size: 28px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.2;"

• <h2>: style="color: #374151; font-size: 22px; font-weight: 600; margin: 32px 0 16px 0; padding-top: 16px; border-top: 2px solid #e5e7eb;"

• <h3>: style="color: #4b5563; font-size: 18px; font-weight: 600; margin: 24px 0 12px 0;"

• <p>: style="margin: 0 0 16px 0; color: #374151; font-size: 16px;"

• <ul>, <ol>: style="margin: 0 0 16px 0; padding-left: 24px;"

• <li>: style="margin: 0 0 8px 0; color: #374151;"

• <strong>: style="color: #1f2937; font-weight: 600;"

• Emphasis <span>: style="color: #ef4444; font-weight: 600;" (for urgent items)
  OR style="color: #10b981; font-weight: 600;" (for positive items)

• Priority sections: Add background like style="background-color: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 16px 0;"

EXAMPLE OUTPUT FORMAT:
<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff; color: #1f2937;">
  <h1 style="color: #667eea; font-size: 28px; margin: 0 0 24px 0;">Title Here</h1>
  <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">Content here...</p>
  <h2 style="color: #374151; font-size: 22px; margin: 32px 0 16px 0; border-top: 2px solid #e5e7eb; padding-top: 16px;">Section</h2>
  <ul style="margin: 0 0 16px 0; padding-left: 24px;">
    <li style="margin: 0 0 8px 0;">Item with <strong style="font-weight: 600;">emphasis</strong></li>
  </ul>
</div>

Return ONLY the HTML (no explanations, no markdown, no code blocks).`;

  const userPrompt = `Convert this email to HTML with inline styles on EVERY element:

Subject: ${email.subject}
Tone: ${email.tone}

Body:
${email.body}

Remember: EVERY element needs style="" attribute. Make it beautiful and professional.`;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ];

  try {
    // Use codeLLM (Grok Code Fast or fallback) for HTML/code generation
    const response = await codeLLM.invoke(messages);
    const htmlBody = response.content as string;

    // Extract HTML if wrapped in code blocks
    let cleanHTML = htmlBody;
    if (htmlBody.includes('```html')) {
      const match = htmlBody.match(/```html\s*([\s\S]*?)\s*```/);
      if (match) {
        cleanHTML = match[1].trim();
      }
    } else if (htmlBody.includes('```')) {
      const match = htmlBody.match(/```\s*([\s\S]*?)\s*```/);
      if (match) {
        cleanHTML = match[1].trim();
      }
    }

    console.log(`  Converted to ${cleanHTML.length} chars HTML`);
    timer.end();

    return {
      ...input,
      email: {
        ...email,
        body: cleanHTML,
        format: 'html' as const,
      },
    };
  } catch (error: any) {
    timer.endWithError(error);
    // Fallback: keep the markdown version
    return input;
  }
});

// Compose the full email generation chain
export const createFullEmailChain = (
  vectorStore: MemoryVectorStore | null,
  includeHTML: boolean = true,
  includeMemes: boolean = memeConfig.enabled
) => {
  const relevantCommentsChain = createRelevantCommentsChain(vectorStore);

  // Build the chain step by step
  let chain = analyzeActivityChain
    .pipe(relevantCommentsChain)
    .pipe(determineStyleChain)
    .pipe(generateEmailChain);

  // Step 5: Optionally add HTML conversion
  if (includeHTML) {
    chain = chain.pipe(convertToHTMLChain);
  }

  // Step 6: Optionally add meme generation (after HTML conversion)
  if (includeMemes && includeHTML) {
    console.log('Meme generation enabled in chain');
    chain = chain.pipe(generateMemesChain);
  }

  return chain;
};

/**
 * Traceable wrapper for the full email generation chain
 * This creates a parent trace in LangSmith with all chain steps as children
 */
export const generateEmailWithTracing = traceable(
  async (
    input: {
      user: UserProfile;
      taskActivity: TaskActivity;
      recentActivity: any[];
      overdueTasks: any[];
      inProgressTasks: any[];
      tracingConfig?: RunnableConfig;
    },
    vectorStore: MemoryVectorStore | null
  ) => {
    const chain = createFullEmailChain(vectorStore);
    return await chain.invoke(input, input.tracingConfig);
  },
  {
    name: 'generate_personalized_email',
    metadata: { component: 'email-generation-pipeline' },
  }
);
