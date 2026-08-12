import React from 'react';
import { Users, MapPin } from 'lucide-react';

interface PassengerViewProps {
  timeOfDay: 'day' | 'sunset' | 'night';
  routeName: string;
  speedKmvh: number;
}

export const PassengerView: React.FC<PassengerViewProps> = ({
  timeOfDay,
  routeName,
  speedKmvh
}) => {
  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden flex flex-col justify-between p-6 pointer-events-none select-none z-10">
      {/* 1. TOP OVERHEAD LUGGAGE WIRED RACKS & CEILING FANS */}
      <div className="w-full flex justify-between items-center border-b-4 border-slate-800 pb-4 pt-2">
        <div className="flex gap-8 items-center">
          {/* Fan 1 */}
          <div className="w-10 h-10 border-2 border-slate-700 rounded-full flex items-center justify-center animate-spin">
            <div className="w-8 h-1 bg-slate-600 rounded" />
          </div>
          <div className="text-xs text-amber-400 font-devnagari font-bold">
            यात्री ध्यान दें: बस में धूम्रपान मना है (No Smoking)
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded border border-slate-800 text-xs font-mono text-emerald-400">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>{routeName}</span>
        </div>
      </div>

      {/* 2. PASSENGER AISLE SEATING LAYOUT */}
      <div className="flex-1 flex justify-between items-center relative my-4">
        
        {/* LEFT SIDE WINDOWS & BLUE BUS SEATS */}
        <div className="flex flex-col gap-4 w-1/3 h-full justify-around">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              {/* Bus Window showing ambient sky */}
              <div className={`w-28 h-20 rounded-xl border-4 border-slate-800 overflow-hidden relative ${
                timeOfDay === 'sunset' ? 'bg-gradient-to-b from-purple-900 to-orange-700' :
                (timeOfDay === 'night' ? 'bg-slate-950' : 'bg-gradient-to-b from-sky-400 to-emerald-800')
              }`}>
                {/* Passing tree blur */}
                <div className="absolute inset-0 bg-emerald-950/40 animate-pulse" />
              </div>

              {/* Blue High-back Passenger Seat */}
              <div className="w-20 h-24 bg-blue-700 border-2 border-blue-900 rounded-t-2xl shadow-xl relative flex flex-col justify-end p-2">
                <div className="w-full h-4 bg-slate-900 rounded-t-lg" />
                <div className="text-[10px] text-blue-200 font-mono text-center mt-1">Seat {i * 2 + 1}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CENTER BUS AISLE PASSER-BY VIEW */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-32 h-32 rounded-full border-4 border-amber-500/40 bg-slate-900/80 p-4 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md">
            <Users className="w-10 h-10 text-amber-400 mb-1 animate-bounce" />
            <div className="text-xs font-bold text-slate-200 font-devnagari">यात्री केबिन</div>
            <div className="text-[10px] font-mono text-emerald-400 mt-0.5">{speedKmvh} KM/H Cruising</div>
          </div>
          <p className="text-xs text-slate-400 mt-4 max-w-xs font-devnagari">
            खिड़की से ठंडी हवा और 90 के दशक के सुहाने गानों का आनंद लें...
          </p>
        </div>

        {/* RIGHT SIDE WINDOWS & BLUE BUS SEATS */}
        <div className="flex flex-col gap-4 w-1/3 h-full justify-around items-end">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              {/* Blue High-back Passenger Seat */}
              <div className="w-20 h-24 bg-blue-700 border-2 border-blue-900 rounded-t-2xl shadow-xl relative flex flex-col justify-end p-2">
                <div className="w-full h-4 bg-slate-900 rounded-t-lg" />
                <div className="text-[10px] text-blue-200 font-mono text-center mt-1">Seat {i * 2 + 2}</div>
              </div>

              {/* Bus Window */}
              <div className={`w-28 h-20 rounded-xl border-4 border-slate-800 overflow-hidden relative ${
                timeOfDay === 'sunset' ? 'bg-gradient-to-b from-purple-900 to-orange-700' :
                (timeOfDay === 'night' ? 'bg-slate-950' : 'bg-gradient-to-b from-sky-400 to-emerald-800')
              }`}>
                <div className="absolute inset-0 bg-emerald-950/40 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* 3. BOTTOM FOOTER BAR */}
      <div className="w-full flex justify-between items-center text-xs font-mono text-slate-500 border-t border-slate-800 pt-2">
        <span>Conductor Ticket Machine Active</span>
        <span>Haryana State Transport • Ordinary/Deluxe</span>
      </div>
    </div>
  );
};
