import { Response } from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { getVectorStore } from '../config/vectorstore.config';
import { getAnthropicClient } from '../shared/utils/anthropic.util';
import { ReceiptData, Task, TaskMatch } from '../shared/interfaces/task.interface';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tool definitions for Claude
 */
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_tasks_semantic',
    description:
      'Search for tasks using semantic similarity based on merchant name, description, or category. Use this to find tasks that semantically match the receipt content.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Semantic search query based on the receipt (e.g., "AWS cloud infrastructure", "office supplies", "team lunch")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'filter_by_date_range',
    description:
      'Filter tasks where the receipt date falls between the task createdAt and dueDate. This helps identify tasks that were active when the purchase was made.',
    input_schema: {
      type: 'object',
      properties: {
        taskIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of task IDs to filter',
        },
        receiptDate: {
          type: 'string',
          description: 'Receipt date in ISO format (YYYY-MM-DD)',
        },
      },
      required: ['taskIds', 'receiptDate'],
    },
  },
  {
    name: 'rank_by_budget_match',
    description:
      'Rank tasks by how well the receipt amount fits within the task budget. Returns tasks where receipt amount is less than or equal to budget, ranked by utilization percentage.',
    input_schema: {
      type: 'object',
      properties: {
        taskIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of task IDs to rank',
        },
        receiptAmount: {
          type: 'number',
          description: 'Total amount from the receipt',
        },
      },
      required: ['taskIds', 'receiptAmount'],
    },
  },
];


/**
 * Matching service that uses Claude with tool calling and streams progress via SSE
 */
class ToolService {
  private client: Anthropic | null = null;

  /**
   * Lazy initialization of Anthropic client
   */
  private getClient(): Anthropic {
    if (!this.client) {
      this.client = getAnthropicClient();
    }
    return this.client;
  }

  /**
   * SIMPLE VERSION - Match receipt to task using Claude with tool calling
   * Returns the result directly without SSE streaming
   * Perfect for demos to show how simple tool calling really is!
   */
  async matchReceiptToTaskSimple(receipt: ReceiptData): Promise<{
    reasoning: string;
    toolCalls: Array<{ toolName: string; input: any; result: any }>;
    match: TaskMatch | null;
  }> {
    const client = this.getClient();

    const prompt = `
You are a helpful assistant that matches expense receipts to project tasks.

Given this receipt:
- Merchant: ${receipt.merchant}
- Amount: $${receipt.total}
- Date: ${receipt.date}
- Category: ${receipt.category || 'unknown'}

Your goal is to find the best matching task for this expense.

You have access to tools for semantic search, date filtering, and budget matching.
Use these tools intelligently - you may not need all of them.

After analyzing, provide your final recommendation as JSON in this EXACT format:

{
  "taskId": "task-26",
  "confidence": 85,
  "reasons": [
    "Semantic match: Receipt for AWS matches 'Setup AWS cloud infrastructure' task",
    "Budget fit: $127.43 of $150.00 budget (85% utilization)",
    "Date match: Receipt date falls within task work period"
  ]
}

If no good match exists, use "taskId": null and explain why in reasons.`;

    const toolCalls: Array<{ toolName: string; input: any; result: any }> = [];

    try {
      // Initial API call
      let messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      let response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        tools: TOOLS,
        messages,
      });

