'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { User, UserRole } from '@/types';

export async function getCurrentUser(): Promise<User | null> {
    const supabase = createServerSupabaseClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: profile } = await supabase
        .from('users')
        .select('id, full_name, role, created_at')
        .eq('id', authUser.id)
        .single();

    if (!profile) return null;

    return {
        ...profile,
        email: authUser.email,
    } as User;
}

export async function getUserRole(): Promise<UserRole | null> {
    const user = await getCurrentUser();
    return user?.role ?? null;
}

export async function requireAuth(): Promise<User> {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<User> {
    const user = await requireAuth();
    if (!allowedRoles.includes(user.role)) {
        redirect(`/dashboard/${user.role}`);
    }
    return user;
}

export async function signOut() {
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect('/login');
}
