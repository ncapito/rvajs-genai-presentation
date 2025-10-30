import  { Anthropic  } from '@anthropic-ai/sdk';
import { ReceiptParseResult, ReceiptParseResultSchema } from '../schemas/receipt.schema';
import { readFileSync } from 'fs';
import { buildReceiptPrompt } from '../shared/prompts/receipt.prompt';
import { getMediaType } from '../shared/utils/media.util';
import { getAnthropicClient } from '../shared/utils/anthropic.util';

/**
 * SIMPLE APPROACH - Direct Anthropic SDK
 *
 * Single API call to Claude Vision with structured output.
 *
 * **When to use:**
 * - Straightforward task (just parse the receipt)
 * - Speed matters
 * - Lower cost preferred
 * - RECOMMENDED for production
 *
 * **Benefits:**
 * - Simple, easy to understand
 * - Fast (single API call)
 * - Easy to debug
 * - Low latency
 */
class VisionService {
  private client: Anthropic | null = null;

  /**
   * Lazy initialization of Anthropic client
   */
  private getClient(): Anthropic {
    if (!this.client) {
      this.client = getAnthropicClient();
    }
    return this.client;
  }

  /**
   * Parse receipt from image using Claude Vision
   * This is the SIMPLE approach - single API call
   */
  async parseReceipt(imagePath: string): Promise<ReceiptParseResult> {
    try {
      const client = this.getClient();

      // Read file and convert to base64
      const fileBuffer = readFileSync(imagePath);
      const base64Data = fileBuffer.toString('base64');
      const mediaType = getMediaType(imagePath);
      const isPdf = imagePath.toLowerCase().endsWith('.pdf');

      // Build the prompt (shared with chain service)
      const prompt = buildReceiptPrompt();

      // Prepare content block (document for PDF, image for images)
      const messages: any[] = [];
      const docType = isPdf ? 'document' : 'image';
      messages.push({
        role: 'user',
        content: [
          {
            type: docType,
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data
            }
          }
        ]
      });

      messages.push({
        role: 'user',
        content: prompt
      });

      // Call Claude API (supports both images and PDFs)
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.0,
        messages: messages
      });

      // Extract and parse the response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse JSON from response
      let parsed: any;

      try {
        parsed = JSON.parse(content.text);
      } catch (error) {
        console.error('[Vision Service] Failed to parse JSON from Claude:', content.text);
        throw new Error('Claude returned invalid JSON');
      }

      console.log('[Vision Service] Parsed response:', JSON.stringify(parsed, null, 2));

      // Validate against our Zod schema
      const validated = ReceiptParseResultSchema.parse(parsed);

      return validated;

    } catch (error) {
      console.error('[Vision Service] Error:', error);

      // Return a graceful error response
      return {
        status: 'unreadable',
        reason: 'Failed to process image. Please try again with a clearer photo.',
        suggestions: [
          'Ensure good lighting',
          'Hold camera steady',
          'Capture the entire receipt',
          'Avoid glare and shadows'
        ]
      };
    }
  }
}

export const visionService = new VisionService();
