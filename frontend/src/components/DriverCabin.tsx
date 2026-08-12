import React, { useEffect } from 'react';
import { audioEngine } from '../services/busAudioEngine';

interface DriverCabinProps {
  hasStarted?: boolean;
  onStartEngine?: () => void;
  steeringAngle?: number;
  setSteeringAngle?: React.Dispatch<React.SetStateAction<number>>;
}

export const DriverCabin: React.FC<DriverCabinProps> = () => {
  const handleHorn = () => {
    audioEngine.playPressureHorn();
  };

  // Keyboard controls (Spacebar for retro pressure horn)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ') {
        e.preventDefault();
        handleHorn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none" />
  );
};
