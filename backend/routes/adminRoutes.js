import express from 'express';
import { login } from '../controllers/adminController.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/admin/login', loginLimiter, login);

export default router;
