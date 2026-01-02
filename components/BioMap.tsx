
import React from 'react';
import { SkinAnalysis } from '../types';

interface BioMapProps {
    data: SkinAnalysis;
    stage: 'PRE' | 'POST';
}

export const BioMap: React.FC<BioMapProps> = ({ data, stage }) => {
    // Normalize values for visualization
    const rednessIntensity = (data.redness / 100);
    const homogeneityValue = (data.homogeneity / 100);

    // Colors for the map
    const STRESS_COLOR = "#ef4444"; // Red
    const HEALING_COLOR = "#2dd4bf"; // Cyan/Teal
    const NEUTRAL_COLOR = "#cbd5e1"; // Slate

    return (
        <div className="relative w-full aspect-square max-w-[300px] mx-auto filter drop-shadow-2xl">
            <svg viewBox="0 0 200 240" className="w-full h-full">
                <defs>
                    {/* Stress Gradient (Irregular) */}
                    <radialGradient id="stressGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={STRESS_COLOR} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={STRESS_COLOR} stopOpacity={0} />
                    </radialGradient>

                    {/* Healing Gradient (Uniform) */}
                    <radialGradient id="healingGrad" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor={HEALING_COLOR} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={HEALING_COLOR} stopOpacity={0} />
                    </radialGradient>

                    {/* Mask for the face shape */}
                    <mask id="faceMask">
                        <path
                            d="M100,20 C140,20 170,60 170,120 C170,180 140,220 100,220 C60,220 30,180 30,120 C30,60 60,20 100,20 Z"
                            fill="white"
                        />
                    </mask>
                </defs>

                {/* Base Face Shape */}
                <path
                    d="M100,20 C140,20 170,60 170,120 C170,180 140,220 100,220 C60,220 30,180 30,120 C30,60 60,20 100,20 Z"
                    fill={stage === 'PRE' ? "#f8fafc" : "#f0fdfa"}
                    stroke={stage === 'PRE' ? "#e2e8f0" : "#99f6e4"}
                    strokeWidth="1"
                />

                {/* Perfusion Simulation Overlay */}
                <g mask="url(#faceMask)">
                    {stage === 'PRE' ? (
                        // Stress Pattern: Irregular red blotches
                        <>
                            <circle cx="70" cy="80" r={20 + Math.random() * 20} fill="url(#stressGrad)" opacity={rednessIntensity} />
                            <circle cx="130" cy="70" r={15 + Math.random() * 25} fill="url(#stressGrad)" opacity={rednessIntensity * 0.8} />
                            <circle cx="100" cy="150" r={30 + Math.random() * 20} fill="url(#stressGrad)" opacity={rednessIntensity * 0.6} />
                            <circle cx="60" cy="180" r={20 + Math.random() * 15} fill="url(#stressGrad)" opacity={rednessIntensity * 0.7} />
                            <circle cx="140" cy="140" r={25 + Math.random() * 20} fill="url(#stressGrad)" opacity={rednessIntensity * 0.5} />
                        </>
                    ) : (
                        // Healing Pattern: Uniform cyan glow
                        <rect x="0" y="0" width="200" height="240" fill="url(#healingGrad)" opacity={homogeneityValue} />
                    )}
                </g>

                {/* Stylized Eyes and Nose for Context */}
                <g opacity="0.3" fill="none" stroke="#64748b" strokeWidth="1">
                    <path d="M60,100 Q75,95 90,100" /> {/* Left Eye */}
                    <path d="M110,100 Q125,95 140,100" /> {/* Right Eye */}
                    <path d="M100,120 Q105,140 100,160" /> {/* Nose */}
                    <path d="M75,185 Q100,195 125,185" /> {/* Mouth */}
                </g>
            </svg>

            {/* Label Overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-tighter shadow-sm border border-neutral-200 uppercase">
                {stage === 'PRE' ? 'Perfusión Desigual' : 'Distribución Uniforme'}
            </div>
        </div>
    );
};
