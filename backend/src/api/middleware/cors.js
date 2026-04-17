import cors from 'cors';
import { CONFIG } from '../../config/constants.js';

export const corsMiddleware = cors({
  origin: function(origin, callback) {
    if (!origin || CONFIG.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Agent-Name', 'X-layeroi-Key'],
});
