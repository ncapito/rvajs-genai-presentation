import { RunnableLambda } from '@langchain/core/runnables';
import { memeConfig } from "../config/azure.config.js";
import { imageProvider } from '../services/image-providers.js';
import { logChainStep, StepTimer, logImageProvider } from '../utils/logging.utils.js';
import type {
  UserProfile,
  TaskActivity,
  EmailStyle,
  Email,
  MemeSpot
} from '../schemas/email.schema.js';

/**
 * Step 6 (Optional): Generate meme images using DALL-E 3
 *
 * This step:
 * 1. Checks if the email has memeSpots (meme-loving persona only)
 * 2. Generates images for each spot using DALL-E 3
 * 3. Injects the images into the HTML email
 * 4. Falls back to text if generation fails (graceful degradation)
 */
export const generateMemesChain = RunnableLambda.from(async (input: {
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
  const { email, user } = input;

  // Skip if meme generation is disabled
  if (!memeConfig.enabled) {
    console.log('\n[Step 6] Generate Memes - Disabled in config');
    return input;
  }

  // Skip if email doesn't have meme spots
  if (!email.memeSpots || email.memeSpots.length === 0) {
    console.log('\n[Step 6] Generate Memes - No meme spots found');
    return input;
  }

  // Skip if user doesn't want memes
  if (!user.preferences.includeMemes) {
    console.log(`\n[Step 6] Generate Memes - Disabled for user ${user.name}`);
    return input;
  }

  logChainStep(6, 'Generate Memes', undefined, `${email.memeSpots.length} images with ${imageProvider.name}`);
  const timer = new StepTimer('Meme Generation');

  try {
    // Generate images for each meme spot with timeout
    const memePromises = email.memeSpots.map(async (spot: MemeSpot, index: number) => {
      try {
        logImageProvider(
          imageProvider.name,
          spot.generationPrompt,
          index + 1,
          email.memeSpots!.length,
          memeConfig.generationTimeout
        );

        const imageTimer = new StepTimer(`Meme ${index + 1}`);

        // Use the configured image provider
        const imageUrl = await imageProvider.generateImage(
          spot.generationPrompt,
          memeConfig.generationTimeout
        );

        if (!imageUrl) {
          throw new Error('No image URL returned');
        }

        imageTimer.end();

        return {
          position: spot.position,
          imageUrl,
          altText: spot.altText,
          textFallback: spot.textFallback,
        };
      } catch (error: any) {
        console.warn(`  ❌ Meme ${index + 1} failed:`, error.message);
        // Return fallback
        return {
          position: spot.position,
          imageUrl: null,
          altText: spot.altText,
          textFallback: spot.textFallback,
        };
      }
    });

    // Wait for all memes (or fallbacks)
    const generatedMemes = await Promise.all(memePromises);

    // Inject memes into the HTML email body
    let updatedBody = email.body;

    // Sort by position (highest first) so we don't mess up positions when inserting
    const sortedMemes = [...generatedMemes].sort((a, b) => b.position - a.position);

    for (const meme of sortedMemes) {
      const memeHtml = meme.imageUrl
        ? `<div style="text-align: center; margin: 24px 0;">
             <img src="${meme.imageUrl}"
                  alt="${meme.altText}"
                  style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />
             <p style="font-size: 14px; color: #6b7280; margin-top: 8px; font-style: italic;">${meme.altText}</p>
           </div>`
        : `<div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0; font-style: italic; color: #6b7280;">
             ${meme.textFallback}
           </div>`;

      // Insert at the meme position (rough split by paragraphs)
      const paragraphs = updatedBody.split('</p>');
      if (meme.position > 0 && meme.position <= paragraphs.length) {
        paragraphs.splice(meme.position, 0, memeHtml);
        updatedBody = paragraphs.join('</p>');
      } else {
        // Append at the end if position is out of range
        updatedBody += memeHtml;
      }
    }

    const successCount = generatedMemes.filter(m => m.imageUrl).length;
    const fallbackCount = generatedMemes.length - successCount;

    console.log(`  Results: ${successCount} generated, ${fallbackCount} fallback`);
    timer.end();

    return {
      ...input,
      email: {
        ...email,
        body: updatedBody,
        format: 'html' as const,
      },
    };
  } catch (error: any) {
    console.error('  ❌ Meme generation failed entirely:', error.message);
    timer.endWithError(error);
    // Return original email (complete fallback)
    return input;
  }
});

// Note: Image generation is now handled by the imageProvider abstraction
// See src/services/image-providers.ts for implementation details
