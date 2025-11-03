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
  // Create the RAG chain with vector store dependency
  const relevantCommentsChain = createRelevantCommentsChain(vectorStore);

  // If sendEvent is provided, we need to manually execute each step to emit events
  // Otherwise, use the simple piped chain
  if (sendEvent) {
    // Return a custom runnable that executes steps with progress events
    return {
      async invoke(input: any) {
        // Step 1: Analyze Activity
        sendEvent('progress', { message: '📊 Analyzing user activity data...' });
        const analyzed = await analyzeActivityChain.invoke(input);
        sendEvent('step_complete', { step: 'analyze', message: '✅ Analyzing user activity data complete' });

        // Step 2: RAG - Retrieve comments
        sendEvent('progress', { message: '🔍 Retrieving relevant collaboration context (RAG)...' });
        const withComments = await relevantCommentsChain.invoke(analyzed);
        sendEvent('step_complete', { step: 'rag', message: '✅ Retrieving relevant collaboration context (RAG) complete' });

        // Step 3: Determine Style
        sendEvent('progress', { message: '🎨 Determining personalized email style...' });
        const withStyle = await determineStyleChain.invoke(withComments);
        sendEvent('step_complete', { step: 'style', message: '✅ Determining personalized email style complete' });

        // Step 4: Generate Email
        sendEvent('progress', { message: '✍️ Generating email content...' });
        const withEmail = await generateEmailChain.invoke(withStyle);
        sendEvent('step_complete', { step: 'generate', message: '✅ Generating email content complete' });

        // Step 5: Convert to HTML (optional - can be uncommented for live demo)
        // DEMO: Uncomment the lines below to add HTML conversion step
        const finalResult = withEmail;
        // sendEvent('progress', { message: '🎨 Converting to HTML format...' });
        // finalResult = await convertToHTMLChain.invoke(withEmail);
        // sendEvent('step_complete', { step: 'html', message: '✅ Converting to HTML format complete' });

        return finalResult;
      }
    };
  }

  // Simple piped chain (no SSE)
  return analyzeActivityChain
    .pipe(relevantCommentsChain) // Step 2: Add collaboration context via RAG
    .pipe(determineStyleChain) // Step 3: Apply business logic for style
    .pipe(generateEmailChain) // Step 4: Generate final email with LLM
    //.pipe(convertToHTMLChain) // Step 5: Convert to HTML with inline styles
    //.pipe(generateMemesChain) // Step 6: Generate meme images (optional)
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


  