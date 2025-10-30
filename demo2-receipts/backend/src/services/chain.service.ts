import { RunnableLambda } from '@langchain/core/runnables';
import { HumanMessage } from '@langchain/core/messages';
import { getVectorStore } from '../config/vectorstore.config';
import { getAnthropicModel } from '../shared/utils/anthropic.util';
import { ReceiptData } from '../shared/interfaces/task.interface';

// Interfaces
interface TaskMatch {
  taskId: string;
  title: string;
  description?: string;
  assignee: string | null;
  budget: number;
  createdAt: string;
  dueDate: string;
  confidenceScore: number;
  matchReasons: string[];
}

interface MatchResult {
  reasoning: string;
  match: TaskMatch | null;
}

/**
 * CHAIN APPROACH - LangChain.js Orchestration
 *
 * Multi-step chain for receipt-to-task matching using LangChain constructs.
 * Shows how to build complex workflows with explicit orchestration.
 *
 * **Approach:**
 * - Step 1: Semantic search for matching tasks
 * - Step 2: Filter by date range (explicit code)
 * - Step 3: Rank by budget match (explicit code)
 * - Step 4: LLM analyzes results and picks best match
 *
 * **When to use this approach:**
 * - You want explicit control over each step
 * - Need observability (see each step executing)
 * - Want deterministic business logic between LLM calls
 * - Team collaboration (different devs own steps)
 *
 * **Trade-offs:**
 * - More code to write and maintain
 * - You control the logic (pro and con)
 * - Better for complex pipelines with many steps
 *
 * **Contrast with Tool Calling:**
 * - Tool calling: LLM decides which tools to use and when
 * - Chain: Developer decides the exact sequence of operations
 */
class ChainService {
  /**
   * Match receipt to task using LangChain orchestration
   * Demonstrates explicit step-by-step workflow control
   */
  async matchReceiptToTask(receipt: ReceiptData): Promise<MatchResult> {
    console.log('\n[Chain Service] Starting receipt-to-task matching with LangChain...');
    console.log(`  Receipt: ${receipt.merchant} - $${receipt.total} on ${receipt.date}`);

    try {
      // Build and execute the chain
      const result = await this.runMatchingChain(receipt);
      console.log('[Chain Service] ✓ Matching complete\n');
      return result;

    } catch (error) {
      console.error('[Chain Service] Error in chain execution:', error);
      return {
        reasoning: 'Failed to match receipt to task due to error',
        match: null
      };
    }
  }

  /**
   * Build the matching chain (4 explicit steps)
   * This demonstrates LangChain's orchestration approach
   */
  private runMatchingChain(receipt: ReceiptData): Promise<MatchResult> {
    // Create runnable steps from methods
    const semanticSearchStep = RunnableLambda.from(this.semanticSearchStep.bind(this));
    const dateFilterStep = RunnableLambda.from(this.dateFilterStep.bind(this));
    const budgetRankStep = RunnableLambda.from(this.budgetRankStep.bind(this));
    const llmAnalysisStep = RunnableLambda.from(this.llmAnalysisStep.bind(this));

    // Compose the chain: semantic search → date filter → budget rank → LLM analysis
    return semanticSearchStep
      .pipe(dateFilterStep)
      .pipe(budgetRankStep)
      .pipe(llmAnalysisStep)
      .invoke({ receipt });
  }

