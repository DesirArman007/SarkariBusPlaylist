import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { neon } from '@neondatabase/serverless';

import { createServer } from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Helmet sets standard HTTP security headers (CSP, X-Frame-Options, HSTS, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow audio/image loading
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "https:"],  // Allow audio/video from CDNs
      connectSrc: ["'self'", "wss:", "ws:", "https:"], // Allow WebSocket + API calls
      workerSrc: ["'self'", "blob:"],
    },
  },
}));

// Security: Restrict CORS to known origins only
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://sarkari-bus-playlist.vercel.app',
];
// Add production Vercel frontend URL from env
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Regex to match Vercel preview deployment URLs for this project
// e.g. https://sarkari-bus-playlist-abc123xyz.vercel.app
const vercelPreviewRegex = /^https:\/\/sarkari-bus-playlist(-[a-z0-9]+)*\.vercel\.app$/;

/**
 * Check if an origin is allowed by the CORS policy.
 * Accepts exact matches from the allowedOrigins list and
 * any Vercel preview deployment URL matching the project pattern.
 */
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // No origin (mobile apps, curl, Postman)
  if (allowedOrigins.includes(origin)) return true;
  if (vercelPreviewRegex.test(origin)) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' })); // Limit JSON body size

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded audio and cover pictures statically with security headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('X-Content-Type-Options', 'nosniff'); // Security: Prevent MIME sniffing
  next();
}, express.static(uploadsDir));

// Serve the Vite-built frontend in production
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  console.log('🎨 Serving frontend from:', frontendDist);
}

// Security: File type validation for multer uploads
const ALLOWED_AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|aac|m4a|wma)$/i;
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'coverFile' ? 'cover' : 'audio';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max upload size
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'songFile' && ALLOWED_AUDIO_EXTENSIONS.test(ext)) {
      return cb(null, true);
    }
    if (file.fieldname === 'coverFile' && ALLOWED_IMAGE_EXTENSIONS.test(ext)) {
      return cb(null, true);
    }
    cb(new Error(`Invalid file type: ${ext}. Only audio (mp3, wav, ogg, flac, aac, m4a) and image (jpg, png, webp, gif) files are allowed.`));
  }
});

// Neon PostgreSQL database client
const DATABASE_URL = process.env.DATABASE_URL;
let sql = null;

if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
    console.log("⚡ Neon PostgreSQL database client initialized!");
  } catch (err) {
    console.error("⚠️ Failed to initialize Neon PostgreSQL client:", err);
  }
} else {
  console.warn("⚠️ DATABASE_URL missing from environment!");
}

