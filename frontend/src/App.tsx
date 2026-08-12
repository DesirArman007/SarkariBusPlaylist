import { useState, useEffect } from 'react';
import { WindshieldCanvas } from './components/WindshieldCanvas';
import { DriverCabin } from './components/DriverCabin';
import { CassettePlayer, type Playlist, type Track } from './components/CassettePlayer';
import { RequestSongModal } from './components/RequestSongModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { audioEngine } from './services/busAudioEngine';
import { Volume2, Users } from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE, resolveUploadUrl } from './config/api';

const GithubIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current text-amber-400 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current text-sky-400 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const FALLBACK_TRACKS: Track[] = [
  {
    id: "tr-101",
    title: "Pehla Nasha (पहला नशा)",
    movie: "Jo Jeeta Wohi Sikandar (1992)",
    artist: "Udit Narayan, Sadhana Sargam",
    duration: "04:45",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
    synthMelody: "C4,E4,G4,B4,C5,B4,G4,E4"
  },
  {
    id: "tr-102",
    title: "Tujhe Dekha To Ye Jaana Sanam (तुझे देखा तो यह जाना सनम)",
    movie: "Dilwale Dulhania Le Jayenge (1995)",
    artist: "Kumar Sanu, Lata Mangeshkar",
    duration: "05:02",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=acoustic-guitars-ambient-lofi-10901.mp3",
    synthMelody: "G4,A4,B4,C5,D5,C5,B4,A4"
  },
  {
    id: "tr-103",
    title: "Pal Pal Dil Ke Paas (पल पल दिल के पास)",
    movie: "Blackmail (1973)",
    artist: "Kishore Kumar",
    duration: "05:25",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/02/07/audio_bf07e4cb52.mp3?filename=lazy-day-108788.mp3",
    synthMelody: "C4,G4,E4,A4,F4,G4"
  }
];

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(FALLBACK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Live Active Passengers Onboard state
  const [livePassengers, setLivePassengers] = useState(1);

  // Connect Socket.io for real-time live passenger count
  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ['polling', 'websocket'],  // polling first - required for Render free tier proxy
      reconnectionAttempts: 10,
      timeout: 10000,
      upgrade: true   // upgrade from polling to websocket once connection is stable
    });

    socket.on('live-passengers-count', (count: number) => {
      if (typeof count === 'number') {
        setLivePassengers(Math.max(1, count));
      }
    });

    fetch(`${API_BASE}/api/live-passengers`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.count === 'number') {
          setLivePassengers(Math.max(1, data.count));
        }
      })
      .catch(() => {});

    return () => {
      socket.disconnect();
    };
  }, []);

  // Song Requests modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Fetch backend API - parse songs from DB
  const fetchSongs = () => {
    fetch(`${API_BASE}/api/songs`)
      .then(res => res.json())
      .then(data => {
        let fetchedTracks: Track[] = [];

        if (data.tracks && Array.isArray(data.tracks) && data.tracks.length > 0) {
          fetchedTracks = data.tracks;
        } else if (data.playlists && Array.isArray(data.playlists) && data.playlists.length > 0) {
          fetchedTracks = data.playlists.flatMap((p: Playlist) => p.tracks || []);
        }

        // Resolve relative /uploads/... paths to absolute backend URLs
        // (needed when frontend is on Vercel and files are stored on Render)
        fetchedTracks = fetchedTracks.map(tr => ({
          ...tr,
          audioUrl: resolveUploadUrl(tr.audioUrl),
          coverUrl: tr.coverUrl ? resolveUploadUrl(tr.coverUrl) : tr.coverUrl,
        }));

        const finalTracks = fetchedTracks.length > 0 ? fetchedTracks : FALLBACK_TRACKS;

        const dbPlaylist: Playlist = {
          id: "db-songs",
          title: "सदाबहार प्लेलिस्ट (DB Tracks)",
          description: "Songs strictly loaded from DB",
          badge: "Live Database",
          tracks: finalTracks
        };

        setPlaylists([dbPlaylist]);
        setCurrentPlaylist(dbPlaylist);
        setCurrentTrack(finalTracks[0]);
      })
      .catch(err => {
        console.error("Failed to fetch songs from DB, using fallback:", err);
      });
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleRequestSubmitted = () => {
    // Song request submitted
  };

  // Secret Admin Shortcut: Ctrl + Alt + Shift + A (Case-insensitive)
  useEffect(() => {
    const handleAdminShortcut = (e: KeyboardEvent) => {
      const isKeyA = e.key?.toLowerCase() === 'a' || e.code === 'KeyA';

      if (e.ctrlKey && e.altKey && e.shiftKey && isKeyA) {
        e.preventDefault();
        setIsAdminModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleAdminShortcut);
    return () => window.removeEventListener('keydown', handleAdminShortcut);
  }, []);

  // Listen for user's first click anywhere on screen to enable browser autoplay
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasStarted) {
        setHasStarted(true);
        audioEngine.init();
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [hasStarted]);

  const handleStartJourney = () => {
    if (!hasStarted) {
      setHasStarted(true);
      audioEngine.init();
    }

    if (currentTrack) {
      audioEngine.playTrack(currentTrack.audioUrl)
        .then(() => setIsPlaying(true));
    } else {
      audioEngine.startEngine();
    }
  };

  const handleSongUploaded = (newTrack: Track) => {
    fetchSongs();
    setCurrentTrack(newTrack);

    if (!hasStarted) {
      setHasStarted(true);
      audioEngine.init();
    }

    audioEngine.playTrack(newTrack.audioUrl)
      .then(() => setIsPlaying(true));
  };

  const handleSongDeleted = () => {
    fetchSongs();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">

      {/* 1. WINDSHIELD HIGHWAY VIDEO BACKGROUND */}
      <WindshieldCanvas isPlaying={isPlaying} hasStarted={hasStarted} />

      {/* 2. TOP CENTER FIRST INTERACTION PROMPT FOR BROWSER AUTOPLAY */}
      {!hasStarted && (
        <div className="absolute top-48 sm:top-28 md:top-8 left-1/2 -translate-x-1/2 z-40 bg-amber-500/90 border border-amber-300 text-slate-950 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-[11px] sm:text-xs md:text-sm font-bold animate-bounce max-w-[90vw] text-center">
          <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 shrink-0" />
          <span>Click anywhere to activate sound</span>
        </div>
      )}

      {/* 3. TOP LEFT CONTAINER: SOCIAL LINKS & REQUEST SONG BUTTON */}
      <div className="absolute top-6 left-4 sm:top-8 sm:left-6 md:top-8 md:left-8 z-40 flex flex-col items-start gap-1.5 sm:gap-2">
        <a
          href="https://github.com/DesirArman007"
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-amber-500/60 text-slate-300 hover:text-amber-300 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-3.5 md:py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-[11px] sm:text-xs md:text-xs font-mono font-bold transition-all cursor-pointer group"
          title="Developer GitHub (DesirArman007)"
        >
          <GithubIcon />
          <span>GitHub</span>
        </a>

        <a
          href="https://www.linkedin.com/in/desirarman"
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-sky-500/60 text-slate-300 hover:text-sky-400 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-3.5 md:py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-[11px] sm:text-xs md:text-xs font-mono font-bold transition-all cursor-pointer group"
          title="Developer LinkedIn (desirarman)"
        >
          <LinkedinIcon />
          <span>LinkedIn</span>
        </a>

        {/* REQUEST SONG BUTTON (Placed below LinkedIn) */}
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-3.5 md:py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center justify-center text-[11px] sm:text-xs md:text-xs font-mono font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 border border-amber-300/50 mt-0.5 sm:mt-1"
          title="Request a Song"
        >
          <span>Request Song</span>
        </button>
      </div>

      {/* 4. LIVE ACTIVE PASSENGERS COUNTER — bottom-left on desktop/landscape tablet, top-right on mobile/portrait tablet */}
      <div className="absolute top-6 right-4 sm:top-8 sm:right-6 md:top-auto md:bottom-7 md:right-auto md:left-7 xl:bottom-10 xl:left-8 z-40 pointer-events-auto">
        <div
          className="bg-slate-950/85 border border-emerald-500/50 text-emerald-300 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-3.5 md:py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-xs font-mono font-bold hover:border-emerald-400/80 transition-all"
          title="Passengers Currently Onboard Live"
        >
          <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
          </span>
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          <span>{livePassengers} {livePassengers === 1 ? 'Passenger' : 'Passengers'} Onboard</span>
        </div>
      </div>

      {/* 5. DRIVER CABIN OVERLAY */}
      <DriverCabin
        hasStarted={hasStarted}
        onStartEngine={handleStartJourney}
      />

      {/* 6. SLEEK CASSETTE PLAYER WIDGET */}
      <CassettePlayer
        playlists={playlists}
        currentPlaylist={currentPlaylist}
        setCurrentPlaylist={setCurrentPlaylist}
        currentTrack={currentTrack}
        setCurrentTrack={setCurrentTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      {/* 7. PASSENGER SONG REQUEST MODAL */}
      <RequestSongModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onRequestSubmitted={handleRequestSubmitted}
      />

      {/* 8. ADMIN DASHBOARD MODAL (ACCESSIBLE VIA KEYBOARD SHORTCUT ONLY: Ctrl+Alt+Shift+A) */}
      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        playlists={playlists}
        onSongUploaded={handleSongUploaded}
        onSongDeleted={handleSongDeleted}
      />
    </div>
  );
}
