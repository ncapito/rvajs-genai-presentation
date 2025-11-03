import { RunnableLambda } from '@langchain/core/runnables';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { codeLLM } from '../config/azure.config.js';
import type { GenerateEmailOutput } from './generate-email.chain.js';
import { logChainStep, StepTimer } from '../utils/logging.utils.js';
import type { EventCallback } from './index.js';

/**
 * Step 5: Convert to HTML Chain
 *
 * This chain converts markdown email content into beautiful HTML with inline styles
 * for email client compatibility.
 *
 * Key features:
 * - Inline styles on every element (email-safe)
 * - Beautiful, professional design
 * - Fallback to markdown if conversion fails
 * - Skips if already HTML or too short
 */

export interface ConvertToHTMLOutput extends GenerateEmailOutput {
  email: {
    subject: string;
    body: string;
    format: 'html' | 'text';
    tone: 'professional' | 'casual' | 'humorous' | 'encouraging';
    priorityActions?: string[];
    memeSpots?: any[];
  };
}

export function buildConvertToHTMLChain(sendEvent: EventCallback = () => {}) {
  return RunnableLambda.from(
    async (input: GenerateEmailOutput): Promise<ConvertToHTMLOutput> => {
      const { email } = input;

      // Skip HTML conversion if body is too short or already HTML
      if (!email.body || email.body.length < 50 || email.body.includes('<html')) {
        console.log('\n[Step 5] Convert to HTML - Skipped (already HTML or too short)');
        return input as ConvertToHTMLOutput;
      }

      sendEvent('progress', { step: 'html', message: '🎨 Converting to HTML format' });
      logChainStep(5, 'Convert to HTML', codeLLM, `Body length: ${email.body.length} chars`);
      const timer = new StepTimer('HTML Conversion');

      const systemPrompt = getHTMLConversionSystemPrompt();
      const userPrompt = getHTMLConversionUserPrompt(email.subject, email.tone, email.body);

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

      try {
        const response = await codeLLM.invoke(messages);
        const htmlBody = response.content as string;

        // Extract HTML if wrapped in code blocks
        const cleanHTML = extractHTMLFromResponse(htmlBody);

        console.log(`  Converted to ${cleanHTML.length} chars HTML`);

        // Check if there are meme markers in the converted HTML
        if (email.memeSpots && email.memeSpots.length > 0) {
          const markerMatches = cleanHTML.match(/\[MEME_\d+\]/g);
          if (markerMatches) {
            console.log(`  ✓ Found ${markerMatches.length} meme markers in HTML: ${markerMatches.join(', ')}`);
          } else {
            console.warn(`  ⚠️ ${email.memeSpots.length} memeSpots defined but no [MEME_X] markers found in HTML!`);
            console.log(`  HTML preview: ${cleanHTML.substring(0, 300)}...`);
          }
        }

        timer.end();
        sendEvent('step_complete', { step: 'html', message: '✅ Converting to HTML format complete' });

        return {
          ...input,
          email: {
            ...email,
            body: cleanHTML,
            format: 'html' as const,
          },
        };
      } catch (error: any) {
        console.error('HTML conversion failed:', error.message);
        timer.endWithError(error);
        // Fallback: keep the markdown version
        return input as ConvertToHTMLOutput;
      }
    }
  );
}

// Keep old export for backward compatibility
export const convertToHTMLChain = buildConvertToHTMLChain();

// ============================================================================
// Helper Functions
// ============================================================================

function getHTMLConversionSystemPrompt(): string {
  return `You are an expert at converting markdown content into beautiful, email-safe HTML with inline styles.

CRITICAL: Every HTML element MUST have a style="" attribute with inline CSS. Email clients do not support external stylesheets or <style> tags.

CRITICAL: PRESERVE ALL [MEME_X] MARKERS EXACTLY AS-IS! Do not remove or modify markers like [MEME_1], [MEME_2], [MEME_3]. These will be replaced with images in a later step.

Your task is to convert the markdown email body into visually stunning HTML that renders perfectly in all email clients.

INLINE STYLE REQUIREMENTS (MANDATORY):
- EVERY element must have style="" attribute
- Use inline styles for ALL formatting (colors, fonts, spacing, etc)
- No external CSS, no <style> tags, no classes without inline styles
- PRESERVE [MEME_X] markers exactly as they appear in the original text

SPECIFIC STYLE RULES:
• Container <div>: style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #ffffff; color: #1f2937; line-height: 1.6;"

• <h1>: style="color: #667eea; font-size: 28px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.2;"
• <h2>: style="color: #4f46e5; font-size: 22px; font-weight: 600; margin: 32px 0 16px 0; line-height: 1.3;"
• <h3>: style="color: #6366f1; font-size: 18px; font-weight: 600; margin: 24px 0 12px 0; line-height: 1.4;"

• <p>: style="margin: 0 0 16px 0; color: #374151;"

• <strong>: style="font-weight: 600; color: #1f2937;"
• <em>: style="font-style: italic; color: #4b5563;"

• <ul>: style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;"
• <ol>: style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: decimal;"
• <li>: style="margin: 0 0 8px 0; color: #374151;"

• <a>: style="color: #667eea; text-decoration: underline;"

• <blockquote>: style="border-left: 4px solid #667eea; padding-left: 16px; margin: 16px 0; color: #6b7280; font-style: italic;"

• <hr>: style="border: none; border-top: 2px solid #e5e7eb; margin: 24px 0;"

• <pre>/<code>: style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; font-family: 'Monaco', 'Courier New', monospace; font-size: 14px; color: #1f2937; overflow-x: auto;"

STRUCTURE:
Wrap everything in a container div with the specified container styles.

EXAMPLE OUTPUT:
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #ffffff; color: #1f2937; line-height: 1.6;">
  <h1 style="color: #667eea; font-size: 28px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.2;">Task Summary</h1>

  <p style="margin: 0 0 16px 0; color: #374151;">Here's your weekly task update.</p>

  [MEME_1]

  <h2 style="color: #4f46e5; font-size: 22px; font-weight: 600; margin: 32px 0 16px 0; line-height: 1.3;">Overdue Tasks</h2>
  <ul style="margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;">
    <li style="margin: 0 0 8px 0; color: #374151;">Item with <strong style="font-weight: 600; color: #1f2937;">emphasis</strong></li>
  </ul>

  [MEME_2]
</div>

IMPORTANT: Keep all [MEME_X] markers in the output exactly as they appear in the input!

Return ONLY the HTML (no explanations, no markdown, no code blocks).`;
}

function getHTMLConversionUserPrompt(
  subject: string,
  tone: string,
  body: string
): string {
  // Count meme markers to remind the LLM
  const memeMarkers = body.match(/\[MEME_\d+\]/g);
  const memeCount = memeMarkers ? memeMarkers.length : 0;
  const memeReminder = memeCount > 0
    ? `\n\nCRITICAL: This email contains ${memeCount} meme markers (${memeMarkers!.join(', ')}). You MUST preserve them EXACTLY as-is in the HTML output!`
    : '';

  return `Convert this email to HTML with inline styles on EVERY element:

Subject: ${subject}
Tone: ${tone}

Body:
${body}${memeReminder}

Remember:
- EVERY element needs style="" attribute
- PRESERVE all [MEME_X] markers exactly as they appear
- Make it beautiful and professional`;
}

function extractHTMLFromResponse(htmlBody: string): string {
  let cleanHTML = htmlBody;

  // Extract HTML if wrapped in code blocks
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

  return cleanHTML;
}
