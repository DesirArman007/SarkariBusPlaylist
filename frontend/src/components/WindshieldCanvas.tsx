import React, { useEffect, useRef } from 'react';
import { Bus, Radio } from 'lucide-react';

interface WindshieldCanvasProps {
  timeOfDay?: 'day' | 'sunset' | 'night';
  isPlaying?: boolean;
  hasStarted?: boolean;
}

export const WindshieldCanvas: React.FC<WindshieldCanvasProps> = ({ isPlaying = false, hasStarted = false }) => {
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const handleVideoAudio = (vid: HTMLVideoElement | null) => {
      if (!vid) return;
      if (isPlaying) {
        // Mute video audio when song is playing
        vid.muted = true;
        vid.volume = 0;
      } else if (hasStarted) {
        // Unmute video audio when song is paused/idle
        vid.muted = false;
        vid.volume = 1.0;
        vid.play().catch(() => {});
      } else {
        // Mute until first user interaction for browser autoplay compliance
        vid.muted = true;
        vid.volume = 0;
      }
    };

    handleVideoAudio(desktopVideoRef.current);
    handleVideoAudio(mobileVideoRef.current);
  }, [isPlaying, hasStarted]);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0 bg-slate-950 p-0 sm:p-3 md:p-5 flex items-center justify-center">
      
      {/* 1. LEFT SIDE VERTICAL GAP - "सरकारी बस" */}
      <div className="hidden lg:flex absolute left-2 xl:left-4 inset-y-0 w-20 xl:w-24 my-auto h-fit flex-col items-center justify-center gap-5 z-20 pointer-events-none opacity-95 text-center">
        <div className="w-13 h-13 rounded-full border-2 border-amber-500/60 bg-slate-900/95 backdrop-blur-md flex items-center justify-center text-amber-400 shadow-2xl shrink-0">
          <Bus className="w-6 h-6 text-amber-400" />
        </div>
        <div className="tracking-wider text-amber-400 font-extrabold font-devnagari text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl [writing-mode:vertical-lr] rotate-180 drop-shadow-[0_0_25px_rgba(245,158,11,0.85)] text-center leading-none mx-auto">
          सरकारी बस
        </div>
      </div>

      {/* 2. CENTER ROUNDED VIDEO FRAME CONTAINER */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-none sm:rounded-[28px] border-0 sm:border sm:border-white/10 shadow-none sm:shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
        {/* DESKTOP / TABLET VIDEO */}
        <video
          ref={desktopVideoRef}
          src="/bus.mp4"
          autoPlay
          loop
          playsInline
          className="hidden sm:block w-full h-full object-contain rounded-[28px]"
        />

        {/* MOBILE SPECIFIC VIDEO */}
        <video
          ref={mobileVideoRef}
          src="/mobile-view-bus.mp4"
          autoPlay
          loop
          playsInline
          className="block sm:hidden w-full h-full object-cover rounded-none"
        />
      </div>

      {/* 3. RIGHT SIDE VERTICAL GAP - "सदाबहार गाने" POSITIONED HIGHER UP ABOVE CASSETTE PLAYER */}
      <div className="hidden lg:flex absolute right-2 xl:right-4 top-8 xl:top-12 w-20 xl:w-24 flex-col items-center justify-start gap-5 z-20 pointer-events-none opacity-95 text-center">
        <div className="w-13 h-13 rounded-full border-2 border-amber-500/60 bg-slate-900/95 backdrop-blur-md flex items-center justify-center text-amber-400 shadow-2xl shrink-0">
          <Radio className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>
        <div className="tracking-wider text-amber-400 font-extrabold font-devnagari text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl [writing-mode:vertical-lr] drop-shadow-[0_0_25px_rgba(245,158,11,0.85)] text-center leading-none mx-auto">
          सदाबहार गाने
        </div>
      </div>

    </div>
  );
};
