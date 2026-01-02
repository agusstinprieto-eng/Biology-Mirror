
import React from 'react';

interface FaceOverlayProps {
  isAnalyzing: boolean;
  stage: 'PRE' | 'POST';
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({ isAnalyzing, stage }) => {
  const points = Array.from({ length: 68 }).map((_, i) => ({
    x: 50 + Math.cos((i / 68) * Math.PI * 2) * 30 + (Math.random() - 0.5) * 2,
    y: 50 + Math.sin((i / 68) * Math.PI * 2) * 40 + (Math.random() - 0.5) * 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Scanning Ring */}
      {isAnalyzing && (
        <div className="absolute w-64 h-64 border-2 border-emerald-400/50 rounded-full animate-ping" />
      )}
      
      {/* Simulated Facial Landmarks */}
      <svg className="w-full h-full opacity-60" viewBox="0 0 100 100">
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="0.5"
            fill={stage === 'PRE' ? '#ef4444' : '#10b981'}
            className={isAnalyzing ? 'animate-pulse' : ''}
          />
        ))}
        
        {/* Connection lines for key features */}
        <path
          d="M35,30 Q50,25 65,30" // Brows
          fill="none"
          stroke={stage === 'PRE' ? '#ef4444' : '#10b981'}
          strokeWidth="0.5"
        />
        <path
          d="M35,70 Q50,80 65,70" // Mouth
          fill="none"
          stroke={stage === 'PRE' ? '#ef4444' : '#10b981'}
          strokeWidth="0.5"
        />
      </svg>

      {/* Real-time metrics side-panel simulation */}
      <div className="absolute left-4 top-1/4 space-y-2 text-[10px] font-mono text-emerald-400 bg-black/40 p-2 rounded backdrop-blur-sm">
        <div>RAW_FACS: ACTIVE</div>
        <div>rPPG_SIGNAL: {stage === 'PRE' ? 'NOISY' : 'STABLE'}</div>
        <div>TOI_PERFUSION: {stage === 'PRE' ? 'ASYM' : 'HOMO'}</div>
        <div className="w-24 h-1 bg-gray-700 rounded-full mt-1">
          <div 
            className={`h-full bg-emerald-500 transition-all duration-500`}
            style={{ width: isAnalyzing ? '100%' : '40%' }}
          />
        </div>
      </div>
    </div>
  );
};
