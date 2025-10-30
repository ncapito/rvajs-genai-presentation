import { Router, Request, Response } from 'express';
import multer from 'multer';
import { visionService } from '../services/vision.service';
import { chainService } from '../services/chain.service';
import { matchingService } from '../services/matching.service';
import { join } from 'path';
import { unlinkSync } from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';

    if (!isImage && !isPdf) {
      return cb(new Error('Only image and PDF files are allowed'));
    }
    cb(null, true);
  }
});

/**
 * POST /api/parse/simple
 * SIMPLE APPROACH - Single Claude Vision API call
 * Primary demo implementation
 */
router.post('/parse/simple', upload.single('receipt'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No receipt image provided'
      });
    }

    const imagePath = req.file.path;

    // Parse using simple approach (single Vision call)
    const result = await visionService.parseReceipt(imagePath);

    // Clean up uploaded file
    try {
      unlinkSync(imagePath);
    } catch (err) {
      console.error('Error deleting uploaded file:', err);
    }

    res.json({
      success: true,
      approach: 'simple',
      ...result
    });

  } catch (error) {
    console.error('Error in simple parse route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/parse/chain
 * CHAIN APPROACH - LangChain Orchestration for Receipt-to-Task Matching
 * Demonstrates explicit step-by-step workflow control
 */
router.post('/parse/chain', upload.single('receipt'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No receipt image provided'
      });
    }

    const imagePath = req.file.path;

    console.log('\n[Chain Route] Starting receipt-to-task matching with LangChain...');

    // Step 1: Parse receipt using simple vision approach
    console.log('[Chain Route] Step 1: Parsing receipt...');
    const parseResult = await visionService.parseReceipt(imagePath);

    // Clean up uploaded file
    try {
      unlinkSync(imagePath);
    } catch (err) {
      console.error('Error deleting uploaded file:', err);
    }

    // Check if parsing was successful
    if (parseResult.status !== 'success') {
      return res.json({
        success: false,
        approach: 'chain',
        parseResult,
        error: 'Receipt parsing failed - cannot match to task'
      });
    }

    // Step 2: Match receipt to task using LangChain orchestration
    console.log('[Chain Route] Step 2: Matching with LangChain orchestration...');
    const matchResult = await chainService.matchReceiptToTask({
      merchant: parseResult.receipt!.merchant,
      date: parseResult.receipt!.date,
      total: parseResult.receipt!.total,
      category: parseResult.receipt!.category,
      notes: parseResult.notes,
    });

    console.log('[Chain Route] ✓ Matching complete\n');

    res.json({
      success: true,
      approach: 'chain',
      receipt: parseResult.receipt,
      matching: {
        reasoning: matchResult.reasoning,
        match: matchResult.match,
      }
    });

  } catch (error) {
    console.error('Error in chain route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process receipt with chain',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/match/stream
 * TOOL CALLING WITH SSE - Receipt to Task Matching with real-time progress
 * Streams progress updates as Claude thinks and calls tools
 * PRIMARY DEMO for showing AI reasoning process
 */
router.post('/match/stream', upload.single('receipt'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No receipt image provided'
      });
    }

    const imagePath = req.file.path;

    console.log('\n[Match Stream Route] Starting SSE receipt-to-task matching...');

    // Establish SSE connection IMMEDIATELY
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush headers immediately to establish SSE connection

    // Helper to send SSE events
    const sendSSE = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Step 1: Parse receipt using simple vision approach
    console.log('[Match Stream Route] Step 1: Parsing receipt...');
    sendSSE('progress', {
      step: 'parsing',
      message: '🔍 Analyzing receipt image with Claude Vision API...'
    });

    const parseResult = await visionService.parseReceipt(imagePath);

    // Clean up uploaded file
    try {
      unlinkSync(imagePath);
    } catch (err) {
      console.error('Error deleting uploaded file:', err);
    }

    // Check if parsing was successful
    if (parseResult.status !== 'success') {
      sendSSE('error', {
        message: 'Receipt parsing failed',
        parseResult
      });
      res.end();
      return;
    }

    // Send parsed receipt
    sendSSE('receipt_parsed', parseResult.receipt);

    // Step 2: Match receipt to task using SSE streaming
    console.log('[Match Stream Route] Step 2: Streaming matching process...');

    // Pass the parsed receipt to the matching service
    await matchingService.matchReceiptToTask(
      {
        merchant: parseResult.receipt!.merchant,
        date: parseResult.receipt!.date,
        total: parseResult.receipt!.total,
        category: parseResult.receipt!.category,
        notes: parseResult.notes,
      },
      res
    );

  } catch (error) {
    console.error('Error in match stream route:', error);

    // Try to send error via SSE if headers not sent yet
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }

    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({
      message: 'Failed to match receipt to task',
      details: error instanceof Error ? error.message : 'Unknown error'
    })}\n\n`);

    res.end();
  }
});

export default router;
