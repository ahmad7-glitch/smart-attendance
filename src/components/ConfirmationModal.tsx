import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'danger',
    isLoading = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-in">
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-5 ${variant === 'danger' ? 'bg-rose-100 text-rose-600' :
                        variant === 'warning' ? 'bg-amber-100 text-amber-600' :
                            'bg-blue-100 text-blue-600'
                        }`}>
                        <AlertTriangle className="w-8 h-8" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">{message}</p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 py-3 px-4 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${variant === 'danger' ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98]' :
                                variant === 'warning' ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]' :
                                    'gradient-primary shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {isLoading ? 'Memproses...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
