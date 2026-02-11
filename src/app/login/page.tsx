'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Clock, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const supabase = createClient();

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError('Email atau password salah.');
                setLoading(false);
                return;
            }

            if (data.user) {
                // Fetch user role
                const { data: profile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                const role = profile?.role || 'teacher';
                router.push(`/dashboard/${role}`);
                router.refresh();
            }
        } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative animate-fade-in">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg shadow-blue-500/25 mb-4">
                        <Clock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        Smart Attendance
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">
                        Sistem Kehadiran Guru - SMP
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass-card p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm animate-fade-in">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nama@sekolah.sch.id"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-400 text-xs mt-6">
                    © {new Date().getFullYear()} Smart Attendance System
                </p>
            </div>
        </div>
    );
}
