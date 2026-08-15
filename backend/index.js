import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import helmet from 'helmet';
import { createServer } from 'http';

import { initSocket } from './services/socket.js';
import { isAllowedOrigin } from './middlewares/cors.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import { uploadsDir } from './middlewares/upload.js';
import { getServerHealth } from './controllers/healthController.js';

import songRoutes from './routes/songRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxy (e.g., Render, Heroku, Nginx) so rate limiter accurately tracks client IPs
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:"],
      workerSrc: ["'self'", "blob:"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

app.use('/uploads', (req, res, next) => {
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}, express.static(uploadsDir));

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  console.log('Serving frontend from:', frontendDist);
}

app.use('/api/', generalLimiter);

app.use('/api', songRoutes);
app.use('/api', routeRoutes);
app.use('/api', requestRoutes);
app.use('/api', adminRoutes);
app.use('/api', healthRoutes);
app.use('/api', statsRoutes);

app.get('/health', getServerHealth);

if (fs.existsSync(frontendDist)) {
  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: "Endpoint not found" });
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err.message && err.message.startsWith('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: Origin not allowed' });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An internal server error occurred." });
});

const server = createServer(app);
initSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bus Playlist Retro Vibe API server running on port ${PORT}`);
});
