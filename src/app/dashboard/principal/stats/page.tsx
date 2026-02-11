'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getDashboardData } from '@/lib/attendance/actions';
import type { DashboardStats } from '@/types';
import { BarChart3, Loader2, TrendingUp, Activity } from 'lucide-react';

// Lazy load chart components
const WeeklyBarChart = dynamic(() => import('@/components/charts/WeeklyBarChart'), {
    loading: () => <div className="h-full flex items-center justify-center text-slate-400 text-sm">Memuat grafik...</div>,
    ssr: false,
});
const StatusPieChart = dynamic(() => import('@/components/charts/StatusPieChart'), {
    loading: () => <div className="h-full flex items-center justify-center text-slate-400 text-sm">Memuat grafik...</div>,
    ssr: false,
});
const AttendanceRateChart = dynamic(() => import('@/components/charts/AttendanceRateChart'), {
    loading: () => <div className="h-full flex items-center justify-center text-slate-400 text-sm">Memuat grafik...</div>,
    ssr: false,
});

export default function PrincipalStatsPage() {
    const [weeklyData, setWeeklyData] = useState<{ date: string; present: number; late: number; absent: number }[]>([]);
    const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            // Single combined call — 3 DB queries instead of 12+
            const data = await getDashboardData();
            setWeeklyData(data.weeklyTrend);
            setPieData(data.statusDistribution);
            setStats(data.stats);
            setLoading(false);
        }
        load();
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const attendanceRateData = weeklyData.map(d => ({
        date: d.date,
        rate: stats.totalTeachers > 0
            ? Math.round(((d.present + d.late) / stats.totalTeachers) * 100)
            : 0,
    }));

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-500" />
                Statistik Kehadiran
            </h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{stats.presentToday}</p>
                    <p className="text-xs text-slate-500 mt-1">Hadir</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-amber-500">{stats.lateToday}</p>
                    <p className="text-xs text-slate-500 mt-1">Terlambat</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-rose-500">{Math.max(0, stats.totalTeachers - stats.presentToday - stats.lateToday)}</p>
                    <p className="text-xs text-slate-500 mt-1">Tidak Hadir</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.attendancePercentage}%</p>
                    <p className="text-xs text-slate-500 mt-1">Persentase</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Kehadiran 7 Hari Terakhir
                    </h3>
                    <div className="h-64 sm:h-72">
                        <WeeklyBarChart data={weeklyData} />
                    </div>
                </div>

                <div className="glass-card p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Distribusi Status
                    </h3>
                    <div className="h-64 sm:h-72">
                        <StatusPieChart data={pieData} />
                    </div>
                </div>

                <div className="glass-card p-5 sm:p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Tingkat Kehadiran (%)
                    </h3>
                    <div className="h-64 sm:h-72">
                        <AttendanceRateChart data={attendanceRateData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
