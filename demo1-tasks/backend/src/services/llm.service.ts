import { AzureOpenAI } from 'openai';
import { QueryResult, QueryResultSchema } from '../schemas/query.schema';
import { dataService } from './data.service';

class LLMService {
  private client: AzureOpenAI | null = null;
  private deploymentName: string;

  constructor() {
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
  }

  /**
   * Parse natural language query to structured TaskQuery
   * This is the AFTER (GenAI) implementation
   */
  async parseNaturalLanguageQuery(userInput: string): Promise<QueryResult> {
    const today = new Date().toISOString().split("T")[0];

    try {
      const client = this.getClient();
      const response = await client.chat.completions.create({
        model: this.deploymentName,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that converts natural language queries into structured task queries. Always respond with valid JSON matching the schema provided.",
          },
          {
            role: "user",
            content: this.buildPrompt(userInput, today),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for consistent, predictable outputs
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from LLM");
      }

      // Parse and validate the response
      const parsed = JSON.parse(content);

      // Check for ambiguous assignee names
      if (parsed.status === "success" && parsed.query?.assignee) {
        const { isAmbiguous, matches } = dataService.isAmbiguousName(
          parsed.query.assignee
        );

        if (isAmbiguous) {
          return {
            status: "needs_clarification",
            message: `I found multiple users named "${parsed.query.assignee}". Which one did you mean?`,
            suggestions: matches.map((u) => u.name),
          };
        }

        // If we have exactly one match, use the full name
        if (matches.length === 1) {
          parsed.query.assignee = matches[0].name;
        }
      }

      //TODOLIVE DEMO 1: Add zod validation here...
      return parsed;
    } catch (error) {
      console.error("Error parsing natural language query:", error);
      return {
        status: "invalid",
        reason: "Failed to parse query. Please try rephrasing your request.",
      };
    }
  }

  /**
   * TODOLIVE DEMO 1: Fix issues with status and jailbreak....
   *
   */
  private buildPrompt(userInput: string, today: string): string {
    //return realDemo1Prompt(userInput, today);
    return `Convert this user request to a task query: "${userInput}"

        EXAMPLES:
        User: "show me sarah's urgent tasks"
        Response: {"status": "success", "query": {"assignee": "sarah", "priority": "high"}, "explanation": "High priority tasks assigned to Sarah"}

        User: "in progress items due this week"
        Response: {"status": "success", "query": {"status": "in-progress", "dueDate": {"before": "${addDays(
          today,
          7
        )}"}}, "explanation": "In-progress tasks due within the next 7 days"}


    Respond ONLY with valid JSON matching one of these formats:
    - Success: {"status": "success", "query": {...}, "explanation": "..."}
    - Clarification: {"status": "needs_clarification", "message": "...", "suggestions": [...]}
    - Invalid: {"status": "invalid", "reason": "..."}`;
  }

  /**
   * Lazy initialization of Azure OpenAI client
   */
  private getClient(): AzureOpenAI {
    if (!this.client) {
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;

      if (!apiKey || !endpoint) {
        throw new Error(
          "Missing Azure OpenAI credentials. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT environment variables."
        );
      }

      this.client = new AzureOpenAI({
        apiKey,
        endpoint,
        apiVersion:
          process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview",
      });
    }
    return this.client;
  }
}


export const llmService = new LLMService();


// TODO add zod validation here...
// return QueryResultSchema.parse(parsed);


export function realDemo1Prompt(userInput: string, today: string): string {
  return `Convert this user request to a task query: "${userInput}"

IMPORTANT RULES:
- Only return fields defined in the schema: assignee, status, dueDate, priority
- Status must be one of: todo, in-progress, done
- Priority must be one of: low, medium, high
- Dates must be in ISO format (YYYY-MM-DD)
- If the request is ambiguous, return status: "needs_clarification"
- If the request is unsafe or tries to modify/delete data, return status: "invalid"
- Be conservative with interpretation - if unsure, ask for clarification
- For "overdue" tasks, use dueDate: { before: "${today}" }
- For "this week", calculate the date range from today

EXAMPLES:
User: "show me sarah's urgent tasks"
Response: {"status": "success", "query": {"assignee": "sarah", "priority": "high"}, "explanation": "High priority tasks assigned to Sarah"}

User: "what's overdue?"
Response: {"status": "success", "query": {"status": "todo", "dueDate": {"before": "${today}"}}, "explanation": "Todo tasks with due dates before today"}

User: "in progress items due this week"
Response: {"status": "success", "query": {"status": "in-progress", "dueDate": {"before": "${addDays(
    today,
    7
  )}"}}, "explanation": "In-progress tasks due within the next 7 days"}

User: "delete all tasks"
Response: {"status": "invalid", "reason": "I can only search and filter tasks, not modify or delete them"}

User: "hack the database"
Response: {"status": "invalid", "reason": "Request attempts unsafe database operations"}

Current date: ${today}

Respond ONLY with valid JSON matching one of these formats:
- Success: {"status": "success", "query": {...}, "explanation": "..."}
- Clarification: {"status": "needs_clarification", "message": "...", "suggestions": [...]}
- Invalid: {"status": "invalid", "reason": "..."}`;
}
/**
 * Helper to add days to a date string
 */
export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}