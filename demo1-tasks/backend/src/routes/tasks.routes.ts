import { Router, Request, Response } from 'express';
import { dataService } from '../services/data.service';
import { llmService } from '../services/llm.service';
import { TaskQuerySchema } from '../schemas/query.schema';

const router = Router();

/**
 * GET /api/tasks
 * Get all tasks
 */
router.get('/tasks', (req: Request, res: Response) => {
  try {
    const tasks = dataService.getAllTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/users
 * Get all users
 */
router.get('/users', (req: Request, res: Response) => {
  try {
    const users = dataService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/**
 * POST /api/query/traditional
 * BEFORE implementation - Traditional structured query
 * Expects a TaskQuery object in the request body
 */
router.post('/query/traditional', (req: Request, res: Response) => {
  try {
    // Validate the query against our schema
    const query = TaskQuerySchema.parse(req.body);

    // Filter tasks using traditional approach
    const tasks = dataService.filterTasks(query);

    res.json({
      success: true,
      approach: 'traditional',
      query,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid query format',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/query/natural
 * AFTER implementation - Natural language query with LLM
 * Expects { query: string } in the request body
 */
router.post('/query/natural', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query string is required'
      });
    }

    // Parse natural language query using LLM
    const result = await llmService.parseNaturalLanguageQuery(query);

    // Handle different response types
    if (result.status === 'success') {
      // Filter tasks using the parsed query
      const tasks = dataService.filterTasks(result.query);

      return res.json({
        success: true,
        approach: 'natural-language',
        originalQuery: query,
        parsedQuery: result.query,
        explanation: result.explanation,
        data: tasks,
        count: tasks.length
      });
    } else if (result.status === 'needs_clarification') {
      return res.json({
        success: true,
        approach: 'natural-language',
        originalQuery: query,
        needsClarification: true,
        message: result.message,
        suggestions: result.suggestions
      });
    } else {
      // Invalid query
      return res.status(400).json({
        success: false,
        approach: 'natural-language',
        originalQuery: query,
        error: result.reason
      });
    }
  } catch (error) {
    console.error('Error processing natural language query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process query',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
