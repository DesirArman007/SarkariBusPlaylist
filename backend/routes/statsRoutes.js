import express from 'express';
import { getVisitorCount, incrementVisitorCount } from '../controllers/statsController.js';

const router = express.Router();

router.get('/stats/visitors', getVisitorCount);
router.post('/stats/visitors/increment', incrementVisitorCount);

export default router;