      // Tool calling loop
      while (response.stop_reason === 'tool_use') {
        // Extract tool uses from response
        const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use') as Anthropic.ToolUseBlock[];
        // Execute each tool call
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          let result: any;

          switch (toolUse.name) {
            case 'search_tasks_semantic':
              result = await this.searchTasksSemanticSimple(toolUse.input as { query: string; limit?: number });
              break;
            case 'filter_by_date_range':
              result = await this.filterByDateRangeSimple(toolUse.input as { taskIds: string[]; receiptDate: string });
              break;
            case 'rank_by_budget_match':
              result = await this.rankByBudgetMatchSimple(toolUse.input as { taskIds: string[]; receiptAmount: number });
              break;
            default:
              result = { error: `Unknown tool: ${toolUse.name}` };
          }

          toolCalls.push({
            toolName: toolUse.name,
            input: toolUse.input,
            result,
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        }

        // Continue conversation with tool results
        messages.push({
          role: 'assistant',
          content: response.content,
        });

        messages.push({
          role: 'user',
          content: toolResults,
        });

        response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          tools: TOOLS,
          messages,
        });
      }

      // Extract final reasoning
      let reasoning = '';
      const finalTextBlocks = response.content.filter((block) => block.type === 'text') as Anthropic.TextBlock[];
      if (finalTextBlocks.length > 0) {
        const finalReasoning = finalTextBlocks.map((block) => block.text).join('\n');
        reasoning += finalReasoning;
      }

      // Parse the final response to extract the best match
      const match = this.extractBestMatch(reasoning, toolCalls);

      return {
        reasoning,
        toolCalls,
        match,
      };
    } catch (error) {
      console.error('[Matching] Error in simple matching:', error);
      return {
        reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        toolCalls,
        match: null,
      };
    }
  }

  /**
   * STREAMING VERSION - Match a receipt to a task using Claude with tool calling
   * Streams progress via SSE for real-time updates
   * NOTE: SSE headers must already be set by the caller before calling this method
   */
  async matchReceiptToTask(receipt: ReceiptData, res: Response): Promise<void> {
    const client = this.getClient();

    sendSSE(res, 'progress', {
      step: 'start',
      message: `Starting analysis for ${receipt.merchant} - $${receipt.total}`,
    });

    const prompt = `

You are a helpful assistant that matches expense receipts to project tasks.

Given this receipt:
- Merchant: ${receipt.merchant}
- Amount: $${receipt.total}
- Date: ${receipt.date}
- Category: ${receipt.category || 'unknown'}

Your goal is to find the best matching task for this expense.

You have access to tools for semantic search, date filtering, and budget matching.
Use these tools intelligently - you may not need all of them.

After analyzing, provide your final recommendation as JSON in this EXACT format:

{
  "taskId": "task-26",
  "confidence": 85,
  "reasons": [
    "Semantic match: Receipt for AWS matches 'Setup AWS cloud infrastructure' task",
    "Budget fit: $127.43 of $150.00 budget (85% utilization)",
    "Date match: Receipt date falls within task work period"
  ]
}

If no good match exists, use "taskId": null and explain why in reasons.`;

    const toolCalls: Array<{ toolName: string; input: any; result: any }> = [];
    let reasoning = '';

    try {
      // Initial API call
      let messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      sendSSE(res, 'progress', {
        step: 'thinking',
        message: 'Claude is analyzing the receipt and deciding which tools to use...',
      });

      let response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        tools: TOOLS,
        messages,
      });

      // Tool calling loop
      let iterationCount = 0;
      while (response.stop_reason === 'tool_use') {
        iterationCount++;

        // Extract tool uses from response
        const toolUseBlocks = response.content.filter((block) => block.type === 'tool_use') as Anthropic.ToolUseBlock[];

        // Extract reasoning (text blocks before tool use)
        const textBlocks = response.content.filter((block) => block.type === 'text') as Anthropic.TextBlock[];
        if (textBlocks.length > 0) {
          const newReasoning = textBlocks.map((block) => block.text).join('\n');
          reasoning += newReasoning + '\n';
          sendSSE(res, 'reasoning', { text: newReasoning });
        }

        // Execute each tool call
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          sendSSE(res, 'tool_call', {
            name: toolUse.name,
            input: toolUse.input,
          });

          let result: any;

          switch (toolUse.name) {
            case 'search_tasks_semantic':
              result = await this.searchTasksSemantic(toolUse.input as { query: string; limit?: number }, res);
              break;
            case 'filter_by_date_range':
              result = await this.filterByDateRange(toolUse.input as { taskIds: string[]; receiptDate: string }, res);
              break;
            case 'rank_by_budget_match':
              result = await this.rankByBudgetMatch(toolUse.input as { taskIds: string[]; receiptAmount: number }, res);
              break;
            default:
              result = { error: `Unknown tool: ${toolUse.name}` };
          }

          sendSSE(res, 'tool_result', {
            name: toolUse.name,
            result,
          });

          toolCalls.push({
            toolName: toolUse.name,
            input: toolUse.input,
            result,
          });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        }

        // Continue conversation with tool results
        messages.push({
          role: 'assistant',
          content: response.content,
        });

        messages.push({
          role: 'user',
          content: toolResults,
        });

        sendSSE(res, 'progress', {
          step: 'thinking',
          message: 'Claude is analyzing the results...',
        });

        response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          tools: TOOLS,
          messages,
        });
      }

      // Extract final reasoning
      const finalTextBlocks = response.content.filter((block) => block.type === 'text') as Anthropic.TextBlock[];
      if (finalTextBlocks.length > 0) {
        const finalReasoning = finalTextBlocks.map((block) => block.text).join('\n');
        reasoning += finalReasoning;
        sendSSE(res, 'reasoning', { text: finalReasoning });
      }

      // Parse the final response to extract the best match
      const match = this.extractBestMatch(reasoning, toolCalls);

      sendSSE(res, 'complete', {
        reasoning,
        toolCalls,
        match,
      });

      res.end();
    } catch (error) {
      sendSSE(res, 'error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      res.end();
    }
  }

  /**
   * SIMPLE - Search tasks using semantic similarity (no SSE)
   */
  private async searchTasksSemanticSimple(input: { query: string; limit?: number }): Promise<any> {
    const vectorStore = getVectorStore();
    if (!vectorStore) {
      return { error: 'Vector store not initialized' };
    }

    const limit = input.limit || 10;
    const results = await vectorStore.similaritySearch(input.query, limit);

    return {
      count: results.length,
      tasks: results.map((doc) => ({
        taskId: doc.metadata.taskId,
        title: doc.metadata.title,
        description: doc.metadata.description,
        budget: doc.metadata.budget,
        createdAt: doc.metadata.createdAt,
        dueDate: doc.metadata.dueDate,
        assignee: doc.metadata.assignee,
      })),
    };
  }

  /**
   * SIMPLE - Filter tasks by date range (no SSE)
   */
  private async filterByDateRangeSimple(input: { taskIds: string[]; receiptDate: string }): Promise<any> {
    const tasks = this.loadAllTasks();
    const receiptDate = new Date(input.receiptDate);

    const filtered = tasks.filter((task) => {
      if (!input.taskIds.includes(task.id)) return false;
      if (!task.budget) return false;

      const createdAt = new Date(task.createdAt);
      const dueDate = new Date(task.dueDate);

      return receiptDate >= createdAt && receiptDate <= dueDate;
    });

    return {
      count: filtered.length,
      tasks: filtered.map((task) => ({
        taskId: task.id,
        title: task.title,
        description: task.description,
        budget: task.budget,
        createdAt: task.createdAt,
        dueDate: task.dueDate,
        assignee: task.assignee,
      })),
    };
  }

  /**
   * SIMPLE - Rank tasks by budget match (no SSE)
   */
  private async rankByBudgetMatchSimple(input: { taskIds: string[]; receiptAmount: number }): Promise<any> {
    const tasks = this.loadAllTasks();

    const ranked = tasks
      .filter((task) => input.taskIds.includes(task.id) && task.budget !== undefined)
      .filter((task) => input.receiptAmount <= task.budget!) // Only tasks where receipt fits budget
      .map((task) => {
        const utilization = (input.receiptAmount / task.budget!) * 100;
        return {
          taskId: task.id,
          title: task.title,
          description: task.description,
          budget: task.budget,
          receiptAmount: input.receiptAmount,
          utilizationPercentage: parseFloat(utilization.toFixed(2)),
          remaining: task.budget! - input.receiptAmount,
          createdAt: task.createdAt,
          dueDate: task.dueDate,
          assignee: task.assignee,
        };
      })
      .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage); // Higher utilization = better match

    return {
      count: ranked.length,
      tasks: ranked,
    };
  }

  /**
   * Tool: Search tasks using semantic similarity
   */
  private async searchTasksSemantic(input: { query: string; limit?: number }, res: Response): Promise<any> {
    const vectorStore = getVectorStore();
    if (!vectorStore) {
      return { error: 'Vector store not initialized' };
    }

    sendSSE(res, 'progress', {
      step: 'tool_executing',
      message: `Searching for tasks matching: "${input.query}"`,
    });

    const limit = input.limit || 10;
    const results = await vectorStore.similaritySearch(input.query, limit);

    return {
      count: results.length,
      tasks: results.map((doc) => ({
        taskId: doc.metadata.taskId,
        title: doc.metadata.title,
        description: doc.metadata.description,
        budget: doc.metadata.budget,
        createdAt: doc.metadata.createdAt,
        dueDate: doc.metadata.dueDate,
        assignee: doc.metadata.assignee,
      })),
    };
  }

  /**
   * Tool: Filter tasks by date range
   */
  private async filterByDateRange(input: { taskIds: string[]; receiptDate: string }, res: Response): Promise<any> {
    sendSSE(res, 'progress', {
      step: 'tool_executing',
      message: `Filtering ${input.taskIds.length} tasks by date range (receipt date: ${input.receiptDate})`,
    });

    const tasks = this.loadAllTasks();
    const receiptDate = new Date(input.receiptDate);

    const filtered = tasks.filter((task) => {
      if (!input.taskIds.includes(task.id)) return false;
      if (!task.budget) return false;

      const createdAt = new Date(task.createdAt);
      const dueDate = new Date(task.dueDate);

      return receiptDate >= createdAt && receiptDate <= dueDate;
    });

    return {
      count: filtered.length,
      tasks: filtered.map((task) => ({
        taskId: task.id,
        title: task.title,
        description: task.description,
        budget: task.budget,
        createdAt: task.createdAt,
        dueDate: task.dueDate,
        assignee: task.assignee,
      })),
    };
  }

  /**
   * Tool: Rank tasks by budget match
   */
  private async rankByBudgetMatch(input: { taskIds: string[]; receiptAmount: number }, res: Response): Promise<any> {
    sendSSE(res, 'progress', {
      step: 'tool_executing',
      message: `Ranking ${input.taskIds.length} tasks by budget match ($${input.receiptAmount})`,
    });

    const tasks = this.loadAllTasks();

    const ranked = tasks
      .filter((task) => input.taskIds.includes(task.id) && task.budget !== undefined)
      .filter((task) => input.receiptAmount <= task.budget!) // Only tasks where receipt fits budget
      .map((task) => {
        const utilization = (input.receiptAmount / task.budget!) * 100;
        return {
          taskId: task.id,
          title: task.title,
          description: task.description,
          budget: task.budget,
          receiptAmount: input.receiptAmount,
          utilizationPercentage: parseFloat(utilization.toFixed(2)),
          remaining: task.budget! - input.receiptAmount,
          createdAt: task.createdAt,
          dueDate: task.dueDate,
          assignee: task.assignee,
        };
      })
      .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage); // Higher utilization = better match

    return {
      count: ranked.length,
      tasks: ranked,
    };
  }

  /**
   * Load all tasks from file
   */
  private loadAllTasks(): Task[] {
    // Path from demo2-receipts/backend to demo1-tasks/backend/data/tasks.json
    const tasksPath = join(process.cwd(), '../../demo1-tasks/backend/data/tasks.json');
    return JSON.parse(readFileSync(tasksPath, 'utf-8')) as Task[];
  }

  /**
   * Extract the best match from Claude's reasoning
   * Claude provides recommendation as JSON (may be wrapped in text)
   */
  private extractBestMatch(reasoning: string, toolCalls: any[]): TaskMatch | null {
    try {
      // Extract JSON from reasoning (Claude might wrap it in explanation text)
      const jsonMatch = reasoning.match(/\{[\s\S]*?"taskId"[\s\S]*?\}/);
      if (!jsonMatch) {
        console.log('[Matching] No JSON found in reasoning, trying fallback');
        console.log('[Matching] Reasoning:', reasoning.substring(0, 200));
        return this.extractFromBudgetRanking(toolCalls);
      }

      const recommendation = JSON.parse(jsonMatch[0]);

      if (!recommendation.taskId || recommendation.taskId === 'null' || recommendation.taskId === null) {
        console.log('[Matching] No task match found');
        return null;
      }

      // Get task details from tool results or load from file
      let taskDetails = this.findTaskInToolResults(recommendation.taskId, toolCalls);
      if (!taskDetails) {
        const allTasks = this.loadAllTasks();
        taskDetails = allTasks.find(t => t.id === recommendation.taskId) || undefined;
      }

      if (!taskDetails) {
        console.log(`[Matching] Task ${recommendation.taskId} not found`);
        return null;
      }

      return {
        taskId: taskDetails.id,
        title: taskDetails.title,
        description: taskDetails.description,
        assignee: taskDetails.assignee,
        budget: taskDetails.budget || 0,
        createdAt: taskDetails.createdAt,
        dueDate: taskDetails.dueDate,
        confidenceScore: recommendation.confidence || 70,
        matchReasons: recommendation.reasons || ['Claude recommended this task'],
      };

    } catch (error) {
      console.error('[Matching] Error parsing JSON recommendation:', error);
      return this.extractFromBudgetRanking(toolCalls);
    }
  }

  /**
   * Find task details in tool results
   */
  private findTaskInToolResults(taskId: string, toolCalls: any[]): Task | undefined {
    for (const call of toolCalls) {
      if (call.result && call.result.tasks) {
        const task = call.result.tasks.find((t: any) => t.taskId === taskId || t.id === taskId);
        if (task) {
          return {
            id: task.taskId || task.id,
            title: task.title,
            description: task.description,
            assignee: task.assignee,
            status: '',
            priority: '',
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            budget: task.budget,
          };
        }
      }
    }
    return undefined;
  }

  /**
   * Fallback extraction from budget ranking (old method)
   */
  private extractFromBudgetRanking(toolCalls: any[]): TaskMatch | null {
    const rankingCall = [...toolCalls].reverse().find((call) => call.toolName === 'rank_by_budget_match');

    if (!rankingCall || !rankingCall.result || !rankingCall.result.tasks || rankingCall.result.tasks.length === 0) {
      return null;
    }

    const topTask = rankingCall.result.tasks[0];

    return {
      taskId: topTask.taskId,
      title: topTask.title,
      description: topTask.description,
      assignee: topTask.assignee,
      budget: topTask.budget,
      createdAt: topTask.createdAt,
      dueDate: topTask.dueDate,
      confidenceScore: 75,
      matchReasons: [
        `Top budget match with ${topTask.utilizationPercentage}% utilization`,
        `Amount: $${topTask.receiptAmount} of $${topTask.budget} budget`
      ],
    };
  }
}

export const toolService = new ToolService();



/**
 * Helper to send SSE event
 */
function sendSSE(res: Response, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  // Force flush to send immediately
  if (typeof (res as any).flush === 'function') {
    (res as any).flush();
  }
}


/*
"Why use LLM here?":
For learning purposes. I
n production, I'd use deterministic logic here. 
The LLM already helped us find and rank tasks. 
The final selection is business logic - you want control over that."
*/