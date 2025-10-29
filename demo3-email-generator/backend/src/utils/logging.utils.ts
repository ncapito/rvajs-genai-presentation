/**
 * Logging utilities for LangChain observability
 */

import type { AzureChatOpenAI } from '@langchain/openai';

export interface ModelInfo {
  deployment: string;
  endpoint: string;
  provider: string;
  temperature?: number;
}

/**
 * Extract model information from an AzureChatOpenAI instance
 */
export function getModelInfo(llm: AzureChatOpenAI): ModelInfo {
  // Access the bound configuration
  const config = llm as any;

  return {
    deployment: config.azureOpenAIApiDeploymentName || 'unknown',
    endpoint: config.azureOpenAIEndpoint || 'unknown',
    provider: 'Azure OpenAI',
    temperature: config.temperature,
  };
}

/**
 * Log the start of a chain step with model information
 */
export function logChainStep(
  stepNumber: number,
  stepName: string,
  llm?: AzureChatOpenAI,
  additionalInfo?: string
): void {
  const timestamp = new Date().toISOString();
  const prefix = `[Step ${stepNumber}] ${stepName}`;

  if (llm) {
    const modelInfo = getModelInfo(llm);
    console.log(`\n${prefix}`);
    console.log(`  Model: ${modelInfo.deployment}`);
    console.log(`  Endpoint: ${modelInfo.endpoint}`);
    console.log(`  Temperature: ${modelInfo.temperature ?? 'default'}`);
    if (additionalInfo) {
      console.log(`  Info: ${additionalInfo}`);
    }
    console.log(`  Started: ${timestamp}`);
  } else {
    console.log(`\n${prefix}`);
    if (additionalInfo) {
      console.log(`  Info: ${additionalInfo}`);
    }
    console.log(`  Started: ${timestamp}`);
  }
}

/**
 * Timer utility for measuring chain step duration
 */
export class StepTimer {
  private startTime: number;
  private stepName: string;

  constructor(stepName: string) {
    this.stepName = stepName;
    this.startTime = Date.now();
  }

  end(): void {
    const duration = Date.now() - this.startTime;
    const seconds = (duration / 1000).toFixed(2);
    console.log(`  ✅ ${this.stepName} completed in ${seconds}s\n`);
  }

  endWithError(error: any): void {
    const duration = Date.now() - this.startTime;
    const seconds = (duration / 1000).toFixed(2);
    console.log(`  ❌ ${this.stepName} failed after ${seconds}s:`, error.message);
  }
}

/**
 * Format duration in a human-readable way
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = (ms / 1000).toFixed(2);
  return `${seconds}s`;
}

/**
 * Log image provider usage
 */
export function logImageProvider(
  providerName: string,
  prompt: string,
  index: number,
  total: number,
  timeout: number
): void {
  console.log(`\n[Meme ${index}/${total}] ${providerName}`);
  console.log(`  Prompt: "${prompt.substring(0, 80)}..."`);
  console.log(`  Timeout: ${timeout / 1000}s`);
}
