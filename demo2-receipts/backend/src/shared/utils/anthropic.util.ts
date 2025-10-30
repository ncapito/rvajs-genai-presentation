import { Anthropic } from '@anthropic-ai/sdk';
import { ChatAnthropic } from '@langchain/anthropic';

/**
 * Shared helper to get Anthropic client instance (direct SDK)
 * Throws if API key is not configured
 */
export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing Anthropic API key. Please set ANTHROPIC_API_KEY environment variable.'
    );
  }

  return new Anthropic({ apiKey });
}

/**
 * Shared helper to get LangChain ChatAnthropic model
 * Throws if API key is not configured
 */
export function getAnthropicModel(modelName: string = 'claude-sonnet-4-20250514', maxTokens: number = 2000): ChatAnthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing Anthropic API key. Please set ANTHROPIC_API_KEY environment variable.'
    );
  }

  return new ChatAnthropic({
    anthropicApiKey: apiKey,
    model: modelName,
    maxTokens
  });
}
