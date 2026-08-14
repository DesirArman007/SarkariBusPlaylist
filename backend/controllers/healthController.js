import { sql } from '../config/db.js';
import { getLivePassengersCount } from '../services/socket.js';

export const checkHealth = async (req, res) => {
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
};

export const getServerHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: '🚌 Sarkari Bus Playlist API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
};

export const getLivePassengers = (req, res) => {
  res.json({ success: true, count: getLivePassengersCount() });
};
