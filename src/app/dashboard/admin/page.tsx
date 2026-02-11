'use client';

import { useState, useEffect } from 'react';
import { getAttendanceStats, getDailyAttendance } from '@/lib/attendance/actions';
import KPICard from '@/components/KPICard';
import StatusBadge from '@/components/StatusBadge';
import type { DashboardStats, AttendanceLog } from '@/types';
import { Users, UserCheck, Clock, TrendingUp, Loader2, Calendar, MapPin } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [todayLogs, setTodayLogs] = useState<AttendanceLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const today = new Date().toISOString().split('T')[0];
            const [statsData, logsData] = await Promise.all([
                getAttendanceStats(),
                getDailyAttendance(today),
            ]);
            setStats(statsData);
            setTodayLogs(logsData);
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

    return (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
                <KPICard
                    title="Total Guru"
                    value={stats.totalTeachers}
                    icon={Users}
                    gradient="primary"
                    subtitle="Terdaftar"
                />
                <KPICard
                    title="Hadir Hari Ini"
                    value={stats.presentToday}
                    icon={UserCheck}
                    gradient="success"
                    subtitle={`dari ${stats.totalTeachers} guru`}
                />
                <KPICard
                    title="Terlambat"
                    value={stats.lateToday}
                    icon={Clock}
                    gradient="warning"
                    subtitle="Hari ini"
                />
                <KPICard
                    title="Persentase"
                    value={`${stats.attendancePercentage}%`}
                    icon={TrendingUp}
                    gradient={stats.attendancePercentage >= 80 ? 'success' : 'danger'}
                    subtitle="Kehadiran hari ini"
                />
            </div>

            {/* Today's Attendance Table */}
            <div className="glass-card overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Kehadiran Hari Ini
                    </h3>
                </div>

                {/* Mobile card view */}
                <div className="block sm:hidden p-4 space-y-3">
                    {todayLogs.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-8">Belum ada data kehadiran hari ini.</p>
                    ) : (
                        todayLogs.map((log) => (
                            <div key={log.id} className="bg-slate-50 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-900">{log.users?.full_name || '-'}</span>
                                    <StatusBadge status={log.status} />
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span>Masuk: {log.check_in ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                    <span>Pulang: {log.check_out ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                </div>
                                {log.distance_from_school_meters != null && (
                                    <div className="flex items-center gap-1 text-xs text-blue-600">
                                        <MapPin className="w-3 h-3" />
                                        {log.distance_from_school_meters}m dari sekolah
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="text-left py-3 px-6 text-slate-500 font-medium">No</th>
                                <th className="text-left py-3 px-6 text-slate-500 font-medium">Nama Guru</th>
                                <th className="text-left py-3 px-6 text-slate-500 font-medium">Masuk</th>
                                <th className="text-left py-3 px-6 text-slate-500 font-medium">Pulang</th>
                                <th className="text-left py-3 px-6 text-slate-500 font-medium">Jarak</th>
                                <th className="text-left py-3 px-6 text-slate-500 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {todayLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-400">
                                        Belum ada data kehadiran hari ini.
                                    </td>
                                </tr>
                            ) : (
                                todayLogs.map((log, i) => (
                                    <tr key={log.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                                        <td className="py-3 px-6 text-slate-400">{i + 1}</td>
                                        <td className="py-3 px-6 text-slate-900 font-medium">{log.users?.full_name || '-'}</td>
                                        <td className="py-3 px-6 text-slate-600">
                                            {log.check_in ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="py-3 px-6 text-slate-600">
                                            {log.check_out ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="py-3 px-6 text-xs text-blue-600">
                                            {log.distance_from_school_meters != null ? `${log.distance_from_school_meters}m` : '-'}
                                        </td>
                                        <td className="py-3 px-6">
                                            <StatusBadge status={log.status} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
