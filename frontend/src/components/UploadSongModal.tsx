import React, { useState } from 'react';
import { Upload, Music, Image as ImageIcon, X, CheckCircle, Disc, ShieldCheck, Link as LinkIcon } from 'lucide-react';
import type { Playlist, Track } from './CassettePlayer';

interface UploadSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  onSongUploaded: (newTrack: Track, playlistId: string) => void;
}

export const UploadSongModal: React.FC<UploadSongModalProps> = ({
  isOpen,
  onClose,
  playlists,
  onSongUploaded
}) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [movie, setMovie] = useState('');
  const [selectedPlaylistId] = useState(playlists[0]?.id || '90s-golden');
  const [adminKey, setAdminKey] = useState('');
  
  const [songFile, setSongFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [directAudioUrl, setDirectAudioUrl] = useState('');
  const [directCoverUrl, setDirectCoverUrl] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setErrorMsg('Admin Secret Key is required to upload songs!');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please enter the song title!');
      return;
    }

    if (uploadMode === 'file' && !songFile) {
      setErrorMsg('Please select an MP3 audio file to upload!');
      return;
    }

    if (uploadMode === 'url' && !directAudioUrl.trim()) {
      setErrorMsg('Please enter a direct Audio URL!');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('artist', artist.trim() || 'Unknown Artist');
      formData.append('movie', movie.trim() || 'Single');
      formData.append('playlistId', selectedPlaylistId);

      if (uploadMode === 'file') {
        if (songFile) formData.append('songFile', songFile);
        if (coverFile) formData.append('coverFile', coverFile);
      } else {
        formData.append('directAudioUrl', directAudioUrl.trim());
        if (directCoverUrl.trim()) formData.append('directCoverUrl', directCoverUrl.trim());
      }

      // Restricted Admin Endpoint
      const response = await fetch('/api/admin/upload-song', {
        method: 'POST',
        headers: {
          'x-admin-key': adminKey.trim()
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Access Denied: Invalid Admin Secret Key!');
      }

      setSuccessMsg('Song uploaded, URL generated & saved to DB successfully!');
      
      const newTrack: Track = {
        id: data.track.id,
        title: data.track.title,
        movie: data.track.movie,
        artist: data.track.artist,
        duration: data.track.duration || '03:45',
        audioUrl: data.track.audioUrl,
        coverUrl: data.track.coverUrl,
        synthMelody: 'C4,E4,G4,C5'
      };

      onSongUploaded(newTrack, selectedPlaylistId);
      
      // Reset form
      setTimeout(() => {
        setTitle('');
        setArtist('');
        setMovie('');
        setSongFile(null);
        setCoverFile(null);
        setDirectAudioUrl('');
        setDirectCoverUrl('');
        setSuccessMsg('');
        onClose();
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrorMsg((err as Error).message || 'Failed to upload song');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 md:p-6 w-full max-w-md shadow-[0_20px_50px_rgba(245,158,11,0.2)] relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Disc className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-devnagari">एडमिन गाना अपलोड (Admin Add Song)</h2>
            <p className="text-xs text-slate-400">Stores file, generates URL & saves to DB</p>
          </div>
        </div>

        {/* Admin Secret Passcode Requirement Notice */}
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 mb-4 text-xs text-amber-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Restricted to Admin. Enter Secret Passcode to authenticate.</span>
        </div>

        {/* Option Tabs: File Upload vs Direct URL */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 gap-1">
          <button
            type="button"
            onClick={() => setUploadMode('file')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              uploadMode === 'file' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload MP3 File</span>
          </button>

          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              uploadMode === 'url' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Paste Audio URL</span>
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* Admin Passcode */}
          <div>
            <label className="block text-xs font-semibold text-amber-300 mb-1">
              Admin Passcode *
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter Admin Secret Passcode"
              required
              className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Song Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              गाने का नाम (Song Title) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pehla Nasha / पहला नशा"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              गायक का नाम (Artist Name)
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. Udit Narayan, Kumar Sanu"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Movie / Album */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              फिल्म का नाम (Movie / Album)
            </label>
            <input
              type="text"
              value={movie}
              onChange={(e) => setMovie(e.target.value)}
              placeholder="e.g. Jo Jeeta Wohi Sikandar (1992)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* MODE 1: FILE UPLOADS */}
          {uploadMode === 'file' ? (
            <>
              {/* Song Audio File Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ऑडियो फ़ाइल (Audio MP3 File) *
                </label>
                <label className="flex items-center justify-between bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-2.5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span className="truncate max-w-[200px]">
                      {songFile ? songFile.name : 'Select MP3 audio file...'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setSongFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-1 rounded-md font-mono">Browse File</span>
                </label>
              </div>

              {/* Cover Picture Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  कवर फोटो (Cover Photo - Optional)
                </label>
                <label className="flex items-center justify-between bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-2.5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span className="truncate max-w-[200px]">
                      {coverFile ? coverFile.name : 'Select cover picture...'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-1 rounded-md font-mono">Browse Photo</span>
                </label>
              </div>
            </>
          ) : (
            /* MODE 2: DIRECT URL INPUTS */
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  डायरेक्ट ऑडियो यूआरएल (Direct Audio URL - MP3) *
                </label>
                <input
                  type="url"
                  value={directAudioUrl}
                  onChange={(e) => setDirectAudioUrl(e.target.value)}
                  placeholder="https://example.com/song.mp3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  डायरेक्ट कवर फोटो यूआरएल (Cover Picture URL - Optional)
                </label>
                <input
                  type="url"
                  value={directCoverUrl}
                  onChange={(e) => setDirectCoverUrl(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl p-2.5 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl p-2.5 text-xs flex items-center gap-2">
              <X className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Disc className="w-4 h-4 animate-spin text-slate-950" />
                <span>DB में सेव हो रहा है... (Saving...)</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-slate-950" />
                <span>अपलोड करें और सेव करें (Upload & Save to DB)</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
};
