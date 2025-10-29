import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeVectorStore } from './config/vectorstore.config.js';
import { logTracingStatus } from './config/langsmith.config.js';
import emailRoutes from './routes/email.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'demo3-email-generator' });
});

// API Routes
app.use('/api', emailRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Initialize vector store and start server
async function startServer() {
  try {
    console.log('Starting Demo 3: Email Generator Backend...');

    // Initialize vector store for RAG
    console.log('Initializing vector store...');
    await initializeVectorStore();
    console.log('Vector store initialized successfully');

    // Log tracing status
    logTracingStatus();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📧 Demo 3: Email Personalization with RAG`);
      console.log(`\nAvailable endpoints:`);
      console.log(`  GET  /health - Health check`);
      console.log(`  GET  /api/users - Get all user profiles`);
      console.log(`  GET  /api/users/:userId - Get specific user`);
      console.log(`  POST /api/generate-email - Generate email for one user`);
      console.log(`       ?trace=true - Enable LangSmith tracing for this request`);
      console.log(`  POST /api/generate-email-batch - Generate emails for all users`);
      console.log(`  GET  /api/task-data - Get task activity data\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
