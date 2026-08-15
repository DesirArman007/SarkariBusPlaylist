import { sql } from '../config/db.js';

export const getVisitorCount = async (req, res) => {
  try {
    if (!sql) return res.status(503).json({ error: "Database not connected" });
    const result = await sql`SELECT value FROM site_stats WHERE id = 'visitor_count'`;
    const count = result.length > 0 ? result[0].value : 0;
    res.json({ count });
  } catch (error) {
    console.error("Error getting visitor count:", error);
    res.status(500).json({ error: "Failed to get visitor count" });
  }
};

export const incrementVisitorCount = async (req, res) => {
  try {
    if (!sql) return res.status(503).json({ error: "Database not connected" });
    const result = await sql`
      UPDATE site_stats
      SET value = value + 1
      WHERE id = 'visitor_count'
      RETURNING value
    `;
    const count = result.length > 0 ? result[0].value : 0;
    res.json({ count });
  } catch (error) {
    console.error("Error incrementing visitor count:", error);
    res.status(500).json({ error: "Failed to increment visitor count" });
  }
};
