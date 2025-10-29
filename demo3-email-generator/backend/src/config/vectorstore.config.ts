import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Interface for comment data
interface Comment {
  id: string;
  taskId: string;
  taskTitle: string;
  author: string;
  text: string;
  timestamp: string;
  mentions: string[];
}

let vectorStoreInstance: MemoryVectorStore | null = null;

/**
 * Initialize the vector store from comments data
 * This is called once at server startup
 */
export async function initializeVectorStore(): Promise<MemoryVectorStore> {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  console.log('Initializing vector store for comment RAG...');

  try {
    // Load comments data
    const commentsPath = join(__dirname, '../data/comments.json');
    const commentsData = JSON.parse(readFileSync(commentsPath, 'utf-8')) as Comment[];

    // Convert comments to LangChain documents
    const documents = commentsData.map(
      (comment) =>
        new Document({
          pageContent: `${comment.author} commented on "${comment.taskTitle}": ${comment.text}`,
          metadata: {
            commentId: comment.id,
            taskId: comment.taskId,
            taskTitle: comment.taskTitle,
            author: comment.author,
            timestamp: comment.timestamp,
            mentions: comment.mentions,
          },
        })
    );

    // Create embeddings using Azure OpenAI
    const embeddings = new OpenAIEmbeddings({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName: extractInstanceName(process.env.AZURE_OPENAI_ENDPOINT || ''),
      azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT || 'text-embedding-ada-002',
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
    });

    // Create vector store from documents
    vectorStoreInstance = await MemoryVectorStore.fromDocuments(documents, embeddings);

    console.log(`Vector store initialized with ${documents.length} comments`);

    return vectorStoreInstance;
  } catch (error) {
    console.error('Failed to initialize vector store:', error);
    throw error;
  }
}

/**
 * Get the existing vector store instance
 * Returns null if RAG is disabled
 */
export function getVectorStore(): MemoryVectorStore | null {
  return vectorStoreInstance;
}

/**
 * Extract instance name from Azure OpenAI endpoint
 * Example: https://my-resource.openai.azure.com/ -> my-resource
 */
function extractInstanceName(endpoint: string): string {
  const match = endpoint.match(/https:\/\/([^.]+)\.openai\.azure\.com/);
  if (!match) {
    throw new Error(`Invalid Azure OpenAI endpoint format: ${endpoint}`);
  }
  return match[1];
}
