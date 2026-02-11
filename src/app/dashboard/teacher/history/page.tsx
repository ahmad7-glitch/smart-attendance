'use client';

import { useState, useEffect } from 'react';

import { getAttendanceHistory } from '@/lib/attendance/actions';
import StatusBadge from '@/components/StatusBadge';
import type { AttendanceLog } from '@/types';
import { History, ChevronLeft, ChevronRight, Loader2, Calendar } from 'lucide-react';

export default function TeacherHistoryPage() {
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const limit = 10;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadHistory();
    }, [page]);

    async function loadHistory() {
        setLoading(true);
        const result = await getAttendanceHistory(undefined, page, limit);
        setLogs(result.data);
        setTotal(result.total);
        setLoading(false);
    }

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-6 h-6 text-blue-500" />
                    Riwayat Kehadiran
                </h2>
                <span className="text-sm text-slate-400">
                    Total: {total} catatan
                </span>
            </div>

            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="block sm:hidden p-4 space-y-3">
                            {logs.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm py-8">Belum ada riwayat.</p>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="bg-slate-50 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-900">
                                                    {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <StatusBadge status={log.status} />
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>Masuk: {log.check_in ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                            <span>Pulang: {log.check_out ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                        </div>
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
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Tanggal</th>
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Masuk</th>
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Pulang</th>
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-slate-400">
                                                Belum ada riwayat kehadiran.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log, i) => (
                                            <tr key={log.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                                                <td className="py-3 px-6 text-slate-400">{(page - 1) * limit + i + 1}</td>
                                                <td className="py-3 px-6 text-slate-900 font-medium">
                                                    {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="py-3 px-6 text-slate-600">
                                                    {log.check_in ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="py-3 px-6 text-slate-600">
                                                    {log.check_out ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-slate-100">
                                <p className="text-xs sm:text-sm text-slate-400">
                                    Hal {page} dari {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
