import express from 'express';
import { checkHealth, getLivePassengers } from '../controllers/healthController.js';

const router = express.Router();

router.get('/health', checkHealth); // /api/health
router.get('/live-passengers', getLivePassengers); // /api/live-passengers

export default router;
