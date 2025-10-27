import { Opik } from 'opik';

/**
 * Opik Configuration - Conditional Observability
 *
 * NOTE: Using basic Opik tracing for now. opik-langchain doesn't support
 * LangChain v1 yet. When it does, we can add OpikCallbackHandler for
 * automatic LangChain tracing.
 *
 * Supports both Cloud and Local Opik instances:
 * - Cloud Mode: Requires OPIK_API_KEY
 * - Local Mode: Requires OPIK_URL_OVERRIDE (typically http://localhost:5173/api)
 * - Can be disabled with OPIK_ENABLED=false
 *
 * Benefits when enabled:
 * - Trace all LLM calls (simple + chain approaches)
 * - See exact prompts and responses
 * - Track token usage and costs
 * - Monitor success/failure rates
 * - Debug schema mismatches
 *
 * Configuration:
 * - OPIK_ENABLED: true/false (explicit enable/disable)
 * - OPIK_URL_OVERRIDE: Custom endpoint URL for local Opik
 * - OPIK_PROJECT_NAME: Project name (default: demo2-receipts)
 * - OPIK_API_KEY: API key for cloud Opik (optional for local)
 * - OPIK_WORKSPACE: Workspace name for cloud Opik (optional)
 */

let opikClient: Opik | null = null;
let isOpikEnabled = false;

/**
 * Initialize Opik client if enabled
 * Supports both cloud and local Opik instances
 */
export function initializeOpik(): void {
  // Check if Opik is explicitly disabled
  const enabled = process.env.OPIK_ENABLED?.toLowerCase();
  if (enabled === 'false' || enabled === '0') {
    console.log('ℹ️  Opik observability disabled (OPIK_ENABLED=false)');
    return;
  }

  // Get configuration
  const apiKey = process.env.OPIK_API_KEY;
  const urlOverride = process.env.OPIK_URL_OVERRIDE;
  const projectName = process.env.OPIK_PROJECT_NAME || 'demo2-receipts';
  const workspace = process.env.OPIK_WORKSPACE;

  // For local Opik, URL override is required (no API key needed)
  // For cloud Opik, API key is required
  const isLocalMode = !!urlOverride;

  if (!isLocalMode && !apiKey) {
    console.log('ℹ️  Opik observability disabled (no API key or URL override)');
    return;
  }

  try {
    const config: any = {
      projectName
    };

    // Add API key for cloud mode (not needed for local)
    if (apiKey && !isLocalMode) {
      config.apiKey = apiKey;
    }

    // Add workspace ONLY for cloud mode (local Opik doesn't use workspaces)
    if (workspace && !isLocalMode) {
      config.workspace = workspace;
    }

    // Add URL override for local mode
    if (urlOverride) {
      config.baseUrl = urlOverride;
    }

    opikClient = new Opik(config);
    isOpikEnabled = true;

    const mode = isLocalMode ? 'local' : 'cloud';
    const endpoint = urlOverride || 'cloud';
    console.log(`✓ Opik observability enabled (${mode} mode: ${endpoint})`);
    console.log(`  Note: Using basic tracing (opik-langchain v1 support coming soon)`);
    if (isLocalMode) {
      console.log(`  Project: ${projectName}`);
    }
  } catch (error) {
    console.warn('⚠️  Failed to initialize Opik:', error);
    isOpikEnabled = false;
  }
}

/**
 * Get Opik client (may be null if not configured)
 */
export function getOpikClient(): Opik | null {
  return opikClient;
}

/**
 * Check if Opik is enabled
 */
export function isOpikAvailable(): boolean {
  return isOpikEnabled;
}

/**
 * Flush all pending traces (call before app shutdown)
 */
export async function flushOpikTraces(): Promise<void> {
  if (opikClient) {
    try {
      await opikClient.flush();
      console.log('✓ Opik traces flushed');
    } catch (error) {
      console.warn('⚠️  Failed to flush Opik traces:', error);
    }
  }
}

/**
 * Create a traced function wrapper
 * Only traces if Opik is enabled, otherwise runs function normally
 */
export async function withOpikTrace<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  if (!isOpikEnabled || !opikClient) {
    // Opik not enabled, run function normally
    return fn();
  }

  // Trace with Opik
  try {
    const trace = opikClient.trace({
      name,
      input: metadata || {},
      metadata: {
        approach: 'demo2-receipts',
        ...metadata
      }
    });

    // Execute the function
    const result = await fn();

    // End trace (no arguments in new API)
    trace.end();

    return result;
  } catch (error) {
    // If Opik fails, just run the function normally
    console.warn('[Opik] Tracing error, falling back to normal execution:', error);
    return fn();
  }
}
