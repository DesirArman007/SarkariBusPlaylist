import express from 'express';
import { getSongs, uploadSong, deleteSong } from '../controllers/songController.js';
import { adminAuthMiddleware } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { adminActionLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.get('/songs', getSongs);

router.post(
  '/admin/upload-song',
  adminActionLimiter,
  adminAuthMiddleware,
  upload.fields([
    { name: 'songFile', maxCount: 1 },
    { name: 'coverFile', maxCount: 1 }
  ]),
  uploadSong
);

router.delete('/admin/songs/:id', adminActionLimiter, adminAuthMiddleware, deleteSong);

export default router;
