import express from 'express';
import {
  getBusVideo,
  getBusVideos,
  setActiveBusVideo,
  updateBusVideo
} from '../controllers/videoController.js';
import { adminAuthMiddleware } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import { adminActionLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public: Get currently active bus video
router.get('/bus-video', getBusVideo);

// Admin: Get all bus videos
router.get('/admin/bus-videos', adminActionLimiter, adminAuthMiddleware, getBusVideos);

// Admin: Set active bus video
router.put('/admin/bus-videos/:id/active', adminActionLimiter, adminAuthMiddleware, setActiveBusVideo);

// Admin: Upload / add new bus video
router.post(
  '/admin/bus-video',
  adminActionLimiter,
  adminAuthMiddleware,
  upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'mobileVideoFile', maxCount: 1 }
  ]),
  updateBusVideo
);

export default router;
