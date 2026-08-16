import { sql } from '../config/db.js';
import { cloudinary } from '../config/cloudinary.js';
import { isValidExternalUrl } from '../utils/validation.js';

const FALLBACK_BUS_VIDEO = {
  id: 'default-bus-video',
  title: 'Standard Indian Highway Bus View',
  videoUrl: 'https://res.cloudinary.com/desirarman/video/upload/v1786854001/bus_playlist/videos/bus_desktop_default.mp4',
  mobileVideoUrl: 'https://res.cloudinary.com/desirarman/video/upload/v1786853987/bus_playlist/videos/bus_mobile_default.mp4'
};

export const getBusVideo = async (req, res) => {
  try {
    if (sql) {
      const rows = await sql`
        SELECT * FROM bus_videos 
        WHERE is_active = true 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        const v = rows[0];
        return res.json({
          success: true,
          video: {
            id: v.id,
            title: v.title,
            videoUrl: v.video_url,
            mobileVideoUrl: v.mobile_video_url || v.video_url
          }
        });
      }

      // If no active video, try getting any video row
      const anyRows = await sql`SELECT * FROM bus_videos ORDER BY created_at DESC LIMIT 1`;
      if (anyRows && anyRows.length > 0) {
        const v = anyRows[0];
        return res.json({
          success: true,
          video: {
            id: v.id,
            title: v.title,
            videoUrl: v.video_url,
            mobileVideoUrl: v.mobile_video_url || v.video_url
          }
        });
      }
    }

    // Fallback if DB is unavailable or empty
    return res.json({
      success: true,
      video: FALLBACK_BUS_VIDEO
    });
  } catch (err) {
    console.error("Error fetching bus video from DB:", err);
    // Graceful fallback on DB query error
    return res.json({
      success: true,
      video: FALLBACK_BUS_VIDEO
    });
  }
};

export const getBusVideos = async (req, res) => {
  try {
    if (sql) {
      const rows = await sql`SELECT * FROM bus_videos ORDER BY created_at DESC`;
      const videos = rows.map(v => ({
        id: v.id,
        title: v.title,
        videoUrl: v.video_url,
        mobileVideoUrl: v.mobile_video_url,
        isActive: Boolean(v.is_active),
        createdAt: v.created_at
      }));
      return res.json({ success: true, videos });
    }
    return res.json({ success: true, videos: [FALLBACK_BUS_VIDEO] });
  } catch (err) {
    console.error("Error fetching all bus videos:", err);
    res.status(500).json({ error: "Failed to fetch bus videos." });
  }
};

export const setActiveBusVideo = async (req, res) => {
  try {
    const { id } = req.params;
    if (sql) {
      await sql`UPDATE bus_videos SET is_active = false`;
      await sql`UPDATE bus_videos SET is_active = true WHERE id = ${id}`;
      return res.json({ success: true, message: "Active bus video updated!" });
    }
    res.status(500).json({ error: "Database not connected" });
  } catch (err) {
    console.error("Error setting active bus video:", err);
    res.status(500).json({ error: "Failed to set active bus video." });
  }
};

export const updateBusVideo = async (req, res) => {
  try {
    const { title, directVideoUrl, directMobileVideoUrl, makeActive } = req.body;

    if (directVideoUrl && !isValidExternalUrl(directVideoUrl.trim())) {
      return res.status(400).json({ error: "Invalid desktop video URL." });
    }
    if (directMobileVideoUrl && !isValidExternalUrl(directMobileVideoUrl.trim())) {
      return res.status(400).json({ error: "Invalid mobile video URL." });
    }

    let videoUrl = directVideoUrl ? directVideoUrl.trim() : null;
    let mobileVideoUrl = directMobileVideoUrl ? directMobileVideoUrl.trim() : null;

    if (req.files && req.files['videoFile'] && req.files['videoFile'].length > 0) {
      const localFile = req.files['videoFile'][0];
      try {
        console.log("Uploading desktop bus video to Cloudinary...", localFile.path);
        const uploadRes = await cloudinary.uploader.upload(localFile.path, {
          resource_type: 'video',
          folder: 'bus_playlist/videos',
          public_id: `bus_vid_${Date.now()}`
        });
        videoUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary video upload failed, falling back to local URL:", uploadErr);
        videoUrl = `/uploads/${localFile.filename}`;
      }
    }

    if (req.files && req.files['mobileVideoFile'] && req.files['mobileVideoFile'].length > 0) {
      const localMobFile = req.files['mobileVideoFile'][0];
      try {
        console.log("Uploading mobile bus video to Cloudinary...", localMobFile.path);
        const uploadRes = await cloudinary.uploader.upload(localMobFile.path, {
          resource_type: 'video',
          folder: 'bus_playlist/videos',
          public_id: `bus_mob_vid_${Date.now()}`
        });
        mobileVideoUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        console.error("Cloudinary mobile video upload failed, falling back to local URL:", uploadErr);
        mobileVideoUrl = `/uploads/${localMobFile.filename}`;
      }
    }

    if (!videoUrl) {
      return res.status(400).json({ error: "Desktop video file or URL is required!" });
    }

    const videoId = `vid-${Date.now()}`;
    const videoTitle = (title && title.trim()) ? title.trim().slice(0, 150) : "Custom Bus Highway Video";
    const isActive = makeActive === 'true' || makeActive === true;

    if (sql) {
      if (isActive) {
        await sql`UPDATE bus_videos SET is_active = false`;
      }
      await sql`
        INSERT INTO bus_videos (id, title, video_url, mobile_video_url, is_active)
        VALUES (${videoId}, ${videoTitle}, ${videoUrl}, ${mobileVideoUrl || videoUrl}, ${isActive})
      `;
    }

    const newVideo = {
      id: videoId,
      title: videoTitle,
      videoUrl,
      mobileVideoUrl: mobileVideoUrl || videoUrl,
      isActive
    };

    console.log("Bus video saved to DB:", newVideo);
    res.status(201).json({ success: true, video: newVideo });
  } catch (err) {
    console.error("Error saving bus video:", err);
    res.status(500).json({ error: "Failed to save bus video." });
  }
};
