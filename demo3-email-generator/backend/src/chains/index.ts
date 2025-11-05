import type { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { buildAnalyzeActivityChain } from "./analyze-activity.chain.js";
import { buildRelevantCommentsChain, createRelevantCommentsChain } from './relevant-comments.chain.js';
import { buildDetermineStyleChain, determineStyleChain } from './determine-style.chain.js';
import { buildGenerateEmailChain, generateEmailChain } from './generate-email.chain.js';
import { buildConvertToHTMLChain, convertToHTMLChain } from './convert-to-html.chain.js';
import { buildGenerateMemesChain, generateMemesChain } from './meme.chains.js';

/**
 * Email Generation Pipeline
 *
 * This file demonstrates LangChain orchestration - composing multiple steps
 * into a single pipeline using the pipe() operator.
 *
 * The pipeline flows like this:
 *
 * 1. analyzeActivityChain
 *    └─> Analyzes raw task data, identifies key points (LLM call)
 *
 * 2. relevantCommentsChain
 *    └─> Retrieves collaboration context via RAG (Vector store search)
 *
 * 3. determineStyleChain
 *    └─> Applies business logic to determine email style (Pure logic, no LLM)
 *
 * 4. generateEmailChain
 *    └─> Generates final personalized email with structured output (LLM call)
 *
 * 5. convertToHTMLChain
 *    └─> Converts markdown to HTML with inline styles (LLM call)
 *
 * 6. generateMemesChain
 *    └─> Generates meme images for meme-loving persona (DALL-E call)
 *
 * Each step receives the output from the previous step and adds to it.
 * This creates a data pipeline where context builds progressively.
 */

/**
 * Event callback type for SSE progress updates
 */
export type EventCallback = (eventType: string, data: any) => void;

/**
 * Creates the full email generation chain with RAG integration
 *
 * @param vectorStore - The initialized vector store for RAG retrieval
 * @param sendEvent - Optional callback for SSE progress events
 * @returns A composed chain that takes task data and returns a personalized email
 *
 * @example
 * ```typescript
 * const chain = createFullEmailChain(vectorStore);
 * const result = await chain.invoke({
 *   user: userProfile,
 *   taskActivity: taskData,
 *   recentActivity: [...],
 *   overdueTasks: [...],
 *   inProgressTasks: [...]
 * });
 * console.log(result.email.subject);
 * console.log(result.email.body);
 * ```
 */
export function createFullEmailChain(vectorStore: MemoryVectorStore, sendEvent?: EventCallback) {
  // Simple piped chain with optional SSE events
  return buildAnalyzeActivityChain(sendEvent)
    .pipe(buildRelevantCommentsChain(vectorStore, sendEvent)) // Step 2: Add collaboration context via RAG
    .pipe(buildDetermineStyleChain(sendEvent)) // Step 3: Apply business logic for style
    .pipe(buildGenerateEmailChain(sendEvent)) // Step 4: Generate final email with LLM

  .pipe(buildConvertToHTMLChain(sendEvent)) // Step 5: Convert to HTML with inline styles
  .pipe(buildGenerateMemesChain(sendEvent)) // Step 6: Generate meme images (optional)
}

// Export individual chain builders for testing or custom composition
export {
  buildAnalyzeActivityChain,
  buildRelevantCommentsChain,
  createRelevantCommentsChain, // Keep for backward compatibility
  buildDetermineStyleChain,
  determineStyleChain, // Keep for backward compatibility
  buildGenerateEmailChain,
  generateEmailChain, // Keep for backward compatibility
  buildConvertToHTMLChain,
  convertToHTMLChain, // Keep for backward compatibility
  buildGenerateMemesChain,
  generateMemesChain, // Keep for backward compatibility
};


 



    //.pipe(buildConvertToHTMLChain(sendEvent)) // Step 5: Convert to HTML with inline styles
    //.pipe(buildGenerateMemesChain(sendEvent)) // Step 6: Generate meme images (optional)


    //FLUX-1.1-pro