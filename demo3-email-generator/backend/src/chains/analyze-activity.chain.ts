import { RunnableLambda } from '@langchain/core/runnables';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { azureLLM } from '../config/azure.config.js';
import type { UserProfile, TaskActivity } from '../schemas/email.schema.js';
import {
  getAnalyzeActivitySystemPrompt,
  getAnalyzeActivityUserPrompt,
} from '../prompts/email-generation.prompts.js';
import { logChainStep, StepTimer } from '../utils/logging.utils.js';
import { EventCallback } from './index.js';

/**
 * Step 1: Analyze Activity Chain
 *
 * This chain analyzes the raw task activity data and identifies key points
 * that should be highlighted in the email.
 *
 * It focuses on:
 * - Urgent items (overdue tasks)
 * - Active discussions (tasks with comments)
 * - Progress highlights (completed tasks)
 * - Overall workload assessment
 */

export interface AnalyzeActivityInput {
  user: UserProfile;
  taskActivity: TaskActivity;
  recentActivity: any[];
  overdueTasks: any[];
  inProgressTasks: any[];
}

export interface AnalyzeActivityOutput extends AnalyzeActivityInput {
  activityAnalysis: string;
}

export function buildAnalyzeActivityChain(sendEvent: EventCallback = () => {}){
 return RunnableLambda.from(
  async (input: AnalyzeActivityInput,): Promise<AnalyzeActivityOutput> => {
    const { taskActivity, recentActivity, overdueTasks, inProgressTasks } = input;
    sendEvent("progress", { step: "analyze", message: "📊 Analyzing user activity data" });

    // Get prompts from centralized location
    const systemPrompt = getAnalyzeActivitySystemPrompt();
    const userPrompt = getAnalyzeActivityUserPrompt(
      taskActivity,
      recentActivity,
      overdueTasks,
      inProgressTasks
    );

    // Invoke LLM to analyze the activity
    const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)];
    const response = await azureLLM.invoke(messages);
    sendEvent("step_complete", {
         step: "analyze",
         message: "✅ Analyzing user activity data complete",
       });
    return {
      ...input,
      activityAnalysis: response.content as string,
    };
  }
);
  
}

