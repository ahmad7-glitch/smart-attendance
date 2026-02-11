'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { User } from '@/types';

export async function getTeachers(): Promise<User[]> {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, email, created_at')
        .eq('role', 'teacher')
        .order('full_name', { ascending: true });

    if (error) return [];
    return data as User[];
}

export async function getAllUsers(): Promise<User[]> {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, email, created_at')
        .order('full_name', { ascending: true });

    if (error) return [];
    return data as User[];
}

export async function createTeacher(
    email: string,
    password: string,
    fullName: string
): Promise<{ success: boolean; message: string }> {
    const admin = createAdminClient();

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError) {
        return { success: false, message: `Gagal membuat akun: ${authError.message}` };
    }

    // Create profile in users table
    const { error: profileError } = await admin
        .from('users')
        .insert({
            id: authData.user.id,
            full_name: fullName,
            email: email, // Added email
            role: 'teacher',
        });

    if (profileError) {
        // Cleanup: delete auth user if profile creation fails
        await admin.auth.admin.deleteUser(authData.user.id);
        return { success: false, message: `Gagal membuat profil: ${profileError.message}` };
    }

    return { success: true, message: 'Akun guru berhasil dibuat.' };
}

export async function updateTeacher(
    userId: string,
    fullName: string,
    email?: string,
    password?: string,
): Promise<{ success: boolean; message: string }> {
    const admin = createAdminClient();

    // Update profile
    const updatePayload: { full_name: string; email?: string } = { full_name: fullName };
    if (email) updatePayload.email = email;

    const { error: profileError } = await admin
        .from('users')
        .update(updatePayload)
        .eq('id', userId);

    if (profileError) {
        return { success: false, message: `Gagal update profil: ${profileError.message}` };
    }

    // Update auth user if email or password changed
    if (email || password) {
        const updateData: { email?: string; password?: string } = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;

        const { error: authError } = await admin.auth.admin.updateUserById(userId, updateData);
        if (authError) {
            return { success: false, message: `Gagal update auth: ${authError.message}` };
        }
    }

    return { success: true, message: 'Data guru berhasil diperbarui.' };
}

export async function deleteTeacher(
    userId: string
): Promise<{ success: boolean; message: string }> {
    const admin = createAdminClient();

    // Delete from users table (will cascade to attendance_logs)
    const { error: profileError } = await admin
        .from('users')
        .delete()
        .eq('id', userId);

    if (profileError) {
        return { success: false, message: `Gagal hapus profil: ${profileError.message}` };
    }

    // Delete auth user
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) {
        return { success: false, message: `Gagal hapus auth: ${authError.message}` };
    }

    return { success: true, message: 'Akun guru berhasil dihapus.' };
}
