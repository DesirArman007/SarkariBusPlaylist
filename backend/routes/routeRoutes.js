import express from 'express';
import { getRoutes } from '../controllers/routeController.js';

const router = express.Router();

router.get('/routes', getRoutes);

export default router;
