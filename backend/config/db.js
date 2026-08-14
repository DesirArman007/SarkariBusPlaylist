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

    console.log("Neon PostgreSQL database schema verified!");
  } catch (err) {
    console.error("Error initializing database schema:", err);
  }
}

initDatabase();

export { sql };
