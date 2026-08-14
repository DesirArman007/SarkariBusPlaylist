import React, { useEffect, useRef, useState } from 'react';
import { Bus, Radio } from 'lucide-react';

interface WindshieldCanvasProps {
  timeOfDay?: 'day' | 'sunset' | 'night';
  isPlaying?: boolean;
  hasStarted?: boolean;
}

export const WindshieldCanvas: React.FC<WindshieldCanvasProps> = ({ isPlaying = false, hasStarted = false }) => {
  const [activeVidIndex, setActiveVidIndex] = useState(0); // 0 = Video A, 1 = Video B

  const desktopVidA = useRef<HTMLVideoElement | null>(null);
  const desktopVidB = useRef<HTMLVideoElement | null>(null);
  const mobileVidA = useRef<HTMLVideoElement | null>(null);
  const mobileVidB = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const handleVideoAudio = (vid: HTMLVideoElement | null, isActive: boolean) => {
      if (!vid) return;
      if (!isActive) {
        vid.muted = true;
        vid.volume = 0;
        // Optional: pause inactive video if it's far past the crossfade time
        if (vid.currentTime > 1.5) vid.pause();
        return;
      }

      if (isPlaying) {
        vid.muted = true;
        vid.volume = 0;
      } else if (hasStarted) {
        vid.muted = false;
        vid.volume = 0.03;
      } else {
        vid.muted = true;
        vid.volume = 0;
      }
    };

    handleVideoAudio(desktopVidA.current, activeVidIndex === 0);
    handleVideoAudio(desktopVidB.current, activeVidIndex === 1);
    handleVideoAudio(mobileVidA.current, activeVidIndex === 0);
    handleVideoAudio(mobileVidB.current, activeVidIndex === 1);
  }, [isPlaying, hasStarted, activeVidIndex]);

  useEffect(() => {
    let rafId: number;

    if (hasStarted) {
      if (activeVidIndex === 0) {
        desktopVidA.current?.play().catch(() => { });
        mobileVidA.current?.play().catch(() => { });
      } else {
        desktopVidB.current?.play().catch(() => { });
        mobileVidB.current?.play().catch(() => { });
      }
    }

    // Keep state out of the re-running closure
    let localIsTransitioning = false;

    const checkCrossfade = () => {
      const activeDesktop = activeVidIndex === 0 ? desktopVidA.current : desktopVidB.current;
      const inactiveDesktop = activeVidIndex === 0 ? desktopVidB.current : desktopVidA.current;

      const activeMobile = activeVidIndex === 0 ? mobileVidA.current : mobileVidB.current;
      const inactiveMobile = activeVidIndex === 0 ? mobileVidB.current : mobileVidA.current;

      if (!activeDesktop || !inactiveDesktop) {
        rafId = requestAnimationFrame(checkCrossfade);
        return;
      }

      const crossfadeTime = 1.0;

      if (activeDesktop.duration && activeDesktop.currentTime >= activeDesktop.duration - crossfadeTime && !localIsTransitioning) {
        localIsTransitioning = true;

        inactiveDesktop.currentTime = 0;
        if (inactiveMobile) inactiveMobile.currentTime = 0;

        inactiveDesktop.play().catch(() => { });
        if (inactiveMobile) inactiveMobile.play().catch(() => { });

        setActiveVidIndex(activeVidIndex === 0 ? 1 : 0);
      }

      rafId = requestAnimationFrame(checkCrossfade);
    };

    rafId = requestAnimationFrame(checkCrossfade);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [activeVidIndex, hasStarted]);

  const getOpacity = (idx: number) => activeVidIndex === idx ? 'opacity-100' : 'opacity-0';

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
        {/* DESKTOP / TABLET VIDEOS */}
        <video
          ref={desktopVidA}
          src="/bus.mp4"
          loop
          playsInline
          className={`absolute inset-0 hidden sm:block w-full h-full object-contain rounded-[28px] transition-opacity duration-1000 ease-in-out ${getOpacity(0)}`}
        />
        <video
          ref={desktopVidB}
          src="/bus.mp4"
          loop
          playsInline
          className={`absolute inset-0 hidden sm:block w-full h-full object-contain rounded-[28px] transition-opacity duration-1000 ease-in-out ${getOpacity(1)}`}
        />

        {/* MOBILE SPECIFIC VIDEOS */}
        <video
          ref={mobileVidA}
          src="/bus.mp4"
          loop
          playsInline
          className={`absolute inset-0 block sm:hidden w-full h-full object-cover rounded-none transition-opacity duration-1000 ease-in-out ${getOpacity(0)}`}
        />
        <video
          ref={mobileVidB}
          src="/bus.mp4"
          loop
          playsInline
          className={`absolute inset-0 block sm:hidden w-full h-full object-cover rounded-none transition-opacity duration-1000 ease-in-out ${getOpacity(1)}`}
        />
      </div>

      {/* 3. RIGHT SIDE VERTICAL GAP - "सदाबहार गाने" */}
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
