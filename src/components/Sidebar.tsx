'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/types';
import {
    LayoutDashboard,
    Clock,
    History,
    Users,
    FileText,
    BarChart3,
    ClipboardCheck,
    X,
    ChevronLeft,
    ChevronRight,
    Settings,
} from 'lucide-react';

// Using a simpler clean implementation for the clock inside
function SimpleClock() {
    const [mounted, setMounted] = useState(false);
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setMounted(true);
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted || !time) return <div className="h-10 w-20 animate-pulse bg-white/10 rounded"></div>;

    return (
        <div className="flex flex-col items-center">
            <div className="text-3xl font-bold tracking-wider font-mono">
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')}
            </div>
            <div className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium mt-1">
                {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
        </div>
    );
}


interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const navItemsByRole: Record<UserRole, NavItem[]> = {
    teacher: [
        { label: 'Dashboard', href: '/dashboard/teacher', icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> },
        { label: 'Riwayat', href: '/dashboard/teacher/history', icon: <History className="w-5 h-5 flex-shrink-0" /> },
    ],
    admin: [
        { label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> },
        { label: 'Data Guru', href: '/dashboard/admin/teachers', icon: <Users className="w-5 h-5 flex-shrink-0" /> },
        { label: 'Kehadiran', href: '/dashboard/admin/attendance', icon: <ClipboardCheck className="w-5 h-5 flex-shrink-0" /> },
        { label: 'Laporan', href: '/dashboard/admin/reports', icon: <FileText className="w-5 h-5 flex-shrink-0" /> },
        { label: 'Pengaturan', href: '/dashboard/admin/settings', icon: <Settings className="w-5 h-5 flex-shrink-0" /> },
    ],
    principal: [
        { label: 'Dashboard', href: '/dashboard/principal', icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" /> },
        { label: 'Statistik', href: '/dashboard/principal/stats', icon: <BarChart3 className="w-5 h-5 flex-shrink-0" /> },
        { label: 'Laporan', href: '/dashboard/principal/reports', icon: <FileText className="w-5 h-5 flex-shrink-0" /> },
    ],
};

const roleLabels: Record<UserRole, string> = {
    teacher: 'Guru',
    admin: 'Admin',
    principal: 'Kepala Sekolah',
};

interface SidebarProps {
    role: UserRole;
    userName: string;
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggleCollapse: () => void;
}

export default function Sidebar({ role, userName, isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const navItems = navItemsByRole[role];

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 lg:hidden animate-fade-in"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 z-50 h-full bg-white/80 backdrop-blur-xl border-r border-slate-200/60 
          shadow-2xl shadow-slate-200/40
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:shadow-none lg:z-auto
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-20' : 'w-72'}
        `}
            >
                {/* Header */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-6 py-5 border-b border-slate-100/50 h-20 bg-white/50 backdrop-blur-sm flex-shrink-0`}>
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                            <Clock className="w-5 h-5 text-white stroke-[2.5]" />
                        </div>
                        {!isCollapsed && (
                            <div className="animate-fade-in flex flex-col justify-center">
                                <h2 className="font-bold text-slate-900 text-[0.95rem] leading-tight tracking-tight">Smart Attendance</h2>
                                <p className="text-[0.7rem] font-medium text-slate-500 uppercase tracking-wider mt-0.5">SMP Negeri 1</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 transition-all active:scale-95"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive
                                        ? 'gradient-primary text-white shadow-md shadow-blue-500/25'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                                title={isCollapsed ? item.label : undefined}
                            >
                                {item.icon}
                                {!isCollapsed && <span className="animate-fade-in whitespace-nowrap">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section: User Info & Toggle */}
                <div className="mt-auto bg-white/50 backdrop-blur-sm border-t border-slate-100 p-4">
                    {/* Real-time Clock */}
                    <div className={`mb-4 transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white shadow-lg shadow-slate-900/10 relative overflow-hidden group">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full -mr-4 -mt-4 blur-xl"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 bg-blue-500/20 rounded-full -ml-2 -mb-2 blur-md"></div>

                            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                                <SimpleClock />
                            </div>
                        </div>
                    </div>

                    <div className={`flex items-center ${isCollapsed ? 'flex-col gap-4' : 'justify-between gap-2'}`}>
                        {/* User Info */}
                        <div className={`flex items-center gap-3 transition-all duration-200 overflow-hidden ${isCollapsed ? 'justify-center w-full' : 'flex-1'}`}>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 shadow-md shadow-blue-500/10 ring-2 ring-white">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0 animate-fade-in flex flex-col">
                                    <p className="font-semibold text-slate-900 text-sm truncate leading-tight">{userName}</p>
                                    <span className="text-[0.65rem] font-medium text-slate-500 uppercase tracking-wide">
                                        {roleLabels[role]}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Toggle Button */}
                        <div className="hidden lg:flex">
                            <button
                                onClick={onToggleCollapse}
                                className={`
                                    p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 
                                    transition-all duration-200 active:scale-95
                                    ${isCollapsed ? 'bg-slate-50' : ''}
                                `}
                                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                            >
                                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
