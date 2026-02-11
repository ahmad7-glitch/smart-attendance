'use client';

import { useState, useEffect, useTransition } from 'react';
import { getDailyAttendance, updateAttendanceLog } from '@/lib/attendance/actions';
import StatusBadge from '@/components/StatusBadge';
import type { AttendanceLog, AttendanceStatus } from '@/types';
import {
    ClipboardCheck, Loader2, CheckCircle2, AlertCircle,
    Pencil, X, Calendar, Save
} from 'lucide-react';

export default function AdminAttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
    const [editStatus, setEditStatus] = useState<AttendanceStatus>('PRESENT');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadLogs();
    }, [date]);

    async function loadLogs() {
        setLoading(true);
        const data = await getDailyAttendance(date);
        setLogs(data);
        setLoading(false);
    }

    function openEdit(log: AttendanceLog) {
        setEditingLog(log);
        setEditStatus(log.status);
    }

    function handleSave() {
        if (!editingLog) return;
        startTransition(async () => {
            const result = await updateAttendanceLog(editingLog.id, { status: editStatus });
            setMessage({ type: result.success ? 'success' : 'error', text: result.message });
            if (result.success) {
                setEditingLog(null);
                await loadLogs();
            }
            setTimeout(() => setMessage(null), 4000);
        });
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardCheck className="w-6 h-6 text-blue-500" />
                    Kelola Kehadiran
                </h2>
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    {message.text}
                </div>
            )}

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
                                <p className="text-center text-slate-400 text-sm py-8">Tidak ada data kehadiran untuk tanggal ini.</p>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="bg-slate-50 rounded-xl p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-900">{log.users?.full_name || '-'}</span>
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={log.status} />
                                                <button
                                                    onClick={() => openEdit(log)}
                                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
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
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Nama Guru</th>
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Masuk</th>
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Pulang</th>
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Status</th>
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">IP</th>
                                        <th className="text-right py-3 px-6 text-slate-500 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-slate-400">
                                                Tidak ada data kehadiran untuk tanggal ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log, i) => (
                                            <tr key={log.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                                                <td className="py-3 px-6 text-slate-400">{i + 1}</td>
                                                <td className="py-3 px-6 text-slate-900 font-medium">{log.users?.full_name || '-'}</td>
                                                <td className="py-3 px-6 text-slate-600">
                                                    {log.check_in ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="py-3 px-6 text-slate-600">
                                                    {log.check_out ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="py-3 px-6">
                                                    <StatusBadge status={log.status} />
                                                </td>
                                                <td className="py-3 px-6 text-slate-400 font-mono text-xs">{log.ip_address || '-'}</td>
                                                <td className="py-3 px-6 text-right">
                                                    <button
                                                        onClick={() => openEdit(log)}
                                                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="Edit Status"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Edit Modal */}
            {editingLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm scale-in overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">Edit Status</h3>
                            <button onClick={() => setEditingLog(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-slate-600">
                                <span className="font-medium">{editingLog.users?.full_name}</span> — {editingLog.date}
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                >
                                    <option value="PRESENT">Hadir</option>
                                    <option value="LATE">Terlambat</option>
                                    <option value="INCOMPLETE">Tidak Lengkap</option>
                                </select>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingLog(null)}
                                    className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="flex-1 py-3 px-4 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
