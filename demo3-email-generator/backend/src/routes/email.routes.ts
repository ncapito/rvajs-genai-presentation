import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getVectorStore } from '../config/vectorstore.config.js';
import { generateEmailWithTracing, createFullEmailChain } from '../chains/email.chains.js';
import { getEmailGenerationTracingConfig } from '../config/langsmith.config.js';
import type { UserProfile, TaskActivity } from '../schemas/email.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Load mock data
const usersPath = join(__dirname, '../data/users.json');
const tasksPath = join(__dirname, '../data/tasks.json');

const users: UserProfile[] = JSON.parse(readFileSync(usersPath, 'utf-8'));
const taskData = JSON.parse(readFileSync(tasksPath, 'utf-8'));

/**
 * GET /api/users
 * Get all user profiles
 */
router.get('/users', (req: Request, res: Response) => {
  res.json({ users });
});

/**
 * GET /api/users/:userId
 * Get a specific user profile
 */
router.get('/users/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

/**
 * POST /api/generate-email
 * Generate a personalized email for a specific user
 *
 * Query params:
 * - trace=true: Enable LangSmith tracing for this request (if LANGCHAIN_TRACING_V2=true)
 */
router.post('/generate-email', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const enableTracing = req.query.trace == 'true';

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Find user
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`\nGenerating email for ${user.name} (${user.userType})...`);
    if (enableTracing) {
      console.log('🔍 LangSmith tracing enabled for this request');
    }

    // Get vector store
    const vectorStore = getVectorStore();

    // Get tracing config
    const tracingConfig = getEmailGenerationTracingConfig(
      userId,
      user.userType,
      {
        enabled: enableTracing,
        includeMemes: user.preferences.includeMemes,
      }
    );

    // Prepare input data
    const input = {
      user,
      taskActivity: taskData.taskActivity as TaskActivity,
      recentActivity: taskData.recentActivity,
      overdueTasks: taskData.overdueTasks,
      inProgressTasks: taskData.inProgressTasks,
      tracingConfig, // Pass tracing config to chains
    };

    // Invoke the chain with tracing
    const startTime = Date.now();
    const result = await generateEmailWithTracing(input, vectorStore);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Email generated in ${duration}ms for ${user.name}`);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        userType: user.userType,
      },
      email: result.email,
      metadata: {
        generationTime: duration,
        style: result.emailStyle,
        traced: enableTracing,
      },
    });
  } catch (error: any) {
    console.error('Error generating email:', error);
    res.status(500).json({
      error: 'Failed to generate email',
      message: error.message,
    });
  }
});

/**
 * POST /api/generate-email-batch
 * Generate emails for all users at once
 */
router.post('/generate-email-batch', async (req: Request, res: Response) => {
  try {
    console.log('Generating emails for all users...');

    // Get vector store
    const vectorStore = getVectorStore();

    // Create the full email chain
    const emailChain = createFullEmailChain(vectorStore);

    // Generate emails for all users in parallel
    const startTime = Date.now();
    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const input = {
            user,
            taskActivity: taskData.taskActivity as TaskActivity,
            recentActivity: taskData.recentActivity,
            overdueTasks: taskData.overdueTasks,
            inProgressTasks: taskData.inProgressTasks,
          };

          const result = await emailChain.invoke(input);

          return {
            success: true,
            user: {
              id: user.id,
              name: user.name,
              userType: user.userType,
            },
            email: result.email,
            style: result.emailStyle,
          };
        } catch (error: any) {
          console.error(`Failed to generate email for ${user.name}:`, error);
          return {
            success: false,
            user: {
              id: user.id,
              name: user.name,
              userType: user.userType,
            },
            error: error.message,
          };
        }
      })
    );

    const duration = Date.now() - startTime;
    console.log(`All emails generated in ${duration}ms`);

    res.json({
      success: true,
      results,
      metadata: {
        totalTime: duration,
        successCount: results.filter((r) => r.success).length,
        failureCount: results.filter((r) => !r.success).length,
      },
    });
  } catch (error: any) {
    console.error('Error generating batch emails:', error);
    res.status(500).json({
      error: 'Failed to generate batch emails',
      message: error.message,
    });
  }
});

/**
 * GET /api/task-data
 * Get the task activity data (same for all users)
 */
router.get('/task-data', (req: Request, res: Response) => {
  res.json(taskData);
});

export default router;
