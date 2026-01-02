
import React from 'react';
import {
    Radar, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    Tooltip, Legend
} from 'recharts';
import { FACSVector } from '../../types';

interface FacsRadarChartProps {
    pre: FACSVector;
    post: FACSVector;
}

export const FacsRadarChart: React.FC<FacsRadarChartProps> = ({ pre, post }) => {
    const data = [
        { subject: 'AU1 (Brows)', A: pre.AU1, B: post.AU1, fullMark: 5 },
        { subject: 'AU4 (Lowerer)', A: pre.AU4, B: post.AU4, fullMark: 5 },
        { subject: 'AU6 (Cheek)', A: pre.AU6, B: post.AU6, fullMark: 5 },
        { subject: 'AU12 (Smile)', A: pre.AU12, B: post.AU12, fullMark: 5 },
        { subject: 'AU15 (Frown)', A: pre.AU15, B: post.AU15, fullMark: 5 },
        { subject: 'AU17 (Chin)', A: pre.AU17, B: post.AU17, fullMark: 5 },
        { subject: 'AU20 (Stretch)', A: pre.AU20, B: post.AU20, fullMark: 5 },
        { subject: 'AU24 (Pressor)', A: pre.AU24, B: post.AU24, fullMark: 5 },
    ];

    return (
        <div className="w-full h-[300px] bg-white rounded-3xl p-4 overflow-hidden">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 text-center">Firma Facial (Radar)</h4>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#f0f0f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#666' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                        name="Antes"
                        dataKey="A"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.4}
                    />
                    <Radar
                        name="Después"
                        dataKey="B"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.4}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};
