import type { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { analyzeActivityChain } from '../analyze-activity.chain.js';
// import { createRelevantCommentsChain } from './relevant-comments.chain.js';  // ← LIVE CODE: Uncomment this
import { determineStyleChain } from '../determine-style.chain.js';
import { generateEmailChain } from '../generate-email.chain.js';

/**
 * DEMO START VERSION - WITHOUT RAG
 *
 * This version demonstrates the pipeline WITHOUT RAG integration.
 * During the demo, you'll add the RAG chain to show how it enriches the emails.
 */

/**
 * Email Generation Pipeline
 *
 * This file demonstrates LangChain orchestration - composing multiple steps
 * into a single pipeline using the pipe() operator.
 *
 * The pipeline currently has 3 steps:
 *
 * 1. analyzeActivityChain
 *    └─> Analyzes raw task data, identifies key points (LLM call)
 *
 * 2. determineStyleChain
 *    └─> Applies business logic to determine email style (Pure logic, no LLM)
 *
 * 3. generateEmailChain
 *    └─> Generates final personalized email with structured output (LLM call)
 *
 * ⚠️ MISSING: Collaboration context from comments!
 * We'll add RAG in a moment to pull relevant comments from the vector store.
 */

/**
 * Creates the email generation chain (without RAG for now)
 *
 * @param vectorStore - The initialized vector store (not used yet)
 * @returns A composed chain that takes task data and returns a personalized email
 */
export function createFullEmailChain(vectorStore: MemoryVectorStore) {
  // TODO: During demo, add RAG chain here!
  // const relevantCommentsChain = createRelevantCommentsChain(vectorStore);

  // Compose chains into a pipeline
  return (
    analyzeActivityChain
      // .pipe(relevantCommentsChain)  // ← LIVE CODE: Add this line!
      .pipe(determineStyleChain)
      .pipe(generateEmailChain)
  );
}

// Export individual chains for testing or custom composition
export {
  analyzeActivityChain,
  // createRelevantCommentsChain,  // ← LIVE CODE: Uncomment this
  determineStyleChain,
  generateEmailChain,
};
