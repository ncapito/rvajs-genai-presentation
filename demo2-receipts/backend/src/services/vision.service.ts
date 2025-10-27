import  { Anthropic  } from '@anthropic-ai/sdk';
import { ReceiptParseResult, ReceiptParseResultSchema } from '../schemas/receipt.schema';
import { readFileSync } from 'fs';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { withOpikTrace } from '../config/opik.config';
import { buildReceiptPrompt } from '../shared/prompts/receipt.prompt';
import { getMediaType } from '../shared/utils/media.util';

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
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new Error(
          'Missing Anthropic API key. Please set ANTHROPIC_API_KEY environment variable.'
        );
      }

      this.client = new Anthropic({
        apiKey
      });
    }
    return this.client;
  }

  /**
   * Parse receipt from image using Claude Vision
   * This is the SIMPLE approach - single API call
   */
  async parseReceipt(imagePath: string): Promise<ReceiptParseResult> {
    return withOpikTrace(
      'simple-vision-parse',
      async () => this._parseReceiptImpl(imagePath),
      { approach: 'simple', service: 'vision' }
    );
  }

  /**
   * Internal implementation of parseReceipt (wrapped by Opik trace)
   */
  private async _parseReceiptImpl(imagePath: string): Promise<ReceiptParseResult> {
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
      const messages:any [] = [];
      const docType = isPdf ? 'document' : 'image';
      messages.push({
          role: 'user',
          content: [
            { 
              type: docType,
              source: {
                type: 'base64',
                media_type: mediaType, //'application/pdf',
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
      const response = await client.messages.create(
        {
          model: "claude-sonnet-4-20250514", // Updated model with PDF support
          max_tokens: 2000,
          temperature: 0.0,
          messages: messages
        }
      );

      // Extract and parse the response
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse JSON from response
      let parsed: any;
      
      try{
        parsed = JSON.parse(content.text);
      } catch (error) {
        console.error('Error parsing response from Claude: ' + content.text);
        throw new Error('Failed to parse response from Claude');;
      }

      // Debug: Log the raw response from Claude
      console.log('[Vision Service] Raw Claude response:', JSON.stringify(parsed, null, 2));

      // Transform Claude's response to match our schema
      const transformed = this.transformResponse(parsed);

      // Validate against our Zod schema
      const validated = ReceiptParseResultSchema.parse(transformed);

      return validated;

    } catch (error) {
      console.error('Error parsing receipt with Claude Vision:', error);

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

  /**
   * Transform Claude's response format to match our schema
   * Claude sometimes returns richer structures than we ask for!
   */
  private transformResponse(response: any): any {
    // If it's an error response (not_a_receipt, unreadable), return as-is
    if (response.status === 'not_a_receipt' || response.status === 'unreadable') {
      return response;
    }

    // Transform the receipt data
    if (response.receipt) {
      const receipt = response.receipt;

      // Extract category from merchant object if present
      let category = receipt.category;
      if (typeof receipt.merchant === 'object' && receipt.merchant.category) {
        category = receipt.merchant.category;
      }

      // Handle merchant - could be string or object
      if (typeof receipt.merchant === 'object' && receipt.merchant.name) {
        receipt.merchant = receipt.merchant.name;
      }

      // Set category at receipt level
      if (category) {
        receipt.category = category;
      }

      // Handle items - map 'name' to 'description' and 'amount' to 'price' if needed
      if (receipt.items && Array.isArray(receipt.items)) {
        receipt.items = receipt.items.map((item: any) => ({
          description: item.description || item.name,
          price: item.price ?? item.amount, // Use ?? to handle 0 properly
          quantity: item.quantity
        }));
      }
    }

    return response;
  }
}

export const visionService = new VisionService();
