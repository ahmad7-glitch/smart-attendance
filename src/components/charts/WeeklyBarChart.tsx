'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface WeeklyBarChartProps {
    data: { date: string; present: number; late: number; absent: number }[];
}

export default function WeeklyBarChart({ data }: WeeklyBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'short' })}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px' }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                />
                <Bar dataKey="present" name="Hadir" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Terlambat" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Tidak Hadir" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
