'use client';

import { useState } from 'react';
import { FileText, Download, FileSpreadsheet, Loader2 } from 'lucide-react';

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function AdminReportsPage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [downloading, setDownloading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'error'; text: string } | null>(null);

    async function handleDownload(format: 'pdf' | 'excel') {
        setDownloading(format);
        setMessage(null);
        try {
            const res = await fetch(`/api/reports?format=${format}&month=${month}&year=${year}`);
            if (!res.ok) throw new Error('Download failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Laporan_Kehadiran_${monthNames[month - 1]}_${year}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            setMessage({ type: 'error', text: 'Gagal mendownload laporan. Silakan coba lagi nanti.' });
            setTimeout(() => setMessage(null), 5000);
        } finally {
            setDownloading(null);
        }
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-500" />
                Laporan Kehadiran
            </h2>

            {/* Error Message */}
            {message && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-rose-600" />
                    </div>
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <div className="glass-card p-5 sm:p-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Pilih Periode</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Bulan</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        >
                            {monthNames.map((name, i) => (
                                <option key={i} value={i + 1}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Tahun</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        >
                            {years.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={() => handleDownload('pdf')}
                        disabled={downloading !== null}
                        className="flex items-center justify-center gap-3 p-5 border-2 border-dashed border-rose-200 rounded-xl text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all group"
                    >
                        {downloading === 'pdf' ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Download className="w-6 h-6" />
                            </div>
                        )}
                        <div className="text-left">
                            <p className="font-semibold text-base">Download PDF</p>
                            <p className="text-xs text-rose-400">Format cetak laporan</p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleDownload('excel')}
                        disabled={downloading !== null}
                        className="flex items-center justify-center gap-3 p-5 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
                    >
                        {downloading === 'excel' ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                        )}
                        <div className="text-left">
                            <p className="font-semibold text-base">Download Excel</p>
                            <p className="text-xs text-emerald-400">Format spreadsheet</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