// Initialize Database Tables
async function initDatabase() {
  if (!sql) return;
  try {
    // 1. Create Playlists Table
    await sql`
      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        badge TEXT
      );
    `;

    // 2. Create Tracks Table
    await sql`
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY,
        playlist_id TEXT REFERENCES playlists(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        movie TEXT,
        artist TEXT,
        duration TEXT,
        audio_url TEXT,
        synth_melody TEXT,
        cover_color TEXT
      );
    `;

    // 3. Create Bus Routes Table
    await sql`
      CREATE TABLE IF NOT EXISTS bus_routes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        operator TEXT,
        bus_number TEXT,
        departure TEXT,
        destination TEXT,
        distance TEXT,
        speed_kmvh INT,
        tagline TEXT
      );
    `;

    // 4. Create Song Requests Table
    await sql`
      CREATE TABLE IF NOT EXISTS song_requests (
        id SERIAL PRIMARY KEY,
        sender TEXT NOT NULL,
        track_name TEXT NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log("✅ Neon PostgreSQL database schema verified!");
  } catch (err) {
    console.error("Error initializing database schema:", err);
  }
}

initDatabase();

// ──────────────────────────────────────────────────────────────
// Security: Rate limiters
// ──────────────────────────────────────────────────────────────

// Strict limiter for admin login — 5 attempts per 15 min window
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// Moderate limiter for song requests — 10 per minute
const requestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many song requests. Please slow down!" },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter for admin upload/delete — 20 per 10 minutes
const adminActionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: "Too many admin actions. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

// General API limiter — 100 requests per minute
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);

// ──────────────────────────────────────────────────────────────
// Security: Timing-safe admin key comparison
// ──────────────────────────────────────────────────────────────

const getAdminSecretKey = () => (process.env.SYS_BUS_SESSION_HASH || process.env.ADMIN_SECRET_KEY || '').replace(/^["']|["']$/g, '').trim();

/**
 * Timing-safe comparison to prevent timing attacks on the admin key.
 * Uses crypto.timingSafeEqual with fixed-length buffers.
 */
const safeCompare = (provided, expected) => {
  if (!provided || !expected) return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) {
    // Compare against expected anyway to maintain constant time
    crypto.timingSafeEqual(bufB, bufB);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

// Admin authentication middleware — only accepts key from x-admin-key header
const adminAuthMiddleware = (req, res, next) => {
  const expectedKey = getAdminSecretKey();
  // Security: Only accept admin key from the x-admin-key header (not query string or body)
  const providedKey = (req.headers['x-admin-key'] || '').trim();
  if (!expectedKey || !providedKey || !safeCompare(providedKey, expectedKey)) {
    console.warn("⛔ Unauthorized admin attempt blocked!");
    return res.status(401).json({
      error: "Unauthorized: Invalid or missing Admin Secret Key! Access restricted to admins only."
    });
  }
  next();
};

// ──────────────────────────────────────────────────────────────
// Security: URL validation helper (SSRF prevention)
// ──────────────────────────────────────────────────────────────

const isValidExternalUrl = (urlString) => {
  if (!urlString) return true; // Empty is fine (optional fields)
  try {
    const parsed = new URL(urlString);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    // Block private/internal IPs
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      'localhost', '127.0.0.1', '0.0.0.0',
      '169.254.', '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
      '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
      '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
      '[::1]', 'metadata.google', '169.254.169.254'
    ];
    for (const pattern of blockedPatterns) {
      if (hostname === pattern || hostname.startsWith(pattern)) return false;
    }
    return true;
  } catch {
    return false;
  }
};

// ──────────────────────────────────────────────────────────────
// API Endpoints
// ──────────────────────────────────────────────────────────────

// 1. API Health Check Endpoint — no longer leaks PG version
app.get('/api/health', async (req, res) => {
  try {
    let dbStatus = "Disconnected";
    if (sql) {
      await sql`SELECT 1`;
      dbStatus = "Connected";
    }
    res.json({
      status: "ok",
      service: "Bus Playlist Retro Vibe API",
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Health check error:", err);
    res.status(500).json({ status: "error", error: "Health check failed" });
  }
});

// 2. Get playlists and tracks directly from Neon DB
app.get('/api/songs', async (req, res) => {
  try {
    if (sql) {
      const plRows = await sql`SELECT * FROM playlists`;
      const trRows = await sql`SELECT * FROM tracks ORDER BY id DESC`;

      const allTracks = trRows.map(tr => ({
        id: tr.id,
        playlist_id: tr.playlist_id,
        title: tr.title,
        movie: tr.movie,
        artist: tr.artist,
        duration: tr.duration,
        audioUrl: tr.audio_url,
        coverUrl: tr.cover_color && (tr.cover_color.startsWith('/uploads') || tr.cover_color.startsWith('http')) ? tr.cover_color : undefined,
        synthMelody: tr.synth_melody,
        coverColor: tr.cover_color
      }));

      const formattedPlaylists = plRows.map(pl => {
        const playlistTracks = allTracks.filter(tr => tr.playlist_id === pl.id);
        return {
          id: pl.id,
          title: pl.title,
          description: pl.description,
          badge: pl.badge,
          tracks: playlistTracks.length > 0 ? playlistTracks : allTracks
        };
      });

      return res.json({
        success: true,
        playlists: formattedPlaylists,
        tracks: allTracks
      });
    }
    res.json({ success: true, playlists: [], tracks: [] });
  } catch (err) {
    console.error("Error fetching songs from DB:", err);
    res.status(500).json({ error: "Failed to fetch songs. Please try again later." });
  }
});

// 3. Get bus routes directly from Neon DB
app.get('/api/routes', async (req, res) => {
  try {
    if (sql) {
      const routeRows = await sql`SELECT * FROM bus_routes`;
      const formattedRoutes = routeRows.map(r => ({
        id: r.id,
        name: r.name,
        operator: r.operator,
        busNumber: r.bus_number,
        departure: r.departure,
        destination: r.destination,
        distance: r.distance,
        speedKmvh: r.speed_kmvh,
        tagline: r.tagline
      }));
      return res.json({ success: true, routes: formattedRoutes });
    }
    res.json({ success: true, routes: [] });
  } catch (err) {
    console.error("Error fetching routes:", err);
    res.status(500).json({ error: "Failed to fetch routes. Please try again later." });
  }
});

// 4. Get song requests
app.get('/api/requests', async (req, res) => {
  try {
    if (sql) {
      const rows = await sql`SELECT * FROM song_requests ORDER BY id DESC LIMIT 50`;
      const formatted = rows.map(r => ({
        id: r.id,
        sender: r.sender,
        trackName: r.track_name,
        message: r.message,
        time: r.created_at || null
      }));
      return res.json({ success: true, requests: formatted });
    }
    res.json({ success: true, requests: [] });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: "Failed to fetch requests. Please try again later." });
  }
});

// 5. Submit a song request — rate limited
app.post('/api/requests', requestLimiter, async (req, res) => {
  try {
    const { sender, trackName, message } = req.body;
    if (!sender || !trackName) {
      return res.status(400).json({ error: "Sender name and song title are required!" });
    }

    // Security: Input length validation
    const senderTrimmed = sender.trim().slice(0, 100);
    const trackNameTrimmed = trackName.trim().slice(0, 200);
    const messageTrimmed = message ? message.trim().slice(0, 500) : "Dedicated to everyone on this bus journey!";

    if (sql) {
      const result = await sql`
        INSERT INTO song_requests (sender, track_name, message)
        VALUES (${senderTrimmed}, ${trackNameTrimmed}, ${messageTrimmed})
        RETURNING id, sender, track_name as "trackName", message, created_at;
      `;
      return res.status(201).json({ success: true, data: { ...result[0], time: "Just now" } });
    }

    const newReq = { id: Date.now(), sender: senderTrimmed, trackName: trackNameTrimmed, message: messageTrimmed, time: "Just now" };
    res.status(201).json({ success: true, data: newReq });
  } catch (err) {
    console.error("Error submitting request:", err);
    res.status(500).json({ error: "Failed to submit request. Please try again later." });
  }
});

// 6. RESTRICTED ADMIN ENDPOINT: Upload Song & Cover Picture directly to Neon PostgreSQL DB
app.post('/api/admin/upload-song', adminActionLimiter, adminAuthMiddleware, upload.fields([
  { name: 'songFile', maxCount: 1 },
  { name: 'coverFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, artist, movie, playlistId, directAudioUrl, directCoverUrl } = req.body;
    
    // Security: Validate external URLs to prevent SSRF
    if (directAudioUrl && !isValidExternalUrl(directAudioUrl.trim())) {
      return res.status(400).json({ error: "Invalid audio URL. Only public http/https URLs are allowed." });
    }
    if (directCoverUrl && !isValidExternalUrl(directCoverUrl.trim())) {
      return res.status(400).json({ error: "Invalid cover URL. Only public http/https URLs are allowed." });
    }

    let audioUrl = directAudioUrl ? directAudioUrl.trim() : null;
    if (req.files && req.files['songFile'] && req.files['songFile'].length > 0) {
      audioUrl = `/uploads/${req.files['songFile'][0].filename}`;
    }

    if (!title || !audioUrl) {
      return res.status(400).json({ error: "Song title and audio file/URL are required!" });
    }

    let coverUrl = directCoverUrl ? directCoverUrl.trim() : null;
    if (req.files && req.files['coverFile'] && req.files['coverFile'].length > 0) {
      coverUrl = `/uploads/${req.files['coverFile'][0].filename}`;
    }

    const targetPlaylistId = playlistId || "90s-golden";
    const trackId = `tr-user-${Date.now()}`;
    const trackTitle = title.trim().slice(0, 200);
    const trackArtist = artist ? artist.trim().slice(0, 100) : "Unknown Artist";
    const trackMovie = movie ? movie.trim().slice(0, 200) : "Single / Upload";
    const trackDuration = "03:45";

    if (sql) {
      await sql`
        INSERT INTO tracks (id, playlist_id, title, movie, artist, duration, audio_url, synth_melody, cover_color)
        VALUES (${trackId}, ${targetPlaylistId}, ${trackTitle}, ${trackMovie}, ${trackArtist}, ${trackDuration}, ${audioUrl}, 'C4,E4,G4,C5', ${coverUrl || '#e67e22'})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    const newTrack = {
      id: trackId,
      playlist_id: targetPlaylistId,
      title: trackTitle,
      artist: trackArtist,
      movie: trackMovie,
      duration: trackDuration,
      audioUrl: audioUrl,
      coverUrl: coverUrl,
      synthMelody: "C4,E4,G4,C5"
    };

    console.log("🎵 Admin Song Uploaded Successfully to Neon DB:", newTrack.title);
    res.status(201).json({ success: true, track: newTrack });
  } catch (err) {
    console.error("Error uploading song:", err);
    res.status(500).json({ error: "Failed to save song. Please try again later." });
  }
});

