'use client';

import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

interface StatusPieChartProps {
    data: { name: string; value: number }[];
}

export default function StatusPieChart({ data }: StatusPieChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                >
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px' }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
