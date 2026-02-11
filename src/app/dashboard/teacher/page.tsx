'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { checkIn, checkOut, getTodayStatus, getAttendanceHistory, checkDistance } from '@/lib/attendance/actions';
import StatusBadge from '@/components/StatusBadge';
import type { AttendanceLog, GeoLocation } from '@/types';
import {
    LogIn, LogOut, Clock, CheckCircle2, AlertCircle,
    Loader2, History, MapPin, Navigation, RefreshCw
} from 'lucide-react';

export default function TeacherDashboard() {
    const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
    const [history, setHistory] = useState<AttendanceLog[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [status, historyResult] = await Promise.all([
            getTodayStatus(user.id),
            getAttendanceHistory(undefined, 1, 7),
        ]);

        setTodayLog(status);
        setHistory(historyResult.data);
        setLoading(false);
    }

    const getLocation = useCallback((): Promise<GeoLocation> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation tidak didukung oleh browser Anda.'));
                return;
            }

            setGpsStatus('fetching');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGpsStatus('success');
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    });
                },
                (error) => {
                    setGpsStatus('error');
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            reject(new Error('Izin lokasi ditolak. Aktifkan GPS dan izinkan akses lokasi.'));
                            break;
                        case error.POSITION_UNAVAILABLE:
                            reject(new Error('Lokasi tidak tersedia. Pastikan GPS aktif.'));
                            break;
                        case error.TIMEOUT:
                            reject(new Error('Waktu pengambilan lokasi habis. Coba lagi.'));
                            break;
                        default:
                            reject(new Error('Gagal mendapatkan lokasi.'));
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0,
                }
            );
        });
    }, []);

    function handleCheckIn() {
        startTransition(async () => {
            try {
                const location = await getLocation();
                const result = await checkIn(location);
                setMessage({ type: result.success ? 'success' : 'error', text: result.message });
                if (result.success) await loadData();
            } catch (err) {
                setMessage({ type: 'error', text: (err as Error).message });
            }
            setGpsStatus('idle');
            setTimeout(() => setMessage(null), 5000);
        });
    }

    function handleCheckOut() {
        startTransition(async () => {
            try {
                const location = await getLocation();
                const result = await checkOut(location);
                setMessage({ type: result.success ? 'success' : 'error', text: result.message });
                if (result.success) await loadData();
            } catch (err) {
                setMessage({ type: 'error', text: (err as Error).message });
            }
            setGpsStatus('idle');
            setTimeout(() => setMessage(null), 5000);
        });
    }

    function handleRefreshLocation() {
        startTransition(async () => {
            try {
                const location = await getLocation();
                const result = await checkDistance(location);

                if (result.success) {
                    setMessage({
                        type: 'success',
                        text: `Lokasi diperbarui! Jarak: ${result.distance}m (Akurasi: ${Math.round(location.accuracy)}m)`
                    });
                    // Optimistically update todayLog distance if it exists to reflect new reading
                    if (todayLog) {
                        setTodayLog(prev => prev ? ({
                            ...prev,
                            distance_from_school_meters: result.distance,
                            location_accuracy: location.accuracy
                        }) : null);
                    }
                } else {
                    setMessage({ type: 'error', text: result.message });
                }
            } catch (err) {
                setMessage({ type: 'error', text: (err as Error).message });
            }
            setGpsStatus('idle');
            setTimeout(() => setMessage(null), 5000);
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            {/* Message */}
            {message && (
                <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium animate-fade-in ${message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    {message.text}
                </div>
            )}

            {/* Today's Status */}
            <div className="glass-card p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-blue-500" />
                            Status Hari Ini
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    {todayLog && <StatusBadge status={todayLog.status} />}
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-blue-500 font-medium mb-1">Jam Masuk</p>
                        <p className="text-lg font-bold text-blue-900">
                            {todayLog?.check_in
                                ? new Date(todayLog.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                : '--:--'
                            }
                        </p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-indigo-500 font-medium mb-1">Jam Pulang</p>
                        <p className="text-lg font-bold text-indigo-900">
                            {todayLog?.check_out
                                ? new Date(todayLog.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                : '--:--'
                            }
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-500 font-medium mb-1">Status</p>
                        <p className="text-lg font-bold text-slate-900">
                            {todayLog ? (todayLog.status === 'PRESENT' ? 'Hadir' : todayLog.status === 'LATE' ? 'Terlambat' : 'Tidak Lengkap') : 'Belum Absen'}
                        </p>
                    </div>
                </div>

                {/* GPS Info */}
                {todayLog?.distance_from_school_meters != null && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50/60 rounded-lg text-sm text-blue-700">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>Jarak dari sekolah: <strong>{todayLog.distance_from_school_meters}m</strong></span>
                        {todayLog.location_accuracy != null && (
                            <span className="text-blue-500 text-xs ml-2">(akurasi: {Math.round(todayLog.location_accuracy)}m)</span>
                        )}
                    </div>
                )}

                {/* GPS Fetching Status */}
                {gpsStatus === 'fetching' && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 animate-pulse">
                        <Navigation className="w-4 h-4 animate-spin flex-shrink-0" />
                        Mengambil lokasi GPS...
                    </div>
                )}

                {/* Refresh Location Button */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleRefreshLocation}
                        disabled={isPending || gpsStatus === 'fetching'}
                        className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 disabled:no-underline transition-all"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPending && gpsStatus === 'fetching' ? 'animate-spin' : ''}`} />
                        {isPending && gpsStatus === 'fetching' ? 'Memperbarui...' : 'Perbarui Lokasi GPS'}
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {!todayLog ? (
                        <button
                            onClick={handleCheckIn}
                            disabled={isPending}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 gradient-success text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                            {isPending && gpsStatus === 'fetching' ? 'Mengambil Lokasi...' : isPending ? 'Memproses...' : 'Check In (Masuk)'}
                        </button>
                    ) : !todayLog.check_out ? (
                        <button
                            onClick={handleCheckOut}
                            disabled={isPending}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 gradient-warning text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                        >
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                            {isPending && gpsStatus === 'fetching' ? 'Mengambil Lokasi...' : isPending ? 'Memproses...' : 'Check Out (Pulang)'}
                        </button>
                    ) : (
                        <div className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-slate-100 text-slate-500 font-semibold rounded-xl">
                            <CheckCircle2 className="w-5 h-5" />
                            Absensi Hari Ini Selesai
                        </div>
                    )}
                </div>
            </div>

            {/* Recent History */}
            <div className="glass-card p-5 sm:p-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-blue-500" />
                    Riwayat Terakhir
                </h3>

                {/* Mobile card view */}
                <div className="block sm:hidden space-y-3">
                    {history.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-4">Belum ada riwayat kehadiran.</p>
                    ) : (
                        history.map((log) => (
                            <div key={log.id} className="bg-slate-50 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-900">
                                        {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                    <StatusBadge status={log.status} />
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span>
                                        Masuk: {log.check_in ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </span>
                                    <span>
                                        Pulang: {log.check_out ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </span>
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
                            <tr className="border-b border-slate-100">
                                <th className="text-left py-3 px-4 text-slate-500 font-medium">Tanggal</th>
                                <th className="text-left py-3 px-4 text-slate-500 font-medium">Masuk</th>
                                <th className="text-left py-3 px-4 text-slate-500 font-medium">Pulang</th>
                                <th className="text-left py-3 px-4 text-slate-500 font-medium">Jarak</th>
                                <th className="text-left py-3 px-4 text-slate-500 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-slate-400">
                                        Belum ada riwayat kehadiran.
                                    </td>
                                </tr>
                            ) : (
                                history.map((log) => (
                                    <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                        <td className="py-3 px-4 text-slate-900">
                                            {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                            {log.check_in ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                            {log.check_out ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-blue-600 text-xs">
                                            {log.distance_from_school_meters != null ? `${log.distance_from_school_meters}m` : '-'}
                                        </td>
                                        <td className="py-3 px-4">
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