// Admin Login Verification Endpoint — rate limited
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { password } = req.body || {};
  const expectedKey = getAdminSecretKey();

  if (!expectedKey) {
    return res.status(500).json({ success: false, error: "Server configuration error. Contact administrator." });
  }

  if (password && safeCompare(password.trim(), expectedKey)) {
    return res.json({ success: true, message: "Admin authenticated successfully!" });
  }
  return res.status(401).json({ success: false, error: "Invalid Admin Passcode!" });
});

// Admin Delete Song Endpoint — rate limited
app.delete('/api/admin/songs/:id', adminActionLimiter, adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (sql) {
      await sql`DELETE FROM tracks WHERE id = ${id}`;
    }
    console.log("🗑️ Admin deleted song ID:", id);
    res.json({ success: true, message: "Song deleted successfully!" });
  } catch (err) {
    console.error("Error deleting song:", err);
    res.status(500).json({ error: "Failed to delete song. Please try again later." });
  }
});

// Admin Delete Song Request Endpoint — rate limited
app.delete('/api/admin/requests/:id', adminActionLimiter, adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (sql) {
      await sql`DELETE FROM song_requests WHERE id = ${id}`;
    }
    console.log("🗑️ Admin deleted song request ID:", id);
    res.json({ success: true, message: "Song request deleted successfully!" });
  } catch (err) {
    console.error("Error deleting song request:", err);
    res.status(500).json({ error: "Failed to delete request. Please try again later." });
  }
});

