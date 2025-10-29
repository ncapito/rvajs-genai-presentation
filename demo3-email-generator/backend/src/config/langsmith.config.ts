/**
 * LangSmith Tracing Configuration
 *
 * Provides selective tracing for LangChain operations using LangSmith.
 * This allows you to trace specific email generation requests for debugging
 * and monitoring without tracing everything.
 */

import { Client } from 'langsmith';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import type { RunnableConfig } from '@langchain/core/runnables';

/**
 * Check if LangSmith tracing is configured
 */
export function isLangSmithEnabled(): boolean {
  return !!(
    process.env.LANGCHAIN_API_KEY &&
    process.env.LANGCHAIN_TRACING_V2 === 'true'
  );
}

/**
 * Create a LangSmith tracer for a specific project
 */
export function createTracer(projectName?: string): LangChainTracer | null {
  if (!isLangSmithEnabled()) {
    return null;
  }

  try {
    const client = new Client({
      apiKey: process.env.LANGCHAIN_API_KEY,
    });

    return new LangChainTracer({
      client,
      projectName: projectName || process.env.LANGCHAIN_PROJECT || 'demo3-email-generator',
    });
  } catch (error) {
    console.warn('Failed to create LangSmith tracer:', error);
    return null;
  }
}

/**
 * Create a RunnableConfig with tracing enabled
 *
 * @param options - Configuration options
 * @returns RunnableConfig with tracer callback if enabled
 */
export function createTracingConfig(options?: {
  enabled?: boolean;
  projectName?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  runName?: string;
}): RunnableConfig {
  const {
    enabled = true,
    projectName,
    tags = [],
    metadata = {},
    runName,
  } = options || {};

  // If tracing is disabled or not configured, return empty config
  if (!enabled || !isLangSmithEnabled()) {
    return {
      tags,
      metadata,
      runName,
    };
  }

  // Create tracer
  const tracer = createTracer(projectName);

  if (!tracer) {
    return {
      tags,
      metadata,
      runName,
    };
  }

  return {
    callbacks: [tracer],
    tags,
    metadata,
    runName,
  };
}

/**
 * Get tracing config for email generation
 */
export function getEmailGenerationTracingConfig(
  userId: string,
  userType: string,
  options?: {
    enabled?: boolean;
    includeMemes?: boolean;
  }
): RunnableConfig {
  return createTracingConfig({
    enabled: options?.enabled ?? true,
    projectName: 'demo3-email-generator',
    tags: [
      'email-generation',
      `user-type:${userType}`,
      options?.includeMemes ? 'with-memes' : 'no-memes',
    ],
    metadata: {
      userId,
      userType,
      includeMemes: options?.includeMemes || false,
      timestamp: new Date().toISOString(),
    },
    runName: `Generate Email - ${userType}`,
  });
}

/**
 * Log tracing status
 */
export function logTracingStatus(): void {
  if (isLangSmithEnabled()) {
    console.log('✅ LangSmith tracing enabled');
    console.log(`   Project: ${process.env.LANGCHAIN_PROJECT || 'demo3-email-generator'}`);
  } else {
    console.log('ℹ️  LangSmith tracing disabled (set LANGCHAIN_TRACING_V2=true to enable)');
  }
}
