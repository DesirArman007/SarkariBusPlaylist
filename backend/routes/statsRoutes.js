import express from 'express';
import { getVisitorCount, incrementVisitorCount } from '../controllers/statsController.js';

const router = express.Router();

router.get('/board/passengers', getVisitorCount);
router.post('/board/passengers/join', incrementVisitorCount);

export default router;
