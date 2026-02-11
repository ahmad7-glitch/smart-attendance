import { type LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    gradient: 'primary' | 'success' | 'warning' | 'danger';
    trend?: {
        value: number;
        label: string;
    };
}

const gradientMap = {
    primary: 'from-blue-500 to-indigo-600',
    success: 'from-emerald-500 to-teal-500',
    warning: 'from-amber-500 to-orange-500',
    danger: 'from-rose-500 to-pink-500',
};

const shadowMap = {
    primary: 'shadow-blue-500/20',
    success: 'shadow-emerald-500/20',
    warning: 'shadow-amber-500/20',
    danger: 'shadow-rose-500/20',
};

export default function KPICard({ title, value, subtitle, icon: Icon, gradient, trend }: KPICardProps) {
    return (
        <div className="glass-card p-5 sm:p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
                            <span className="text-slate-400">{trend.label}</span>
                        </div>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientMap[gradient]} flex items-center justify-center shadow-lg ${shadowMap[gradient]} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
}
