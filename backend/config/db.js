import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL;
let sql = null;

if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
    console.log("Neon PostgreSQL database client initialized!");
  } catch (err) {
    console.error("Failed to initialize Neon PostgreSQL client:", err);
  }
} else {
  console.warn("DATABASE_URL missing from environment!");
}

async function initDatabase() {
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        badge TEXT
      );
    `;

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

    try {
      await sql`ALTER TABLE tracks ADD COLUMN is_default BOOLEAN DEFAULT false`;
    } catch (err) {
      // Column might already exist, ignore error
    }

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

    await sql`
      CREATE TABLE IF NOT EXISTS song_requests (
        id SERIAL PRIMARY KEY,
        sender TEXT NOT NULL,
        track_name TEXT NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS site_stats (
        id TEXT PRIMARY KEY,
        value INT NOT NULL DEFAULT 0
      );
    `;

    await sql`
      INSERT INTO site_stats (id, value)
      VALUES ('visitor_count', 0)
      ON CONFLICT (id) DO NOTHING;
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS bus_videos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        video_url TEXT NOT NULL,
        mobile_video_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      INSERT INTO bus_videos (id, title, video_url, mobile_video_url, is_active)
      VALUES (
        'default-bus-video',
        'Standard Indian Highway Bus View',
        'https://res.cloudinary.com/desirarman/video/upload/v1786854001/bus_playlist/videos/bus_desktop_default.mp4',
        'https://res.cloudinary.com/desirarman/video/upload/v1786853987/bus_playlist/videos/bus_mobile_default.mp4',
        true
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    console.log("Neon PostgreSQL database schema verified!");
  } catch (err) {
    console.error("Error initializing database schema:", err);
  }
}

initDatabase();

export { sql };
