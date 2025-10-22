// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.routes';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware (for demo purposes)
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', tasksRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   Demo 1: Task App - Natural Language Querying       ║
║                                                       ║
║   Server running at: http://localhost:${PORT}         ║
║                                                       ║
║   Endpoints:                                          ║
║   - GET  /health                                      ║
║   - GET  /api/tasks                                   ║
║   - GET  /api/users                                   ║
║   - POST /api/query/traditional                       ║
║   - POST /api/query/natural                           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});
