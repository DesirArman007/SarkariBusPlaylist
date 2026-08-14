import { sql } from '../config/db.js';
import { cloudinary } from '../config/cloudinary.js';
import { isValidExternalUrl } from '../utils/validation.js';

export const getSongs = async (req, res) => {
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
};

export const uploadSong = async (req, res) => {
  try {
    const { title, artist, movie, playlistId, directAudioUrl, directCoverUrl } = req.body;
    
    if (directAudioUrl && !isValidExternalUrl(directAudioUrl.trim())) {
      return res.status(400).json({ error: "Invalid audio URL. Only public http/https URLs are allowed." });
    }
    if (directCoverUrl && !isValidExternalUrl(directCoverUrl.trim())) {
      return res.status(400).json({ error: "Invalid cover URL. Only public http/https URLs are allowed." });
    }

    let audioUrl = directAudioUrl ? directAudioUrl.trim() : null;
    if (req.files && req.files['songFile'] && req.files['songFile'].length > 0) {
      const localAudioFile = req.files['songFile'][0];
      try {
        console.log("Uploading song file to Cloudinary...", localAudioFile.path);
        const uploadRes = await cloudinary.uploader.upload(localAudioFile.path, {
          resource_type: 'video',
          folder: 'bus_playlist/audio',
          public_id: `audio_${Date.now()}`
        });
        audioUrl = uploadRes.secure_url;
        console.log("Song uploaded to Cloudinary:", audioUrl);
      } catch (uploadErr) {
        console.error("Cloudinary audio upload failed, falling back to local URL:", uploadErr);
        audioUrl = `/uploads/${localAudioFile.filename}`;
      }
    }

    if (!title || !audioUrl) {
      return res.status(400).json({ error: "Song title and audio file/URL are required!" });
    }

    let coverUrl = directCoverUrl ? directCoverUrl.trim() : null;
    if (req.files && req.files['coverFile'] && req.files['coverFile'].length > 0) {
      const localCoverFile = req.files['coverFile'][0];
      try {
        console.log("Uploading cover image to Cloudinary...", localCoverFile.path);
        const uploadRes = await cloudinary.uploader.upload(localCoverFile.path, {
          resource_type: 'image',
          folder: 'bus_playlist/covers',
          public_id: `cover_${Date.now()}`
        });
        coverUrl = uploadRes.secure_url;
        console.log("Cover image uploaded to Cloudinary:", coverUrl);
      } catch (uploadErr) {
        console.error("Cloudinary cover upload failed, falling back to local URL:", uploadErr);
        coverUrl = `/uploads/${localCoverFile.filename}`;
      }
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

    console.log("Admin Song Uploaded Successfully to Neon DB:", newTrack.title);
    res.status(201).json({ success: true, track: newTrack });
  } catch (err) {
    console.error("Error uploading song:", err);
    res.status(500).json({ error: "Failed to save song. Please try again later." });
  }
};

export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    if (sql) {
      await sql`DELETE FROM tracks WHERE id = ${id}`;
    }
    console.log("Admin deleted song ID:", id);
    res.json({ success: true, message: "Song deleted successfully!" });
  } catch (err) {
    console.error("Error deleting song:", err);
    res.status(500).json({ error: "Failed to delete song. Please try again later." });
  }
};
