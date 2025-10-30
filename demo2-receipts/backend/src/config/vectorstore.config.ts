import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Interface for task data
interface Task {
  id: string;
  title: string;
  description?: string;
  assignee: string | null;
  status: string;
  priority: string;
  dueDate: string;
  createdAt: string;
  budget?: number;
  expenses?: any[];
}

let vectorStoreInstance: MemoryVectorStore | null = null;

/**
 * Initialize the vector store from tasks data
 * This is called once at server startup
 */
export async function initializeVectorStore(): Promise<MemoryVectorStore> {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  console.log('Initializing vector store for task matching...');

  try {
    // Load tasks data
    const tasksPath = join(__dirname, '../data/tasks.json');
    const tasksData = JSON.parse(readFileSync(tasksPath, 'utf-8')) as Task[];

    // Only include tasks with budgets (the expense-trackable ones)
    const tasksWithBudgets = tasksData.filter(task => task.budget !== undefined);

    console.log(`Found ${tasksWithBudgets.length} tasks with budgets for receipt matching`);

    // Convert tasks to LangChain documents
    const documents = tasksWithBudgets.map(
      (task) =>
        new Document({
          pageContent: `${task.title}${task.description ? ': ' + task.description : ''}`,
          metadata: {
            taskId: task.id,
            title: task.title,
            description: task.description || '',
            assignee: task.assignee,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            budget: task.budget,
          },
        })
    );

    // Create embeddings using Azure OpenAI
    const embeddings = new OpenAIEmbeddings({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiInstanceName: extractInstanceName(process.env.AZURE_OPENAI_ENDPOINT ?? ''),
      azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT ??  'text-embedding-ada-002',
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview',
    });

    // Create vector store from documents
    vectorStoreInstance = await MemoryVectorStore.fromDocuments(documents, embeddings);

    console.log(`✓ Vector store initialized with ${documents.length} tasks`);

    return vectorStoreInstance;
  } catch (error) {
    console.error('Failed to initialize vector store:', error);
    throw error;
  }
}

/**
 * Get the existing vector store instance
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