// ──────────────────────────────────────────────────────────────
// Live Active Passengers Counter (WebSocket + HTTP API)
// ──────────────────────────────────────────────────────────────

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true,          // backward compatibility
  pingTimeout: 60000,       // 60s — prevent premature disconnect on Render
  pingInterval: 25000,      // 25s — keep connection alive
  transports: ['polling', 'websocket']  // match client transport order
});

let connectedPassengersCount = 0;

io.on('connection', (socket) => {
  connectedPassengersCount++;
  console.log(`🚌 Passenger onboarded! Active live count: ${connectedPassengersCount}`);
  io.emit('live-passengers-count', connectedPassengersCount);

  socket.on('disconnect', () => {
    connectedPassengersCount = Math.max(0, connectedPassengersCount - 1);
    console.log(`🚌 Passenger departed. Active live count: ${connectedPassengersCount}`);
    io.emit('live-passengers-count', connectedPassengersCount);
  });
});

app.get('/api/live-passengers', (req, res) => {
  res.json({ success: true, count: Math.max(1, connectedPassengersCount) });
});

// Health check endpoint — used by Render health checks & UptimeRobot keep-alive pinging
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: '🚌 Sarkari Bus Playlist API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Catch-all: serve React app for any non-API route (React Router support)
if (fs.existsSync(frontendDist)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global error handler for multer file type errors
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚌 Bus Playlist Retro Vibe API server running on port ${PORT}`);
});
