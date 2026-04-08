const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const { upload, uploadVideo, handleMulterError } = require('../middleware/fileValidator');
const { analyzeMetadata } = require('../services/metadataService');
const { runMLModel } = require('../services/mlservice');
const Result = require('../models/Result');

const labelFromScore = (score) => (score >= 50 ? 'deepfake' : 'real');

// --- POST /api/analyze ------------------------------------------------------
router.post('/analyze', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided.' });
  }

  const filePath = req.file.path;

  try {
    console.log('File received:', req.file.filename);

    const [metadataResult, mlResult] = await Promise.all([
      analyzeMetadata(filePath),
      runMLModel(filePath, req.file.mimetype),
    ]);

    const modelScore = Number(mlResult.model_score);
    if (!Number.isFinite(modelScore)) {
      throw new Error('Invalid model score returned by ML service');
    }

    const prediction = mlResult.prediction || labelFromScore(modelScore);
    const confidence = Number.isFinite(mlResult.confidence)
      ? Number(mlResult.confidence)
      : Number((modelScore / 100).toFixed(6));

    const savedResult = await Result.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      final_score: modelScore,
      verdict: prediction === 'deepfake' ? 'SYNTHETIC' : 'REAL',
      confidence: confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low',
      breakdown: {
        model_score: modelScore,
        metadata_score: metadataResult.metadata_score,
      },
      flags: metadataResult.flags,
      raw_metadata: metadataResult.raw,
    });

    fs.unlink(filePath)
      .then(() => console.log('Temp file deleted'))
      .catch((e) => console.warn('Could not delete temp file:', e.message));

    return res.status(200).json({
      prediction,
      confidence,
      score: modelScore,
      final_score: modelScore,
      verdict: prediction === 'deepfake' ? 'SYNTHETIC' : 'REAL',
      breakdown: {
        model_score: modelScore,
        metadata_score: metadataResult.metadata_score,
      },
      raw_metadata: metadataResult.raw,
      flags: metadataResult.flags,
      id: savedResult._id,
      analyzed_at: savedResult.analyzed_at,
      metadata_flags: metadataResult.flags,
    });
  } catch (err) {
    fs.unlink(filePath).catch(() => {});
    console.error('Analysis error:', err.message);
    return res.status(503).json({ error: 'Analysis service failed. Please try again.' });
  }
});

// --- POST /api/analyze-video ------------------------------------------------
router.post('/analyze-video', uploadVideo.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided.' });
  }

  const filePath = req.file.path;

  try {
    console.log('Video received:', req.file.filename);

    const mlResult = await runMLModel(filePath, req.file.mimetype);
    const modelScore = Number(mlResult.model_score);
    if (!Number.isFinite(modelScore)) {
      throw new Error('Invalid video model score returned by ML service');
    }

    const verdict = modelScore >= 50 ? 'SYNTHETIC' : 'REAL';
    const confidenceBand = modelScore >= 80 ? 'High' : modelScore >= 60 ? 'Medium' : 'Low';

    const savedResult = await Result.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      final_score: modelScore,
      verdict,
      confidence: confidenceBand,
      breakdown: {
        model_score: modelScore,
        metadata_score: 50,
      },
      flags: ['Video metadata check skipped'],
      raw_metadata: null,
    });

    fs.unlink(filePath)
      .then(() => console.log('Temp video file deleted'))
      .catch((e) => console.warn('Could not delete temp video:', e.message));

    return res.status(200).json({
      message: 'Video analysis complete',
      id: savedResult._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      final_score: modelScore,
      verdict,
      confidence: confidenceBand,
      breakdown: {
        model_score: modelScore,
        metadata_score: 50,
      },
      flags: ['Video metadata check skipped'],
      raw_metadata: null,
      analyzed_at: savedResult.analyzed_at,
      frames_analyzed: mlResult.frames_analyzed || 0,
    });
  } catch (err) {
    fs.unlink(filePath).catch(() => {});
    console.error('Video Analysis error:', err.message);
    return res.status(503).json({ error: 'Video analysis service failed. Please try again.' });
  }
});

// --- GET /api/results -------------------------------------------------------
router.get('/results', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      Result.find()
        .sort({ analyzed_at: -1 })
        .skip(skip)
        .limit(limit)
        .select('-raw_metadata'),
      Result.countDocuments(),
    ]);

    return res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      results,
    });
  } catch (err) {
    console.error('Fetch results error:', err.message);
    return res.status(500).json({ error: 'Could not fetch results.' });
  }
});

// --- GET /api/results/:id ---------------------------------------------------
router.get('/results/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Result not found.' });
    }
    return res.json(result);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid result ID format.' });
    }
    console.error('Fetch result error:', err.message);
    return res.status(500).json({ error: 'Could not fetch result.' });
  }
});

router.use(handleMulterError);

module.exports = router;
