import { ChatAnthropic } from '@langchain/anthropic';
import { RunnableLambda } from '@langchain/core/runnables';
import { HumanMessage } from '@langchain/core/messages';
import { ReceiptParseResult } from '../schemas/receipt.schema';
import { readFileSync } from 'fs';
import { buildReceiptPrompt } from '../shared/prompts/receipt.prompt';
import { getMediaType } from '../shared/utils/media.util';

/**
 * CHAIN APPROACH - LangChain.js Orchestration
 *
 * Multi-step chain using LangChain.js constructs:
 * 1. Receipt parsing (Claude) - Same prompt as simple approach
 * 2. Enrichment - Add computed fields, business rules validation
 *
 * **When to use this approach:**
 * - Need to add business logic after LLM extraction
 * - Want observability (see each step)
 * - Complex validation or enrichment rules
 * - External API calls (merchant lookup, duplicate detection)
 * - Team collaboration (different devs own steps)
 *
 * **Trade-offs:**
 * - More complex than single call
 * - Additional orchestration overhead
 * - BUT: More modular, testable, extensible
 *
 * **Note**: Both services use the same prompt for consistency.
 * The chain approach adds value through business logic, not by
 * artificially splitting the LLM call.
 */
class ChainService {
  private visionModel: ChatAnthropic | null = null;

  /**
   * Lazy initialization of model
   */
  private getModel(): ChatAnthropic {
    if (!this.visionModel) {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        throw new Error('Missing Anthropic API key. Please set ANTHROPIC_API_KEY environment variable.');
      }

      // Initialize model
      this.visionModel = new ChatAnthropic({
        anthropicApiKey: apiKey,
        model: 'claude-sonnet-4-20250514',
        maxTokens: 2000
      });
    }

    return this.visionModel;
  }

  /**
   * Parse receipt using LangChain multi-step chain
   * Automatically traced by Opik global callback handler
   */
  async parseReceipt(imagePath: string): Promise<ReceiptParseResult> {
    try {
      // Build the chain
      const chain = this.buildChain();

      // Execute the chain
      const result = await chain.invoke({ imagePath });

      return {
        status: 'success',
        receipt: result,
        notes: 'Parsed using LangChain orchestrated approach (2 steps: parse + enrich)'
      };

    } catch (error) {
      console.error('[Chain] Error in chain execution:', error);
      return {
        status: 'unreadable',
        reason: 'Failed to process receipt through chain',
        suggestions: ['Try simpler approach', 'Check image quality']
      };
    }
  }

  /**
   * Build the LangChain chain
   * This is the key teaching moment - showing actual LangChain constructs!
   */
  private buildChain() {
    // Get model (lazy initialization)
    const model = this.getModel();

    // Step 1: Parse receipt using Claude Vision (same prompt as simple approach)
    const parsingStep = RunnableLambda.from(async (input: { imagePath: string }) => {
      console.log('[Chain Step 1/2] Parsing receipt with Claude Vision...');

      const imageBuffer = readFileSync(input.imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mediaType = getMediaType(input.imagePath);
      const isPdf = input.imagePath.toLowerCase().endsWith('.pdf');

      // Use the same comprehensive prompt as the simple approach
      const prompt = buildReceiptPrompt();

      const message = new HumanMessage({
        content: [
          {
            type: isPdf ? 'document' : 'image_url',
            [isPdf ? 'document' : 'image_url']: isPdf
              ? {
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64Image
                  }
                }
              : `data:${mediaType};base64,${base64Image}`
          },
          {
            type: 'text',
            text: prompt
          }
        ]
      });

      const response = await model.invoke([message]);
      const parsedResponse = JSON.parse(response.content as string);

      console.log('[Chain Step 1/2] ✓ Receipt parsed');
      return { ...input, parsedResponse };
    });

    // Step 2: Enrich with computed fields and business rules (pure business logic)
    const enrichmentStep = RunnableLambda.from(async (input: { imagePath: string; parsedResponse: any }) => {
      console.log('[Chain Step 2/2] Enriching with computed fields...');

      // If parsing failed, return the error response as-is
      if (input.parsedResponse.status !== 'success' && input.parsedResponse.status !== 'partial') {
        return input.parsedResponse;
      }

      const receipt = input.parsedResponse.receipt;
      const enriched = { ...receipt };

      // Calculate tax percentage if we have subtotal and tax
      if (enriched.subtotal && enriched.tax) {
        enriched.taxPercentage = parseFloat(
          ((enriched.tax / enriched.subtotal) * 100).toFixed(2)
        );
      }

      // You could add more business logic here:
      // - Validate totals match (subtotal + tax = total)
      // - Flag unusual tip percentages (>25%)
      // - Merchant category validation
      // - Duplicate detection (database lookup)
      // - Expense policy checks
      // - External API calls (merchant enrichment)
      // - etc.

      console.log('[Chain Step 2/2] ✓ Enrichment complete');
      return enriched;
    });

    // Compose the chain: parsing → enrichment
    // This shows when orchestration adds value: after LLM extraction, add business logic
    return parsingStep.pipe(enrichmentStep);
  }
}

export const chainService = new ChainService();
