'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { getDashboardData } from '@/lib/attendance/actions';
import KPICard from '@/components/KPICard';
import type { DashboardStats } from '@/types';
import { Users, UserCheck, Clock, TrendingUp, Loader2, Activity, Wifi } from 'lucide-react';

// Lazy load chart components — recharts is ~200KB
const WeeklyBarChart = dynamic(() => import('@/components/charts/WeeklyBarChart'), {
    loading: () => <div className="h-full flex items-center justify-center text-slate-400 text-sm">Memuat grafik...</div>,
    ssr: false,
});
const StatusPieChart = dynamic(() => import('@/components/charts/StatusPieChart'), {
    loading: () => <div className="h-full flex items-center justify-center text-slate-400 text-sm">Memuat grafik...</div>,
    ssr: false,
});

export default function PrincipalDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [weeklyData, setWeeklyData] = useState<{ date: string; present: number; late: number; absent: number }[]>([]);
    const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
    const [realtimeCount, setRealtimeCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        // Single combined call — 3 DB queries instead of 12+
        const data = await getDashboardData();
        setStats(data.stats);
        setWeeklyData(data.weeklyTrend);
        setPieData(data.statusDistribution);
        setRealtimeCount(data.stats.presentToday + data.stats.lateToday);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Realtime subscription — only for dashboard counters
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('attendance-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'attendance_logs' },
                () => { loadData(); }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'attendance_logs' },
                () => { loadData(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadData]);

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Realtime indicator */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Wifi className="w-4 h-4 text-emerald-500 animate-pulse-slow" />
                <span>Realtime · {realtimeCount} guru hadir saat ini</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <KPICard title="Total Guru" value={stats.totalTeachers} icon={Users} gradient="primary" subtitle="Terdaftar" />
                <KPICard title="Hadir Hari Ini" value={stats.presentToday} icon={UserCheck} gradient="success" subtitle={`dari ${stats.totalTeachers} guru`} />
                <KPICard title="Terlambat" value={stats.lateToday} icon={Clock} gradient="warning" subtitle="Hari ini" />
                <KPICard title="Persentase" value={`${stats.attendancePercentage}%`} icon={TrendingUp} gradient={stats.attendancePercentage >= 80 ? 'success' : 'danger'} subtitle="Kehadiran hari ini" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-5 sm:p-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-blue-500" />
                        Tren Kehadiran 7 Hari
                    </h3>
                    <div className="h-64 sm:h-72">
                        <WeeklyBarChart data={weeklyData} />
                    </div>
                </div>

                <div className="glass-card p-5 sm:p-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Distribusi Status Hari Ini
                    </h3>
                    <div className="h-64 sm:h-72">
                        <StatusPieChart data={pieData} />
                    </div>
                </div>
            </div>

            {/* Download Reports */}
            <div className="glass-card p-5 sm:p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Download Laporan</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <a
                        href={`/api/reports?format=pdf&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-6 border-2 border-rose-200 text-rose-600 font-semibold rounded-xl hover:bg-rose-50 transition-all text-sm"
                    >
                        Download PDF Bulan Ini
                    </a>
                    <a
                        href={`/api/reports?format=excel&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-6 border-2 border-emerald-200 text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all text-sm"
                    >
                        Download Excel Bulan Ini
                    </a>
                </div>
            </div>
        </div>
    );
}
