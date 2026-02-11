'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { SchoolSettings } from '@/types';

export async function getSchoolSettings(): Promise<SchoolSettings | null> {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
        .from('school_settings')
        .select('*')
        .limit(1)
        .single();

    if (error) return null;
    return data as SchoolSettings;
}

export async function updateSchoolSettings(settings: {
    school_name: string;
    latitude: number;
    longitude: number;
    allowed_radius_meters: number;
    max_accuracy_meters: number;
    start_time: string;
    end_time: string;
}): Promise<{ success: boolean; message: string }> {
    const supabase = createServerSupabaseClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    // Role check
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        return { success: false, message: 'Hanya admin yang dapat mengubah pengaturan.' };
    }

    // Validate inputs
    if (
        typeof settings.latitude !== 'number' ||
        typeof settings.longitude !== 'number' ||
        settings.latitude < -90 || settings.latitude > 90 ||
        settings.longitude < -180 || settings.longitude > 180
    ) {
        return { success: false, message: 'Koordinat tidak valid.' };
    }

    if (settings.allowed_radius_meters < 10 || settings.allowed_radius_meters > 10000) {
        return { success: false, message: 'Radius harus antara 10 – 10.000 meter.' };
    }

    if (settings.max_accuracy_meters < 10 || settings.max_accuracy_meters > 500) {
        return { success: false, message: 'Akurasi maksimal harus antara 10 – 500 meter.' };
    }

    const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
    if (!timeRegex.test(settings.start_time) || !timeRegex.test(settings.end_time)) {
        return { success: false, message: 'Format waktu harus HH:MM.' };
    }

    // Use admin client to bypass RLS for upsert
    const admin = createAdminClient();

    // Check if row exists
    const { data: existing } = await admin
        .from('school_settings')
        .select('id')
        .limit(1)
        .single();

    if (existing) {
        const { error } = await admin
            .from('school_settings')
            .update({
                school_name: settings.school_name,
                latitude: settings.latitude,
                longitude: settings.longitude,
                allowed_radius_meters: settings.allowed_radius_meters,
                max_accuracy_meters: settings.max_accuracy_meters,
                start_time: settings.start_time,
                end_time: settings.end_time,
            })
            .eq('id', existing.id);

        if (error) return { success: false, message: `Gagal menyimpan: ${error.message}` };
    } else {
        const { error } = await admin
            .from('school_settings')
            .insert({
                school_name: settings.school_name,
                latitude: settings.latitude,
                longitude: settings.longitude,
                allowed_radius_meters: settings.allowed_radius_meters,
                max_accuracy_meters: settings.max_accuracy_meters,
                start_time: settings.start_time,
                end_time: settings.end_time,
            });

        if (error) return { success: false, message: `Gagal menyimpan: ${error.message}` };
    }

    return { success: true, message: 'Pengaturan berhasil disimpan.' };
}
