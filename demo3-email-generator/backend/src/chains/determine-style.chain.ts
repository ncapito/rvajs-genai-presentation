import { RunnableLambda } from '@langchain/core/runnables';
import type { EmailStyle } from '../schemas/email.schema.js';
import type { RelevantCommentsOutput } from './relevant-comments.chain.js';
import { logChainStep, StepTimer } from '../utils/logging.utils.js';

/**
 * Step 3: Determine Style Chain (Business Logic)
 *
 * This chain demonstrates that not every step needs an LLM call!
 *
 * It uses pure business logic to determine the email style based on user type.
 * This approach:
 * - Is faster (no API call)
 * - Is cheaper (no token usage)
 * - Is deterministic (same input = same output)
 * - Is easier to test and maintain
 *
 * Use LLMs for creativity and reasoning, use business logic for rules.
 */

export interface DetermineStyleOutput extends RelevantCommentsOutput {
  emailStyle: EmailStyle;
}

/**
 * Style configuration map for each user type
 *
 * This is the business logic that determines how emails should be structured
 * based on the user's preferences and personality type.
 */
const USER_TYPE_STYLE_MAP: Record<string, EmailStyle> = {
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
    includeMemes: false, // Will be overridden by user preferences if set
  },
};

/**
 * Determines the email style based on user type and preferences
 *
 * This is pure business logic - no LLM needed!
 */
export const determineStyleChain = RunnableLambda.from(
  async (input: RelevantCommentsOutput): Promise<DetermineStyleOutput> => {
    const { user } = input;
    const userType = user.userType;
    const preferences = user.preferences;

    logChainStep(3, 'Determine Style', undefined, `User type: ${userType}`);
    const timer = new StepTimer('Style Determination');

    // Look up style configuration for this user type
    const baseStyle = USER_TYPE_STYLE_MAP[userType] || USER_TYPE_STYLE_MAP['action-focused'];

    // Override with user-specific preferences if present
    const emailStyle: EmailStyle = {
      ...baseStyle,
      // Override includeMemes if user has explicit preference
      includeMemes: preferences.includeMemes ?? baseStyle.includeMemes,
    };

    console.log(`  Selected style: ${emailStyle.structure} / ${emailStyle.tone}`);
    timer.end();

    return {
      ...input,
      emailStyle,
    };
  }
);
