// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Initialize Opik (conditional based on API key)
import { initializeOpik } from './config/opik.config';
initializeOpik();

// Initialize vector store for task matching (optional - only if Azure OpenAI configured)
import { initializeVectorStore } from './config/vectorstore.config';

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import receiptRouter from './routes/receipt.routes';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', receiptRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   Demo 2: Receipt Parsing with Vision                ║
║                                                       ║
║   Server running at: http://localhost:${PORT}         ║
║                                                       ║
║   Endpoints:                                          ║
║   - GET  /health                                      ║
║   - POST /api/parse/simple     (Single Vision call)  ║
║   - POST /api/parse/chain      (LangChain orchestr.) ║
║   - POST /api/match            (Tool calling)        ║
║   - POST /api/match/stream     (SSE streaming) 🌟    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  // Initialize vector store for task matching (optional)
  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    try {
      await initializeVectorStore();
      console.log('✓ Task matching feature enabled (Azure OpenAI configured)\n');
    } catch (error) {
      console.warn('⚠️  Task matching feature disabled - vector store initialization failed');
      console.warn('   Check Azure OpenAI configuration if you want to use /api/match endpoint\n');
    }
  } else {
    console.log('ℹ️  Task matching feature disabled (Azure OpenAI not configured)');
    console.log('   Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT to enable /api/match endpoint\n');
  }
});
