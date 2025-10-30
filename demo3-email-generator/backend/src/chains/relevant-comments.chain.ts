import { RunnableLambda } from '@langchain/core/runnables';
import type { MemoryVectorStore } from 'langchain/vectorstores/memory';
import type { AnalyzeActivityOutput } from './analyze-activity.chain.js';
import { logChainStep, StepTimer } from '../utils/logging.utils.js';

/**
 * Step 2: Relevant Comments Chain (RAG)
 *
 * This chain uses Retrieval Augmented Generation (RAG) to pull relevant
 * collaboration context from the vector store.
 *
 * It searches for comments where the user was mentioned or involved,
 * enriching the email with actual conversation context.
 *
 * This is a great example of RAG in action:
 * - Vector store contains embedded comments
 * - Semantic search retrieves relevant context
 * - Context is added to the prompt for richer email generation
 *
 * DEMO NOTE: This chain is perfect for live coding during presentation!
 */

export interface RelevantCommentsOutput extends AnalyzeActivityOutput {
  collaborationContext?: string[];
}

/**
 * Creates a chain that retrieves relevant comments using RAG
 *
 * @param vectorStore - The initialized vector store containing comment embeddings
 * @returns A runnable chain that adds collaboration context to the input
 */
export function createRelevantCommentsChain(vectorStore: MemoryVectorStore) {
  return RunnableLambda.from(
    async (input: AnalyzeActivityOutput): Promise<RelevantCommentsOutput> => {
      const { user } = input;

      logChainStep(2, 'RAG Retrieval', undefined, `Using embeddings: ${process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT || 'default'}`);
      const timer = new StepTimer('RAG Retrieval');

      // Construct search query for semantic search
      // Focus on finding urgent/important discussions that need the user's input
      const query = `Important discussions and decisions requiring ${user.name}'s input`;

      try {
        // Perform semantic search in vector store with metadata filtering
        // First, get all documents and filter by mentions metadata
        const allResults = await vectorStore.similaritySearch(query, 20); // Get more initially

        // Filter to only comments that mention this user
        const relevantComments = allResults
          .filter(doc => doc.metadata.mentions?.includes(user.name.toLowerCase()))
          .slice(0, 5); // Take top 5 after filtering

        console.log(`  Retrieved ${relevantComments.length} relevant comments mentioning ${user.name}`);
        if (relevantComments.length > 0) {
          relevantComments.forEach((doc, i) => {
            console.log(`    [${i + 1}] ${doc.pageContent.substring(0, 70)}...`);
          });
        }
        timer.end();

        return {
          ...input,
          collaborationContext: relevantComments.map((doc) => doc.pageContent),
        };
      } catch (error) {
        console.warn('Failed to retrieve comments from vector store:', error);
        timer.endWithError(error);

        // Graceful fallback: continue without RAG context
        return {
          ...input,
          collaborationContext: [],
        };
      }
    }
  );
}



/*
Characteristics:
  - Dynamic retrieval - Semantic search finds MOST relevant (not just newest)
  - Deep context - Full conversation threads
  - Scalable - With 100s of comments, finds the important ones
  - Personalized - Searches specifically for mentions of the user

  Example of the Difference
  Scenario: "Fix authentication bug" task has 3 comments

  recentActivity shows:
  "Sarah commented: Nick, need your input on the session handling approach"

  RAG retrieves ALL 3:
  1. "Sarah: Nick, need your input... JWT or session cookies?"
  2. "Mike: I agree with Sarah's concern about security..."
  3. "Sarah: Nick, any update? Security team is waiting..."

  Real Value of RAG 

  Without RAG:
  - "Sarah commented on authentication bug"
  - Missing: What's the actual debate? Who else is involved? What's urgent?

  With RAG:
  - Full conversation context
  - Shows it's a 3-comment thread
  - Reveals Mike also has concerns
  - Shows urgency ("security team is waiting")
*/