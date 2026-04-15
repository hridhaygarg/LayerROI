import express from 'express';
import { verifyAuth } from '../../middleware/auth.js';
import propsepctRoutes from '../prospects.routes.js';

const router = express.Router();

// Attach prospects routes with auth middleware at /api/prospects
router.use('/api/prospects', verifyAuth, propsepctRoutes);

export default router;