  /**
   * Step 1: Semantic search using vector store
   */
  private async semanticSearchStep(input: { receipt: ReceiptData }) {

    const vectorStore = getVectorStore();
    if (!vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const query = `${input.receipt.merchant} ${input.receipt.category || ''} ${input.receipt.notes || ''}`;
    console.log(`[Chain Step 1/4] Semantic search for matching tasks with query: ${query}`);
    const results = await vectorStore.similaritySearch(query, 10);

    const tasks = results.map(doc => ({
      taskId: doc.metadata.taskId,
      title: doc.metadata.title,
      description: doc.metadata.description,
      budget: doc.metadata.budget,
      createdAt: doc.metadata.createdAt,
      dueDate: doc.metadata.dueDate,
      assignee: doc.metadata.assignee,
    }));

    console.log(`  Found ${tasks.length} semantically similar tasks`);
    return { ...input, semanticMatches: tasks };
  }

  /**
   * Step 2: Filter by date range (deterministic business logic)
   */
  private async dateFilterStep(input: { receipt: ReceiptData; semanticMatches: any[] }) {
    console.log('[Chain Step 2/4] Filtering by date range...');

    const receiptDate = new Date(input.receipt.date);
    const filtered = input.semanticMatches.filter(task => {
      const createdAt = new Date(task.createdAt);
      const dueDate = new Date(task.dueDate);
      return receiptDate >= createdAt && receiptDate <= dueDate;
    });

    console.log(`  ${filtered.length} tasks match date range`);
    return { ...input, dateFiltered: filtered };
  }

  /**
   * Step 3: Rank by budget match (deterministic business logic)
   */
  private async budgetRankStep(input: { receipt: ReceiptData; dateFiltered: any[] }) {
    console.log('[Chain Step 3/4] Ranking by budget match...');

    const ranked = input.dateFiltered
      .filter(task => input.receipt.total <= task.budget)
      .map(task => {
        const utilization = (input.receipt.total / task.budget) * 100;
        return {
          ...task,
          utilizationPercentage: parseFloat(utilization.toFixed(2)),
          remaining: task.budget - input.receipt.total
        };
      })
      .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

    console.log(`  ${ranked.length} tasks ranked by budget fit`);
    return { ...input, rankedTasks: ranked };
  }

  /**
   * Step 4: LLM analyzes and picks best match (intelligent decision)
   */
  private async llmAnalysisStep(input: { receipt: ReceiptData; rankedTasks: any[] }): Promise<MatchResult> {
    console.log('[Chain Step 4/4] LLM analyzing results...');

    if (input.rankedTasks.length === 0) {
      return {
        reasoning: 'No tasks found that match the receipt criteria (semantic similarity, date range, and budget constraints)',
        match: null
      };
    }

    const prompt = `
    You are analyzing expense receipt matching results.

Receipt Details:
- Merchant: ${input.receipt.merchant}
- Amount: $${input.receipt.total}
- Date: ${input.receipt.date}
- Category: ${input.receipt.category || 'unknown'}

Top Matching Tasks:
${input.rankedTasks.slice(0, 3).map((task, i) => `
${i + 1}. ${task.title}
   - Task ID: ${task.taskId}
   - Budget: $${task.budget} (${task.utilizationPercentage}% utilization)
   - Description: ${task.description || 'N/A'}
   - Period: ${task.createdAt} to ${task.dueDate}
   - Assignee: ${task.assignee || 'Unassigned'}
`).join('\n')}

Analyze these matches and determine:
1. Which task is the best match and why
2. Confidence score (0-100)
3. Key reasons for the match

Respond with JSON:
{
  "bestTaskId": "task-XX",
  "confidence": 85,
  "reasoning": "Brief explanation..."
}`;

    const model = getAnthropicModel();
    const message = new HumanMessage({ content: prompt });
    const response = await model.invoke([message]);

    console.log('[Chain Step 4/4] Raw LLM response:', response.content);

    let analysis;
    try {
      analysis = JSON.parse(response.content as string);
    } catch (error) {
     return {
       reasoning: error instanceof Error ? error.message : 'Failed to parse LLM response',
       match: null,
     };
    }

    console.log('[Chain Step 4/4] Parsed analysis:', JSON.stringify(analysis, null, 2));

    // Look for task by taskId or id field
    const bestTask = input.rankedTasks.find(t =>
      t.taskId === analysis.bestTaskId
    );

    if (!bestTask) {
      console.warn(`[Chain Step 4/4] Task ${analysis.bestTaskId} not found in ranked tasks`);
      console.warn('[Chain Step 4/4] Available task IDs:', input.rankedTasks.map(t => t.taskId || (t as any).id));
      return {
        reasoning: analysis.reasoning || 'Could not determine best match',
        match: null
      };
    }

    // Build match reasons
    const matchReasons = [
      `Semantic match: Receipt matches task "${bestTask.title}"`,
      `Budget fit: $${input.receipt.total.toFixed(2)} of $${bestTask.budget.toFixed(2)} (${bestTask.utilizationPercentage}% utilization)`,
      `Date match: Receipt date falls within task work period`
    ];

    return {
      reasoning: analysis.reasoning,
      match: {
        taskId: bestTask.taskId,
        title: bestTask.title,
        description: bestTask.description,
        assignee: bestTask.assignee,
        budget: bestTask.budget,
        createdAt: bestTask.createdAt,
        dueDate: bestTask.dueDate,
        confidenceScore: analysis.confidence,
        matchReasons
      }
    };
  }

}

export const chainService = new ChainService();
