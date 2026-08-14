import express from 'express';
import { getRequests, submitRequest, deleteRequest } from '../controllers/requestController.js';
import { adminAuthMiddleware } from '../middlewares/auth.js';
import { requestLimiter, adminActionLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.get('/requests', getRequests);
router.post('/requests', requestLimiter, submitRequest);

router.delete('/admin/requests/:id', adminActionLimiter, adminAuthMiddleware, deleteRequest);

export default router;
