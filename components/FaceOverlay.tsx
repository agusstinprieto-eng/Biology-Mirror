
import React from 'react';

interface FaceOverlayProps {
  isAnalyzing: boolean;
  stage: 'PRE' | 'POST';
  landmarks?: any[]; // New prop for real-time data
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({ isAnalyzing, stage, landmarks }) => {
  // Use real landmarks if available, otherwise fallback to simulated random points
  const points = landmarks && landmarks.length > 0
    ? landmarks.map(l => ({ x: l.x * 100, y: l.y * 100 }))
    : Array.from({ length: 68 }).map((_, i) => ({
      x: 50 + Math.cos((i / 68) * Math.PI * 2) * 30 + (Math.random() - 0.5) * 2,
      y: 50 + Math.sin((i / 68) * Math.PI * 2) * 40 + (Math.random() - 0.5) * 2,
    }));

  // Derive simple stability metric from the nose tip (index 1) relative to center
  // In a real app we'd need previous frames to calc velocity, but here we can use "centeredness" as proxy for focus
  const noseTip = points[1] || { x: 50, y: 50 };
  const distanceFromCenter = Math.sqrt(Math.pow(noseTip.x - 50, 2) + Math.pow(noseTip.y - 50, 2));
  const isStable = distanceFromCenter < 10;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">

      {/* 1. Breathing Guide (The "Vagal Tone" Pacer) */}
      {/* Expands for 4s, Contracts for 6s - crude via CSS or just steady pulse for now */}
      {!isAnalyzing && (
        <div className={`absolute border-[6px] rounded-full transition-all duration-[4000ms] ease-in-out opacity-20
          ${isStable ? 'border-emerald-400 w-96 h-96' : 'border-amber-500 w-64 h-64'}
          animate-pulse
        `} />
      )}

      {/* 2. Scanning / Analyzing Mode */}
      {isAnalyzing && (
        <div className="absolute w-64 h-64 border-2 border-emerald-400/50 rounded-full animate-ping" />
      )}

      {/* 3. Facial Mesh Visualization */}
      <svg className="w-full h-full opacity-60" viewBox="0 0 100 100">
        {points.map((p, i) => (
          (i % 3 === 0) && ( // Optimization: Only render 1/3 of points
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="0.4"
              fill={isStable ? '#10b981' : '#f59e0b'} // Green if stable, Amber if moving
              className="transition-colors duration-300"
            />
          )
        ))}
      </svg>

      {/* 4. Real-time metrics HUD */}
      <div className="absolute left-4 top-1/4 space-y-2 text-[10px] font-mono text-emerald-400 bg-black/40 p-2 rounded backdrop-blur-sm">
        <div>LIVE_FEED: {landmarks ? 'ACTIVE ⚡' : 'STANDBY'}</div>
        <div>VAGAL_STATE: {isStable ? 'COHERENT' : 'ADJUSTING...'}</div>
        {landmarks && (
          <div className="flex items-center space-x-2">
            <span>STABILITY:</span>
            <div className="w-16 h-1 bg-gray-700 rounded-full">
              <div
                className={`h-full transition-all duration-300 ${isStable ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.max(0, 100 - distanceFromCenter * 5)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Instruction Overlay */}
      {!isAnalyzing && distanceFromCenter > 20 && (
        <div className="absolute bottom-20 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-md animate-bounce text-sm font-medium">
          Centra tu rostro en el círculo
        </div>
      )}
    </div>
  );
};
