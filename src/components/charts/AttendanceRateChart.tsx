'use client';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface AttendanceRateChartProps {
    data: { date: string; rate: number }[];
}

export default function AttendanceRateChart({ data }: AttendanceRateChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'short' })}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px' }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    formatter={(value) => [`${value}%`, 'Tingkat Kehadiran']}
                />
                <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorRate)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}
