import { sql } from '../config/db.js';

export const getRequests = async (req, res) => {
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
};

export const submitRequest = async (req, res) => {
  try {
    const { sender, trackName, message } = req.body;
    if (!sender || !trackName) {
      return res.status(400).json({ error: "Sender name and song title are required!" });
    }

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
};

export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (sql) {
      await sql`DELETE FROM song_requests WHERE id = ${id}`;
    }
    console.log("Admin deleted song request ID:", id);
    res.json({ success: true, message: "Song request deleted successfully!" });
  } catch (err) {
    console.error("Error deleting song request:", err);
    res.status(500).json({ error: "Failed to delete request. Please try again later." });
  }
};
