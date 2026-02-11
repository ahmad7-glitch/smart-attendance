'use client';

import { useState, useEffect, useTransition } from 'react';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '@/lib/admin/actions';
import type { User } from '@/types';
import ConfirmationModal from '@/components/ConfirmationModal';
import {
    Users, Pencil, Trash2, X, Loader2, CheckCircle2,
    AlertCircle, Search, UserPlus
} from 'lucide-react';

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
    const [teacherToDelete, setTeacherToDelete] = useState<User | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [search, setSearch] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    // Form states
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');

    useEffect(() => {
        loadTeachers();
    }, []);

    async function loadTeachers() {
        const data = await getTeachers();
        setTeachers(data);
        setLoading(false);
    }

    function openCreate() {
        setEditingTeacher(null);
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setShowModal(true);
    }

    function openEdit(teacher: User) {
        setEditingTeacher(teacher);
        setFormName(teacher.full_name);
        setFormEmail(teacher.email || '');
        setFormPassword('');
        setShowModal(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        startTransition(async () => {
            let result;
            if (editingTeacher) {
                result = await updateTeacher(
                    editingTeacher.id,
                    formName,
                    formEmail || undefined,
                    formPassword || undefined
                );
            } else {
                result = await createTeacher(formEmail, formPassword, formName);
            }
            setMessage({ type: result.success ? 'success' : 'error', text: result.message });
            if (result.success) {
                setShowModal(false);
                await loadTeachers();
            }
            setTimeout(() => setMessage(null), 4000);
        });
    }

    function handleDelete(teacher: User) {
        setTeacherToDelete(teacher);
        setShowDeleteModal(true);
    }

    function confirmDelete() {
        if (!teacherToDelete) return;

        startTransition(async () => {
            const result = await deleteTeacher(teacherToDelete.id);
            setMessage({ type: result.success ? 'success' : 'error', text: result.message });
            if (result.success) {
                setShowDeleteModal(false);
                setTeacherToDelete(null);
                await loadTeachers();
            }
            setTimeout(() => setMessage(null), 4000);
        });
    }

    const filtered = teachers.filter(t =>
        t.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-500" />
                    Data Guru
                </h2>
                <button
                    onClick={openCreate}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                >
                    <UserPlus className="w-4 h-4" />
                    Tambah Guru
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    {message.text}
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Cari guru..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
            </div>

            {/* Teachers List */}
            <div className="glass-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <>
                        {/* Mobile card view */}
                        <div className="block sm:hidden p-4 space-y-3">
                            {filtered.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm py-8">Tidak ada data guru.</p>
                            ) : (
                                filtered.map((teacher) => (
                                    <div key={teacher.id} className="bg-slate-50 rounded-xl p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                    {teacher.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">{teacher.full_name}</p>
                                                    <p className="text-xs text-slate-400">{teacher.email || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEdit(teacher)}
                                                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(teacher)}
                                                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Nama</th>
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Email</th>
                                        <th className="text-left py-3 px-6 text-slate-500 font-medium">Terdaftar</th>
                                        <th className="text-right py-3 px-6 text-slate-500 font-medium">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-slate-400">
                                                Tidak ada data guru.
                                            </td>
                                        </tr>
                                    ) : (
                                        filtered.map((teacher, i) => (
                                            <tr key={teacher.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                                                <td className="py-3 px-6 text-slate-400">{i + 1}</td>
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                                            {teacher.full_name.charAt(0)}
                                                        </div>
                                                        <span className="text-slate-900 font-medium">{teacher.full_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-slate-600">{teacher.email || '-'}</td>
                                                <td className="py-3 px-6 text-slate-500">
                                                    {new Date(teacher.created_at).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="py-3 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openEdit(teacher)}
                                                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(teacher)}
                                                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md scale-in overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingTeacher ? 'Edit Guru' : 'Tambah Guru Baru'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="Nama lengkap guru"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    required={!editingTeacher}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="email@sekolah.sch.id"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Password {editingTeacher && <span className="text-slate-400 font-normal">(kosongkan jika tidak diubah)</span>}
                                </label>
                                <input
                                    type="password"
                                    value={formPassword}
                                    onChange={(e) => setFormPassword(e.target.value)}
                                    required={!editingTeacher}
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="Minimal 6 karakter"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 py-3 px-4 gradient-primary text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {editingTeacher ? 'Simpan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Hapus Guru?"
                message={`Apakah Anda yakin ingin menghapus data guru "${teacherToDelete?.full_name}"? Data kehadiran terkait juga akan terhapus permanen.`}
                confirmText="Hapus Guru"
                cancelText="Batal"
                variant="danger"
                isLoading={isPending}
            />
        </div>
    );
}
