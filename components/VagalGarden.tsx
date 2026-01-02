
import React from 'react';

interface GardenProps {
  hrv: number; // 0 to 100 normalized
}

export const VagalGarden: React.FC<GardenProps> = ({ hrv }) => {
  const flowerCount = Math.floor(hrv / 5);
  const colorIntensity = Math.min(hrv + 50, 255);

  return (
    <div className="relative w-full h-48 bg-emerald-50/30 rounded-2xl overflow-hidden border border-emerald-100 p-4">
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-emerald-100/50 to-transparent" />
      
      <div className="relative h-full flex items-end justify-center space-x-2">
        {Array.from({ length: 15 }).map((_, i) => {
          const isActive = i < flowerCount;
          const height = isActive ? 40 + Math.random() * 60 : 10 + Math.random() * 10;
          return (
            <div
              key={i}
              className={`w-4 rounded-t-full transition-all duration-1000 ease-out flex flex-col items-center justify-end`}
              style={{ 
                height: `${height}%`,
                backgroundColor: isActive ? `rgba(16, 185, 129, ${0.3 + (i/20)})` : '#d1d5db'
              }}
            >
              {isActive && (
                <div className="w-6 h-6 bg-rose-300/80 rounded-full -mt-3 animate-bounce shadow-sm" style={{ animationDelay: `${i * 100}ms` }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="absolute top-4 left-4">
        <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-widest">Jardín del Corazón</h4>
        <p className="text-[10px] text-emerald-600">Representación visual del Tono Vagal</p>
      </div>
      
      <div className="absolute bottom-4 right-4 text-right">
        <span className="text-2xl font-bold text-emerald-700">{hrv}</span>
        <span className="text-xs text-emerald-600 ml-1">RMSSD</span>
      </div>
    </div>
  );
};
