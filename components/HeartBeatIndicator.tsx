
import React from 'react';

interface HeartBeatIndicatorProps {
    bpm: number;
}

export const HeartBeatIndicator: React.FC<HeartBeatIndicatorProps> = ({ bpm }) => {
    // Animation duration based on BPM (60 / bpm)
    const duration = (60 / bpm).toFixed(2);

    return (
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <div
                className="w-4 h-4 text-red-400"
                style={{ animation: `pulse ${duration}s ease-in-out infinite` }}
            >
                <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-mono font-bold text-white leading-none">{bpm}</span>
                <span className="text-[8px] text-white/60 uppercase font-bold tracking-tighter">BPM rPPG</span>
            </div>

            <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          15% { transform: scale(1.3); opacity: 1; }
          30% { transform: scale(1); opacity: 0.8; }
          45% { transform: scale(1.15); opacity: 0.9; }
          60% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
        </div>
    );
};
