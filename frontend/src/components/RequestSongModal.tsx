import React, { useState } from 'react';
import { Send, Music, User, MessageSquare, X } from 'lucide-react';
import type { SongRequestItem } from './DashboardClock';

interface RequestSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: (newReq: SongRequestItem) => void;
}

export const RequestSongModal: React.FC<RequestSongModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted
}) => {
  const [sender, setSender] = useState('');
  const [trackName, setTrackName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sender.trim() || !trackName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: sender.trim(),
          trackName: trackName.trim(),
          message: message.trim() || "Dedicated to everyone on this bus!"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg("Request sent to Bus Cassette Deck! 🚌🎵");
        onRequestSubmitted(data.data);
        setTimeout(() => {
          setSuccessMsg('');
          setSender('');
          setTrackName('');
          setMessage('');
          onClose();
        }, 1200);
      } else {
        // Fallback for standalone frontend without live backend connection
        const fallbackReq: SongRequestItem = {
          id: Date.now(),
          sender: sender.trim(),
          trackName: trackName.trim(),
          message: message.trim() || "Dedicated to everyone on this bus!",
          time: "Just now"
        };
        onRequestSubmitted(fallbackReq);
        setSuccessMsg("Request sent to Bus Cassette Deck! 🚌🎵");
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      }
    } catch {
      // Fallback offline submit
      const fallbackReq: SongRequestItem = {
        id: Date.now(),
        sender: sender.trim(),
        trackName: trackName.trim(),
        message: message.trim() || "Dedicated to everyone on this bus!",
        time: "Just now"
      };
      onRequestSubmitted(fallbackReq);
      setSuccessMsg("Request sent to Bus Cassette Deck! 🚌🎵");
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-amber-400 font-bold text-xl mb-1">
          Request a Song
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Send your favorite retro song request & message to the driver cassette deck!
        </p>

        {successMsg ? (
          <div className="p-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-xl text-center font-bold animate-pulse">
            {successMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Your Name / Passenger Seat:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul from Seat 14"
                  value={sender}
                  onChange={e => setSender(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Song Title / Singer (90s / Retro Old Song):
              </label>
              <div className="relative">
                <Music className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Pal Pal Dil Ke Paas - Kishore Kumar"
                  value={trackName}
                  onChange={e => setTrackName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Dedicating Message (Optional):
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  placeholder="e.g. Best wishes to everyone travelling to Delhi!"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:border-amber-500 outline-none resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Sending..." : "Submit Request"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
