import { Router, Request, Response } from 'express';
import multer from 'multer';
import { visionService } from '../services/vision.service';
import { chainService } from '../services/chain.service';
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
 * ORCHESTRATED APPROACH - Multi-step LangChain
 * Teaching moment implementation
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

    // Parse using orchestrated approach (LangChain)
    const result = await chainService.parseReceipt(imagePath);

    // Clean up uploaded file
    try {
      unlinkSync(imagePath);
    } catch (err) {
      console.error('Error deleting uploaded file:', err);
    }

    res.json({
      success: true,
      approach: 'chain',
      ...result
    });

  } catch (error) {
    console.error('Error in chain parse route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
