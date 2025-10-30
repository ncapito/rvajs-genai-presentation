import type { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { analyzeActivityChain } from './analyze-activity.chain.js';
import { createRelevantCommentsChain } from './relevant-comments.chain.js';
import { determineStyleChain } from './determine-style.chain.js';
import { generateEmailChain } from './generate-email.chain.js';
import { convertToHTMLChain } from './convert-to-html.chain.js';
import { generateMemesChain } from './meme.chains.js';

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
 * Creates the full email generation chain with RAG integration
 *
 * @param vectorStore - The initialized vector store for RAG retrieval
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
export function createFullEmailChain(vectorStore: MemoryVectorStore) {
  // Create the RAG chain with vector store dependency
  const relevantCommentsChain = createRelevantCommentsChain(vectorStore);

  // Compose all chains into a single pipeline
  // The pipe() operator chains them together: output of one → input of next
  return analyzeActivityChain
    //.pipe(relevantCommentsChain) // Step 2: Add collaboration context via RAG
    .pipe(determineStyleChain) // Step 3: Apply business logic for style
    .pipe(generateEmailChain) // Step 4: Generate final email with LLM
    //.pipe(convertToHTMLChain) // Step 5: Convert to HTML with inline styles
    //.pipe(generateMemesChain) // Step 6: Generate meme images (optional)

  //step 5
  //step 6
}

// Export individual chains for testing or custom composition
export {
  analyzeActivityChain,
  createRelevantCommentsChain,
  determineStyleChain,
  generateEmailChain,
  convertToHTMLChain,
  generateMemesChain,
};


  