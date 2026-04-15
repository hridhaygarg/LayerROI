import express from 'express';
import { verifyAuth } from '../../middleware/auth.js';
import analyticsRoutes from '../analytics.routes.js';

const router = express.Router();

// Attach analytics routes with auth middleware at /api/analytics
router.use('/api/analytics', verifyAuth, analyticsRoutes);

export default router;
