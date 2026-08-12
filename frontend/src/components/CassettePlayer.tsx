import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic, Music, MoreVertical } from 'lucide-react';
import { audioEngine } from '../services/busAudioEngine';

export interface Track {
  id: string;
  title: string;
  movie: string;
  artist: string;
  duration: string;
  audioUrl: string;
  coverUrl?: string;
  synthMelody?: string;
  coverColor?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  badge: string;
  tracks: Track[];
}

interface CassettePlayerProps {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  setCurrentPlaylist: (pl: Playlist) => void;
  currentTrack: Track | null;
  setCurrentTrack: (tr: Track) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  tapeEffectOn?: boolean;
  setTapeEffectOn?: (val: boolean) => void;
}

export const CassettePlayer: React.FC<CassettePlayerProps> = ({
  currentPlaylist,
  currentTrack,
  setCurrentTrack,
  isPlaying,
  setIsPlaying
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showQueueMenu, setShowQueueMenu] = useState(false);

  // Sync timeline progress with audio engine
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        const cur = audioEngine.getCurrentTime();
        const dur = audioEngine.getDuration();
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
      }, 250);
    } else if (currentTrack) {
      setCurrentTime(audioEngine.getCurrentTime());
      const dur = audioEngine.getDuration();
      if (dur > 0) setDuration(dur);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTrack]);

  if (!currentTrack) {
    return null;
  }

  const handlePlayPause = () => {
    if (!isPlaying) {
      audioEngine.init();
      audioEngine.playTrack(currentTrack.audioUrl)
        .then(() => setIsPlaying(true));
    } else {
      audioEngine.pauseTrack();
      setIsPlaying(false);
    }
  };

  const handleNextTrack = () => {
    if (!currentPlaylist || currentPlaylist.tracks.length === 0) return;
    const currentIndex = currentPlaylist.tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % currentPlaylist.tracks.length;
    const nextTrack = currentPlaylist.tracks[nextIndex];
    setCurrentTrack(nextTrack);

    if (isPlaying) {
      audioEngine.playTrack(nextTrack.audioUrl);
    }
  };

  const handlePrevTrack = () => {
    if (!currentPlaylist || currentPlaylist.tracks.length === 0) return;
    const currentIndex = currentPlaylist.tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + currentPlaylist.tracks.length) % currentPlaylist.tracks.length;
    const prevTrack = currentPlaylist.tracks[prevIndex];
    setCurrentTrack(prevTrack);

    if (isPlaying) {
      audioEngine.playTrack(prevTrack.audioUrl);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    audioEngine.seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    audioEngine.setMusicVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      audioEngine.setMusicVolume(volume > 0 ? volume : 0.8);
      setIsMuted(false);
    } else {
      audioEngine.setMusicVolume(0);
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="absolute bottom-20 sm:bottom-12 md:bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 lg:right-8 lg:bottom-8 z-50 pointer-events-auto flex flex-col items-center md:items-end gap-2 select-none max-w-[calc(100vw-1.5rem)]">
      
      {/* POPUP: SONGS QUEUE MENU */}
      {showQueueMenu && currentPlaylist && (
        <div className="bg-[#241314] border border-[#3e1f20] rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl w-[260px] sm:w-76 max-h-52 sm:max-h-56 overflow-y-auto space-y-1 animate-in fade-in duration-200 text-stone-200">
          <div className="text-[11px] font-bold text-amber-300 font-devnagari flex items-center justify-between pb-1 border-b border-[#3e1f20]">
            <span>प्लेलिस्ट गीत (Playlist Songs)</span>
            <span className="text-[10px] font-mono text-[#a38282]">{currentPlaylist.tracks.length} Songs</span>
          </div>
          {currentPlaylist.tracks.map((tr) => (
            <button
              key={tr.id}
              onClick={() => {
                setCurrentTrack(tr);
                audioEngine.playTrack(tr.audioUrl).then(() => setIsPlaying(true));
                setShowQueueMenu(false);
              }}
              className={`w-full text-left p-1.5 rounded-xl text-xs flex items-center gap-2 transition-all ${
                tr.id === currentTrack.id
                  ? 'bg-[#b82e2e]/25 text-red-300 border border-[#b82e2e]/40 font-bold'
                  : 'hover:bg-[#32191a] text-stone-300'
              }`}
            >
              <Music className={`w-3.5 h-3.5 shrink-0 ${tr.id === currentTrack.id ? 'text-red-400 animate-pulse' : 'text-stone-500'}`} />
              <div className="min-w-0 flex-1 truncate">
                <div className="truncate font-devnagari text-[11px]">{tr.title}</div>
                <div className="text-[9px] text-[#a38282] truncate">{tr.artist}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* POPUP: VOLUME CONTROL SLIDER */}
      {showVolumeSlider && (
        <div className="bg-[#241314] border border-[#3e1f20] rounded-xl px-3 py-1.5 shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-in fade-in duration-150">
          <Volume2 className="w-3.5 h-3.5 text-[#d4b2b2]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-[#361c1c] accent-[#b82e2e] rounded-full cursor-pointer outline-none"
          />
          <span className="text-[10px] font-mono text-[#a38282] w-6 text-right">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      )}

      {/* 📼 NEW MOCKUP EXACT: MAHOGANY BROWN SLEEK PLAYER PILL CARD */}
      <div className="relative group">
        {/* Deep ambient drop shadow element behind player */}
        <div className="absolute inset-0 bg-black/95 rounded-[22px] sm:rounded-[32px] blur-2xl transform scale-105 pointer-events-none -z-10 shadow-[0_35px_100px_rgba(0,0,0,1)]" />

        <div className="bg-gradient-to-r from-[#2a1617] via-[#221213] to-[#1a0c0d] border border-[#3e1f20] rounded-[22px] sm:rounded-[28px] p-2.5 sm:p-3 md:p-3.5 shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl w-[calc(100vw-1.5rem)] sm:w-[380px] md:w-[440px] max-w-[440px] flex items-center gap-2.5 sm:gap-3 relative overflow-hidden">
          
          {/* 1. LEFT SQUARE ALBUM COVER PHOTO */}
          <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl sm:rounded-2xl bg-[#180c0d] overflow-hidden shrink-0 shadow-lg border border-[#3e1f20] relative">
            {currentTrack.coverUrl ? (
              <img src={currentTrack.coverUrl} alt="Album Art" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-amber-900 via-red-950 to-stone-900 flex items-center justify-center p-2">
                <div className="text-center text-amber-200">
                  <Music className="w-5 h-5 sm:w-7 sm:h-7 mx-auto mb-1 text-amber-400" />
                  <div className="text-[8px] sm:text-[9px] font-bold tracking-wider">RETRO VIBES</div>
                </div>
              </div>
            )}
          </div>

          {/* 2. RIGHT SIDE CONTENT SECTION */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-20 sm:h-28 md:h-32 py-0.5">
            
            {/* Header: Title, Red Heart & More Menu */}
            <div>
              <div className="flex items-start justify-between gap-1">
                <h3 className="font-sans font-bold text-stone-100 text-xs sm:text-sm md:text-base leading-tight flex items-start gap-1 min-w-0">
                  <span className="line-clamp-2">{currentTrack.title}</span>
                  <span className="text-red-500 text-xs sm:text-sm shrink-0 mt-0.5">♥</span>
                </h3>
                <button
                  onClick={() => setShowQueueMenu(!showQueueMenu)}
                  className="text-[#a38282] hover:text-stone-200 transition-colors p-0.5 shrink-0"
                  title="Queue Menu"
                >
                  <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              <p className="text-[10px] sm:text-[11px] font-medium text-[#b89898] truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>

            {/* Middle Seekbar Timeline */}
            <div className="flex items-center gap-1.5 sm:gap-2 my-0.5 sm:my-1">
              <span className="text-[9px] sm:text-[10px] font-mono text-[#a38282] font-semibold w-7 sm:w-8 text-right shrink-0">
                {formatTime(currentTime)}
              </span>

              {/* Red Timeline Slider */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration > 0 ? duration : 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-[#361c1c] accent-[#c83737] hover:accent-[#e05252] rounded-full cursor-pointer outline-none transition-all"
                  title="Seek timeline"
                />
              </div>

              <span className="text-[9px] sm:text-[10px] font-mono text-[#a38282] font-semibold w-7 sm:w-8 shrink-0">
                {duration > 0 ? formatTime(duration) : currentTrack.duration}
              </span>
            </div>

            {/* Bottom Controls Row (Volume, Prev, Red Play, Next, Queue) */}
            <div className="flex items-center justify-between pt-0.5">
              
              {/* Volume Toggle */}
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                onDoubleClick={toggleMute}
                className="text-[#d4b2b2] hover:text-white transition-colors p-1"
                title="Volume Control"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4b2b2]" />}
              </button>

              {/* Center Controls (Prev, Circular Red Play, Next) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* PREVIOUS BUTTON */}
                <button
                  onClick={handlePrevTrack}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#361c1c] hover:bg-[#422222] border border-[#522b2b] text-[#eddcc6] flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow"
                  title="Previous Track"
                >
                  <SkipBack className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#eddcc6]" />
                </button>

                {/* CIRCULAR RED PLAY / PAUSE BUTTON */}
                <button
                  onClick={handlePlayPause}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#992222] via-[#b82e2e] to-[#c83737] text-white shadow-[0_4px_18px_rgba(184,46,46,0.6)] border border-[#e05252] flex items-center justify-center transform active:scale-95 transition-all cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white ml-0.5" />
                  )}
                </button>

                {/* NEXT BUTTON */}
                <button
                  onClick={handleNextTrack}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#361c1c] hover:bg-[#422222] border border-[#522b2b] text-[#eddcc6] flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow"
                  title="Next Track"
                >
                  <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#eddcc6]" />
                </button>
              </div>

              {/* Queue Menu Button */}
              <button
                onClick={() => setShowQueueMenu(!showQueueMenu)}
                className="text-[#d4b2b2] hover:text-white transition-colors p-1"
                title="Songs Queue"
              >
                <ListMusic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4b2b2]" />
              </button>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
