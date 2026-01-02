
import React from 'react';
import {
    LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendData } from '../../types';

interface HRVTimelineProps {
    data: TrendData[];
}

export const HRVTimeline: React.FC<HRVTimelineProps> = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="w-full h-[200px] bg-emerald-900/5 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Evolución VFC (HRV)</h4>
                <span className="text-[10px] text-emerald-600 font-medium">Resiliencia del Sistema Nervioso</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                    />
                    <YAxis
                        hide={true}
                        domain={['dataMin - 10', 'dataMax + 10']}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontSize: '10px', color: '#64748b' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="hrv"
                        stroke="#059669"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
