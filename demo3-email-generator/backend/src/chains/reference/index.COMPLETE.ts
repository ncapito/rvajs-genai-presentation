import type { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { analyzeActivityChain } from '../analyze-activity.chain.js';
import { createRelevantCommentsChain } from '../relevant-comments.chain.js';
import { determineStyleChain } from '../determine-style.chain.js';
import { generateEmailChain } from '../generate-email.chain.js';

/**
 * COMPLETE VERSION - BACKUP FOR REFERENCE
 *
 * This is the complete, working version with RAG integration.
 * Use this as reference during live coding or copy-paste if needed.
 */

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
 * Each step receives the output from the previous step and adds to it.
 * This creates a data pipeline where context builds progressively.
 */

/**
 * Creates the full email generation chain with RAG integration
 *
 * @param vectorStore - The initialized vector store for RAG retrieval
 * @returns A composed chain that takes task data and returns a personalized email
 */
export function createFullEmailChain(vectorStore: MemoryVectorStore) {
  // Create the RAG chain with vector store dependency
  const relevantCommentsChain = createRelevantCommentsChain(vectorStore);

  // Compose all chains into a single pipeline
  // The pipe() operator chains them together: output of one → input of next
  return (
    analyzeActivityChain
      .pipe(relevantCommentsChain) // Add collaboration context via RAG
      .pipe(determineStyleChain) // Apply business logic for style
      .pipe(generateEmailChain) // Generate final email with LLM
  );
}

// Export individual chains for testing or custom composition
export {
  analyzeActivityChain,
  createRelevantCommentsChain,
  determineStyleChain,
  generateEmailChain,
};
