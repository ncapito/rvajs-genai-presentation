import { RunnableLambda } from '@langchain/core/runnables';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { azureLLM } from '../config/azure.config.js';
import { EmailSchema, type Email } from '../schemas/email.schema.js';
import type { DetermineStyleOutput } from './determine-style.chain.js';
import {
  getEmailGenerationSystemPrompt,
  getEmailGenerationUserPrompt,
} from '../prompts/email-generation.prompts.js';
import { logChainStep, StepTimer } from '../utils/logging.utils.js';
import type { EventCallback } from './index.js';

/**
 * Step 4: Generate Email Chain (Main LLM Generation)
 *
 * This chain uses the LLM to generate the final personalized email
 * with structured output validated by Zod schema.
 *
 * Key features:
 * - Structured output using Zod schema (type-safe!)
 * - Personalized prompts based on user type
 * - Incorporates all previous chain outputs:
 *   - Activity analysis (from Step 1)
 *   - Collaboration context (from Step 2 RAG)
 *   - Email style configuration (from Step 3)
 * - Graceful fallback if parsing fails
 */

export interface GenerateEmailOutput extends DetermineStyleOutput {
  email: Email;
}

export function buildGenerateEmailChain(sendEvent: EventCallback = () => {}) {
  return RunnableLambda.from(
    async (input: DetermineStyleOutput): Promise<GenerateEmailOutput> => {
      const {
        user,
        taskActivity,
        activityAnalysis,
        collaborationContext,
        emailStyle,
        recentActivity,
        overdueTasks,
        inProgressTasks,
      } = input;

      sendEvent('progress', { step: 'generate', message: '✍️ Generating email content' });
      logChainStep(4, 'Generate Email', azureLLM, `Persona: ${user.userType}`);
      const timer = new StepTimer('Email Generation');

      // Create parser for structured output
      const parser = StructuredOutputParser.fromZodSchema(EmailSchema);
      const formatInstructions = parser.getFormatInstructions();

      // Get prompts from centralized location
      const systemPrompt = getEmailGenerationSystemPrompt(user, formatInstructions);
      const userPrompt = getEmailGenerationUserPrompt(
        user,
        activityAnalysis,
        taskActivity,
        recentActivity,
        overdueTasks,
        inProgressTasks,
        collaborationContext
      );

      // Invoke LLM with structured output
      const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
      const response = await azureLLM.invoke(messages);

      try {
        // Parse the response into our typed Email schema
        const email = await parser.parse(response.content as string);

        // Log meme spots if present
        if (email.memeSpots && email.memeSpots.length > 0) {
          console.log(`  ✓ Generated ${email.memeSpots.length} meme spots:`);
          email.memeSpots.forEach((spot, i) => {
            console.log(`    [${i + 1}] Prompt: ${spot.generationPrompt.substring(0, 60)}...`);
            console.log(`        Alt: ${spot.altText}`);
          });

          // Check if body has corresponding markers
          const markers = email.body.match(/\[MEME_\d+\]/g);
          if (markers) {
            console.log(`  ✓ Found ${markers.length} markers in body: ${markers.join(', ')}`);
          } else {
            console.warn(`  ⚠️ ${email.memeSpots.length} memeSpots generated but no [MEME_X] markers in body!`);
            console.log(`  Body preview: ${email.body.substring(0, 300)}...`);
          }
        } else if (user.preferences.includeMemes) {
          console.warn(`  ⚠️ No meme spots generated (includeMemes is true)`);
        }

        timer.end();
        sendEvent('step_complete', { step: 'generate', message: '✅ Generating email content complete' });

        return {
          ...input,
          email,
        };
      } catch (error) {
        console.error('Failed to parse email response:', error);
        timer.endWithError(error);

        // Graceful fallback: create a basic email structure
        // This ensures the chain doesn't completely fail
        return {
          ...input,
          email: {
            subject: `Task Summary for ${user.name}`,
            body: response.content as string,
            format: 'text' as const,
            tone: emailStyle.tone,
          },
        };
      }
    }
  );
}

// Keep old export for backward compatibility
export const generateEmailChain = buildGenerateEmailChain();
