'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import type { UserRole } from '@/types';
import { Menu, LogOut } from 'lucide-react';

interface DashboardShellProps {
    children: React.ReactNode;
    userName: string;
    userRole: UserRole;
}

export default function DashboardShell({ children, userName, userRole }: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const router = useRouter();

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
            <div className="flex h-screen overflow-hidden">
                <Sidebar
                    role={userRole}
                    userName={userName}
                    isOpen={sidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    onClose={() => setSidebarOpen(false)}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 py-3 flex items-center justify-between z-30">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                                    Selamat Datang, {userName.split(' ')[0]}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">
                                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Keluar</span>
                            </button>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
