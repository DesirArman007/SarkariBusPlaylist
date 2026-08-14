import { sql } from '../config/db.js';

export const getRoutes = async (req, res) => {
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
};
