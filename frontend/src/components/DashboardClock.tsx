import React, { useState, useEffect } from 'react';
import { Clock, Radio, MapPin, Heart } from 'lucide-react';

export interface SongRequestItem {
  id: number;
  sender: string;
  trackName: string;
  message: string;
  time: string;
}

interface DashboardClockProps {
  currentRouteName: string;
  speedKmvh: number;
  requests: SongRequestItem[];
}

export const DashboardClock: React.FC<DashboardClockProps> = ({
  currentRouteName,
  speedKmvh,
  requests
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const latestRequest = requests.length > 0 ? requests[0] : null;

  return (
    <div className="absolute top-4 left-4 z-40 bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-sm w-full">
      
      {/* TIME & SPEED HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-2 font-digital text-amber-400 text-base font-bold">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>{timeStr || "03:25:55 pm"}</span>
        </div>

        <div className="bg-emerald-950 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold text-emerald-400">
          {speedKmvh} KM/H
        </div>
      </div>

      {/* ROUTE DESTINATION */}
      <div className="flex items-start gap-2 text-xs text-amber-200 font-devnagari font-bold">
        <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span className="leading-tight">{currentRouteName}</span>
      </div>

      {/* LIVE PASSENGER REQUEST WITH HEART */}
      {latestRequest && (
        <div className="mt-3 bg-slate-900/90 border border-emerald-900/80 rounded-xl p-2.5 shadow-inner">
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Passenger Request ({latestRequest.sender}):</span>
          </div>


          <div className="text-sm font-devnagari font-bold text-emerald-300 mt-1">
            "{latestRequest.trackName}"
          </div>

          <div className="text-xs font-devnagari text-slate-300 mt-0.5 flex items-center gap-1">
            <span>— {latestRequest.message}</span>
            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 shrink-0 inline" />
          </div>
        </div>
      )}
    </div>
  );
};
