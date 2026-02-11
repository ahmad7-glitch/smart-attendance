'use client';

import { useState, useEffect, useTransition } from 'react';
import { getSchoolSettings, updateSchoolSettings } from '@/lib/settings/actions';
import type { SchoolSettings } from '@/types';
import {
    Settings, MapPin, Navigation, Save, Loader2,
    CheckCircle2, AlertCircle, Ruler, Clock
} from 'lucide-react';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [schoolName, setSchoolName] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [radius, setRadius] = useState('100');
    const [maxAccuracy, setMaxAccuracy] = useState('100');
    const [startTime, setStartTime] = useState('07:00');
    const [endTime, setEndTime] = useState('14:00');

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        const data = await getSchoolSettings();
        if (data) {
            setSettings(data);
            setSchoolName(data.school_name);
            setLatitude(data.latitude.toString());
            setLongitude(data.longitude.toString());
            setRadius(data.allowed_radius_meters.toString());
            setMaxAccuracy(data.max_accuracy_meters.toString());
            if (data.start_time) setStartTime(data.start_time.substring(0, 5));
            if (data.end_time) setEndTime(data.end_time.substring(0, 5));
        }
        setLoading(false);
    }

    function handleGetCurrentLocation() {
        if (!navigator.geolocation) {
            setMessage({ type: 'error', text: 'Geolocation tidak didukung browser.' });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(pos.coords.latitude.toFixed(8));
                setLongitude(pos.coords.longitude.toFixed(8));
                setMessage({ type: 'success', text: `Lokasi terdeteksi! Akurasi: ${Math.round(pos.coords.accuracy)}m` });
                setTimeout(() => setMessage(null), 3000);
            },
            (err) => {
                setMessage({ type: 'error', text: `Gagal mendapatkan lokasi: ${err.message}` });
                setTimeout(() => setMessage(null), 5000);
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    }

    function handleSave() {
        startTransition(async () => {
            const result = await updateSchoolSettings({
                school_name: schoolName,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                allowed_radius_meters: parseInt(radius, 10),
                max_accuracy_meters: parseInt(maxAccuracy, 10),
                start_time: startTime,
                end_time: endTime,
            });

            setMessage({ type: result.success ? 'success' : 'error', text: result.message });
            if (result.success) await loadSettings();
            setTimeout(() => setMessage(null), 4000);
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
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-7 h-7 text-blue-500" />
                    Pengaturan Lokasi & Waktu
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    Konfigurasi lokasi sekolah dan jam operasional absensi.
                </p>
            </div>

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

            {/* Settings Form */}
            <div className="glass-card p-6 space-y-6">
                {/* School Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nama Sekolah
                    </label>
                    <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="SMP NU ASSALAFIE"
                    />
                </div>

                {/* Coordinates */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            Koordinat Sekolah
                        </label>
                        <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            Gunakan Lokasi Saat Ini
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="-6.123456"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="110.123456"
                            />
                        </div>
                    </div>

                    {latitude !== '0' && longitude !== '0' && latitude && longitude && (
                        <p className="text-xs text-slate-400">
                            📍 Koordinat: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                        </p>
                    )}
                </div>

                {/* Radius & Accuracy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Ruler className="w-4 h-4 text-emerald-500" />
                            Radius Absensi (meter)
                        </label>
                        <input
                            type="number"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="100"
                            min="10"
                            max="10000"
                        />
                        <p className="text-xs text-slate-400 mt-1">Guru harus berada dalam radius ini.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Navigation className="w-4 h-4 text-amber-500" />
                            Akurasi Maks GPS (meter)
                        </label>
                        <input
                            type="number"
                            value={maxAccuracy}
                            onChange={(e) => setMaxAccuracy(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="100"
                            min="10"
                            max="500"
                        />
                        <p className="text-xs text-slate-400 mt-1">Tolak jika akurasi GPS buruk.</p>
                    </div>
                </div>

                {/* Time Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-orange-500" />
                            Jam Masuk (Batas Telat)
                        </label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                        <p className="text-xs text-slate-400 mt-1">Lewat jam ini dianggap TERLAMBAT.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            Jam Pulang (Minimal)
                        </label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        />
                        <p className="text-xs text-slate-400 mt-1">Tidak bisa Check Out sebelum jam ini.</p>
                    </div>
                </div>

                {/* Current Config Summary */}
                {settings && settings.latitude !== 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <h4 className="text-sm font-semibold text-slate-700">Konfigurasi Aktif</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                            <span>📍 Lat: {settings.latitude.toFixed(6)}</span>
                            <span>📍 Lng: {settings.longitude.toFixed(6)}</span>
                            <span>📏 Radius: {settings.allowed_radius_meters}m</span>
                            <span>⏱️ Masuk: {settings.start_time.substring(0, 5)}</span>
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                >
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
            </div>
        </div>
    );
}
