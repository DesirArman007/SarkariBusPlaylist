import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Upload, Trash2, X, Music, Image as ImageIcon, CheckCircle, Disc, LogOut, Link as LinkIcon, MessageSquare, Radio } from 'lucide-react';
import type { Playlist, Track } from './CassettePlayer';
import { API_BASE } from '../config/api';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  onSongUploaded: (newTrack: Track, playlistId: string) => void;
  onSongDeleted?: (deletedTrackId: string) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  playlists,
  onSongUploaded,
  onSongDeleted
}) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminKey, setAdminKey] = useState(''); // Persisted key for API calls after login
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'requests'>('upload');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');

  // Song Requests State
  const [songRequests, setSongRequests] = useState<{ id: number; sender: string; trackName: string; message: string; time: string }[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [movie, setMovie] = useState('');
  const [selectedPlaylistId] = useState(playlists[0]?.id || '90s-golden');
  const [songFile, setSongFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [directAudioUrl, setDirectAudioUrl] = useState('');
  const [directCoverUrl, setDirectCoverUrl] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-clear success/error messages after 3 seconds
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(''), 4000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  if (!isOpen) return null;

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminPasscode('');
    setAdminKey('');
    setErrorMsg('');
    setSuccessMsg('');
    setActiveTab('upload');
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const currentPasscode = adminPasscode;
    setAdminPasscode(''); // Clear the input field only

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: currentPasscode })
      });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        throw new Error('Server response error: ' + (text || res.statusText));
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid Admin Passcode!');
      }
      setAdminKey(currentPasscode); // Persist validated key for API calls
      setIsAdminLoggedIn(true);
      setErrorMsg('');
      fetchAdminRequests(currentPasscode);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter the song title!');
      return;
    }

    if (uploadMode === 'file' && !songFile) {
      setErrorMsg('Please select an audio file to upload!');
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

      const response = await fetch(`${API_BASE}/api/admin/upload-song`, {
        method: 'POST',
        headers: {
          'x-admin-key': adminKey
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload song');
      }

      setSuccessMsg('Song uploaded & saved to DB successfully!');
      
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
      setTitle('');
      setArtist('');
      setMovie('');
      setSongFile(null);
      setCoverFile(null);
      setDirectAudioUrl('');
      setDirectCoverUrl('');

    } catch (err) {
      console.error(err);
      setErrorMsg((err as Error).message || 'Failed to upload song');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSong = async (trackId: string) => {
    if (!window.confirm("Are you sure you want to delete this song from DB?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/songs/${trackId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete song');
      }
      setSuccessMsg('Song deleted from database successfully!');
      if (onSongDeleted) onSongDeleted(trackId);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleSetDefaultSong = async (trackId: string, trackTitle: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/songs/${trackId}/default`, {
        method: 'PUT',
        headers: {
          'x-admin-key': adminKey
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to set default song');
      }
      setSuccessMsg(`✅ "${trackTitle}" set as the default startup song!`);
      // Since App.tsx fetches on load, to update current UI we might need to notify App
      // But just showing success is fine, the user has to refresh or we trigger a refetch.
      if (onSongDeleted) onSongDeleted(trackId); // HACK: reusing onSongDeleted to trigger a refetch in App.tsx
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const fetchAdminRequests = async (key: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/requests`, {
        headers: { 'x-admin-key': key }
      });
      if (res.ok) {
        const data = await res.json();
        setSongRequests(data.requests || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch requests', err);
    }
  };

  const handleDeleteRequest = async (reqId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/requests/${reqId}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete request');
      setSongRequests(prev => prev.filter(r => r.id !== reqId));
      setConfirmDeleteId(null);
      setSuccessMsg('Request rejected & removed!');
    } catch (err) {
      setConfirmDeleteId(null);
      setErrorMsg((err as Error).message);
    }
  };

  const handleAcceptRequest = async (reqId: number, trackName: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/requests/${reqId}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to accept request');
      setSongRequests(prev => prev.filter(r => r.id !== reqId));
      setSuccessMsg(`✅ Accepted! Now playing: ${trackName}`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const currentTracks = playlists[0]?.tracks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 md:p-6 w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors z-20"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 🔒 STEP 1: ADMIN LOGIN FORM */}
        {!isAdminLoggedIn ? (
          <div className="space-y-4 py-2 pr-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-300 font-devnagari">
                  एडमिन लॉग इन (Admin Portal)
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Enter Admin Passcode to access song management
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-950/90 border border-red-500/60 text-red-300 text-xs p-3 rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-mono">
                  Admin Passcode
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter Passcode"
                  value={adminPasscode}
                  onChange={e => setAdminPasscode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-amber-300 placeholder-slate-500 outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>Log In to Admin Dashboard</span>
              </button>
            </form>
          </div>
        ) : (
          /* 🎵 STEP 2: ADMIN DASHBOARD (UPLOAD & MANAGE SONGS) */
          <div className="space-y-4">
            
            {/* Dashboard Header & Logout (pr-10 prevents overlap with X close button) */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 pr-10">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-amber-300 font-devnagari">
                  एडमिन डैशबोर्ड (Admin Dashboard)
                </h2>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors font-mono cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>

            {/* Status Messages */}
            {errorMsg && (
              <div className="bg-red-950/90 border border-red-500/60 text-red-300 text-xs p-3 rounded-xl">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Dashboard Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => { setActiveTab('upload'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'upload' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3 h-3" />
                <span>Upload</span>
              </button>
              <button
                onClick={() => { setActiveTab('manage'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'manage' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Music className="w-3 h-3" />
                <span>Songs ({currentTracks.length})</span>
              </button>
              <button
                onClick={() => { setActiveTab('requests'); setErrorMsg(''); setSuccessMsg(''); fetchAdminRequests(adminKey); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer relative ${
                  activeTab === 'requests' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>Requests</span>
                {songRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {songRequests.length > 9 ? '9+' : songRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: UPLOAD SONG FORM */}
            {activeTab === 'upload' && (
              <form onSubmit={handleUploadSubmit} className="space-y-3 pt-1">
                
                {/* Upload Method Selector */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1 mb-1">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 py-1 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                      uploadMode === 'file' ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>File Upload</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`flex-1 py-1 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                      uploadMode === 'url' ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Direct URL</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                    Song Title / Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pehla Nasha / Dil Deewana"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none font-devnagari"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                      Artist Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Udit Narayan"
                      value={artist}
                      onChange={e => setArtist(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                      Movie / Album
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jo Jeeta Wohi Sikandar"
                      value={movie}
                      onChange={e => setMovie(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>

                {uploadMode === 'file' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                        Audio File (MP3 / WAV) <span className="text-red-400">*</span>
                      </label>
                      <label className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-2.5 cursor-pointer transition-all ${
                        songFile ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300' : 'border-slate-800 hover:border-amber-500/50 bg-slate-950 text-slate-400'
                      }`}>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={e => setSongFile(e.target.files ? e.target.files[0] : null)}
                          className="hidden"
                        />
                        <Music className="w-4 h-4 text-amber-400" />
                        <span className="text-xs truncate font-mono">
                          {songFile ? songFile.name : "Select Audio File"}
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                        Cover Image (Optional JPG/PNG)
                      </label>
                      <label className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-2 cursor-pointer transition-all ${
                        coverFile ? 'border-amber-500/60 bg-amber-950/20 text-amber-300' : 'border-slate-800 hover:border-amber-500/50 bg-slate-950 text-slate-400'
                      }`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => setCoverFile(e.target.files ? e.target.files[0] : null)}
                          className="hidden"
                        />
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <span className="text-xs truncate font-mono">
                          {coverFile ? coverFile.name : "Select Cover Photo"}
                        </span>
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                        Direct Audio URL (MP3) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/song.mp3"
                        value={directAudioUrl}
                        onChange={e => setDirectAudioUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 font-mono">
                        Direct Cover Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/cover.png"
                        value={directCoverUrl}
                        onChange={e => setDirectCoverUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Disc className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Uploading to DB...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-slate-950" />
                      <span>Upload Song</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: MANAGE & DELETE EXISTING SONGS */}
            {activeTab === 'manage' && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {currentTracks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500 font-mono">
                    No songs in database.
                  </div>
                ) : (
                  currentTracks.map((tr) => (
                    <div
                      key={tr.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-200 font-devnagari truncate">{tr.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{tr.artist} {tr.movie ? `• ${tr.movie}` : ''}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleSetDefaultSong(tr.id, tr.title)}
                          className="p-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-400 rounded-lg transition-colors cursor-pointer"
                          title="Set as Default Startup Song"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSong(tr.id)}
                          className="p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Song"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: SONG REQUESTS */}
            {activeTab === 'requests' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sky-300 text-xs font-mono font-bold">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Passenger Song Requests</span>
                  </div>
                  <button
                    onClick={() => fetchAdminRequests(adminKey)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    ↻ Refresh
                  </button>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {songRequests.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 font-mono">
                      <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                      No pending song requests.
                    </div>
                  ) : (
                    songRequests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-slate-950 border border-sky-500/20 hover:border-sky-500/40 rounded-xl p-3 flex items-start justify-between gap-3 text-xs transition-all"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="font-bold text-slate-100 line-clamp-2 flex items-start gap-1.5 leading-snug">
                            <span className="text-sky-400 shrink-0 mt-0.5">🎵</span>
                            <span>{req.trackName || '(No song name)'}</span>
                          </div>
                          {req.sender && (
                            <div className="text-[10px] text-amber-400/80 font-mono truncate">From: {req.sender}</div>
                          )}
                          {req.message && (
                            <div className="text-[10px] text-slate-400 italic line-clamp-2">"{req.message}"</div>
                          )}
                          {req.time && (
                            <div className="text-[9px] text-slate-600 font-mono">{new Date(req.time).toLocaleString()}</div>
                          )}
                        </div>
                        {/* Accept + Delete buttons */}
                        <div className="shrink-0 flex flex-col items-end gap-1.5 mt-0.5">
                          {/* Accept button — always visible, no confirm needed */}
                          <button
                            onClick={() => handleAcceptRequest(req.id, req.trackName)}
                            className="flex items-center gap-1 px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                            title="Accept & Play this request"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Accept
                          </button>
                          {/* Delete button with inline confirm */}
                          {confirmDeleteId === req.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteRequest(req.id)}
                                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                              >
                                Yes, Reject
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded-lg cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(req.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-400 hover:text-red-300 rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                              title="Reject & Delete Request"
                            >
                              <Trash2 className="w-3 h-3" />
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
