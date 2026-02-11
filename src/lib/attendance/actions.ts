'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { haversineDistance } from '@/lib/geo/haversine';
import type { AttendanceLog, AttendanceStatus, AttendanceFilter, DashboardStats, GeoLocation } from '@/types';

function getClientIP(): string {
    const headersList = headers();
    const forwarded = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    return forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
}

async function validateLocation(
    supabase: ReturnType<typeof createServerSupabaseClient>,
    location: GeoLocation
): Promise<{ valid: boolean; distance: number; message?: string }> {
    const { data: settings } = await supabase
        .from('school_settings')
        .select('latitude, longitude, allowed_radius_meters, max_accuracy_meters')
        .limit(1)
        .single();

    // If no settings configured, allow attendance (GPS not enforced)
    if (!settings || (settings.latitude === 0 && settings.longitude === 0)) {
        return { valid: true, distance: 0 };
    }

    // Validate accuracy
    if (location.accuracy > settings.max_accuracy_meters) {
        return {
            valid: false,
            distance: 0,
            message: `Akurasi GPS terlalu rendah (${Math.round(location.accuracy)}m). Maksimal ${settings.max_accuracy_meters}m. Coba di area terbuka.`,
        };
    }

    // Compute distance
    const distance = haversineDistance(
        location.latitude,
        location.longitude,
        settings.latitude,
        settings.longitude
    );

    if (distance > settings.allowed_radius_meters) {
        return {
            valid: false,
            distance: Math.round(distance),
            message: `Anda berada di luar area absensi (${Math.round(distance)}m dari sekolah). Radius maksimal: ${settings.allowed_radius_meters}m.`,
        };
    }

    return { valid: true, distance: Math.round(distance) };
}

function validateGeoInput(location: GeoLocation): string | null {
    if (
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number' ||
        typeof location.accuracy !== 'number'
    ) {
        return 'Data lokasi tidak valid.';
    }
    if (location.latitude < -90 || location.latitude > 90) return 'Latitude tidak valid.';
    if (location.longitude < -180 || location.longitude > 180) return 'Longitude tidak valid.';
    if (location.accuracy < 0) return 'Akurasi tidak valid.';
    return null;
}

export async function checkDistance(
    location: GeoLocation
): Promise<{ success: boolean; distance: number; message: string }> {
    const supabase = createServerSupabaseClient();

    // Validate GPS input
    const inputError = validateGeoInput(location);
    if (inputError) return { success: false, distance: 0, message: inputError };

    const result = await validateLocation(supabase, location);

    return {
        success: result.valid,
        distance: result.distance,
        message: result.valid
            ? `Lokasi valid (${result.distance}m dari sekolah).`
            : result.message || 'Lokasi tidak valid.'
    };
}

export async function checkIn(
    location: GeoLocation
): Promise<{ success: boolean; message: string; data?: AttendanceLog }> {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    // Validate GPS input
    const inputError = validateGeoInput(location);
    if (inputError) return { success: false, message: inputError };

    const today = new Date().toISOString().split('T')[0];

    // Check for existing check-in today
    const { data: existing } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

    if (existing) {
        return { success: false, message: 'Anda sudah melakukan check-in hari ini.' };
    }

    // Validate location
    const gpsResult = await validateLocation(supabase, location);
    if (!gpsResult.valid) {
        return { success: false, message: gpsResult.message! };
    }

    // Get school settings for late threshold
    const { data: settings } = await supabase
        .from('school_settings')
        .select('start_time')
        .limit(1)
        .single();

    const threshold = settings?.start_time || '07:00';
    const now = new Date();
    const [threshHour, threshMin] = threshold.split(':').map(Number);
    // remove seconds if present

    const thresholdTime = new Date(now);
    thresholdTime.setHours(threshHour, threshMin, 0, 0);

    const status: AttendanceStatus = now <= thresholdTime ? 'PRESENT' : 'LATE';
    const ip = getClientIP();

    const { data, error } = await supabase
        .from('attendance_logs')
        .insert({
            user_id: user.id,
            date: today,
            check_in: now.toISOString(),
            status,
            ip_address: ip,
            check_in_lat: location.latitude,
            check_in_lng: location.longitude,
            distance_from_school_meters: gpsResult.distance,
            location_accuracy: location.accuracy,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            return { success: false, message: 'Anda sudah melakukan check-in hari ini.' };
        }
        return { success: false, message: `Gagal check-in: ${error.message}` };
    }

    return {
        success: true,
        message: status === 'PRESENT'
            ? `Check-in berhasil! Status: Hadir tepat waktu. (${gpsResult.distance}m dari sekolah)`
            : `Check-in berhasil! Status: Terlambat. (${gpsResult.distance}m dari sekolah)`,
        data
    };
}

export async function checkOut(
    location: GeoLocation
): Promise<{ success: boolean; message: string; data?: AttendanceLog }> {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: 'Unauthorized' };

    // Validate GPS input
    const inputError = validateGeoInput(location);
    if (inputError) return { success: false, message: inputError };

    const today = new Date().toISOString().split('T')[0];

    // Check for existing check-in today
    const { data: existing } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

    if (!existing) {
        return { success: false, message: 'Anda belum melakukan check-in hari ini.' };
    }

    if (existing.check_out) {
        return { success: false, message: 'Anda sudah melakukan check-out hari ini.' };
    }

    // Validate location
    const gpsResult = await validateLocation(supabase, location);
    if (!gpsResult.valid) {
        return { success: false, message: gpsResult.message! };
    }

    const now = new Date();

    // Check end_time (Jam Pulang)
    const { data: settings } = await supabase
        .from('school_settings')
        .select('end_time')
        .limit(1)
        .single();

    if (settings && settings.end_time) {
        const [endHour, endMin] = settings.end_time.split(':').map(Number);
        const endTime = new Date(now);
        endTime.setHours(endHour, endMin, 0, 0);

        if (now < endTime) {
            return {
                success: false,
                message: `Belum waktunya pulang. Jam pulang: ${settings.end_time.substring(0, 5)}`
            };
        }
    }

    const { data, error } = await supabase
        .from('attendance_logs')
        .update({
            check_out: now.toISOString(),
            check_out_lat: location.latitude,
            check_out_lng: location.longitude,
        })
        .eq('id', existing.id)
        .select()
        .single();

    if (error) {
        return { success: false, message: `Gagal check-out: ${error.message}` };
    }

    return { success: true, message: `Check-out berhasil! (${gpsResult.distance}m dari sekolah)`, data };
}

export async function getAttendanceHistory(
    userId?: string,
    page: number = 1,
    limit: number = 10
): Promise<{ data: AttendanceLog[]; total: number }> {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], total: 0 };

    const targetUserId = userId || user.id;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
        .from('attendance_logs')
        .select('id, user_id, date, check_in, check_out, status, ip_address, check_in_lat, check_in_lng, check_out_lat, check_out_lng, distance_from_school_meters, location_accuracy, created_at, users(full_name)', { count: 'exact' })
        .eq('user_id', targetUserId)
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) return { data: [], total: 0 };

    return { data: data as unknown as AttendanceLog[], total: count || 0 };
}

export async function getDailyAttendance(date: string): Promise<AttendanceLog[]> {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
        .from('attendance_logs')
        .select('id, user_id, date, check_in, check_out, status, ip_address, check_in_lat, check_in_lng, check_out_lat, check_out_lng, distance_from_school_meters, location_accuracy, created_at, users(full_name)')
        .eq('date', date)
        .order('check_in', { ascending: true });

    if (error) return [];
    return data as unknown as AttendanceLog[];
}

export async function getMonthlyAttendance(filter: AttendanceFilter): Promise<AttendanceLog[]> {
    const supabase = createServerSupabaseClient();

    const year = filter.year || new Date().getFullYear();
    const month = filter.month || new Date().getMonth() + 1;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    let query = supabase
        .from('attendance_logs')
        .select('id, user_id, date, check_in, check_out, status, ip_address, check_in_lat, check_in_lng, check_out_lat, check_out_lng, distance_from_school_meters, location_accuracy, created_at, users(full_name)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    if (filter.userId) {
        query = query.eq('user_id', filter.userId);
    }

    const { data, error } = await query;
    if (error) return [];
    return data as unknown as AttendanceLog[];
}

export async function updateAttendanceLog(
    logId: string,
    updates: Partial<Pick<AttendanceLog, 'check_in' | 'check_out' | 'status'>>
): Promise<{ success: boolean; message: string }> {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
        .from('attendance_logs')
        .update(updates)
        .eq('id', logId);

    if (error) {
        return { success: false, message: `Gagal update: ${error.message}` };
    }

    return { success: true, message: 'Data berhasil diperbarui.' };
}

export async function getAttendanceStats(): Promise<DashboardStats> {
    const supabase = createServerSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    // Parallel queries — 2 instead of sequential
    const [teacherResult, logsResult] = await Promise.all([
        supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'teacher'),
        supabase
            .from('attendance_logs')
            .select('status')
            .eq('date', today),
    ]);

    const total = teacherResult.count || 0;
    const todayLogs = logsResult.data;
    const presentToday = todayLogs?.filter(l => l.status === 'PRESENT').length || 0;
    const lateToday = todayLogs?.filter(l => l.status === 'LATE').length || 0;
    const incompleteToday = todayLogs?.filter(l => l.status === 'INCOMPLETE').length || 0;
    const attendancePercentage = total > 0
        ? Math.round(((presentToday + lateToday) / total) * 100)
        : 0;

    return {
        totalTeachers: total,
        presentToday,
        lateToday,
        incompleteToday,
        attendancePercentage,
    };
}

export async function getTodayStatus(userId: string): Promise<AttendanceLog | null> {
    const supabase = createServerSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
        .from('attendance_logs')
        .select('id, user_id, date, check_in, check_out, status, distance_from_school_meters, location_accuracy')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    return data as AttendanceLog | null;
}

export async function getWeeklyTrend(): Promise<{ date: string; present: number; late: number; absent: number }[]> {
    const supabase = createServerSupabaseClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // 2 queries instead of 8 (1 teacher count + 1 batch date range)
    const [teacherResult, logsResult] = await Promise.all([
        supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'teacher'),
        supabase
            .from('attendance_logs')
            .select('date, status')
            .gte('date', startStr)
            .lte('date', endStr),
    ]);

    const total = teacherResult.count || 0;
    const logs = logsResult.data || [];

    // Group by date in memory
    const logsByDate = new Map<string, { present: number; late: number }>();
    for (const log of logs) {
        const entry = logsByDate.get(log.date) || { present: 0, late: 0 };
        if (log.status === 'PRESENT') entry.present++;
        else if (log.status === 'LATE') entry.late++;
        logsByDate.set(log.date, entry);
    }

    const results = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const entry = logsByDate.get(dateStr) || { present: 0, late: 0 };

        results.push({
            date: dateStr,
            present: entry.present,
            late: entry.late,
            absent: Math.max(0, total - entry.present - entry.late),
        });
    }

    return results;
}

export async function getStatusDistribution(): Promise<{ name: string; value: number }[]> {
    const supabase = createServerSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    // Parallel queries
    const [teacherResult, logsResult] = await Promise.all([
        supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'teacher'),
        supabase
            .from('attendance_logs')
            .select('status')
            .eq('date', today),
    ]);

    const total = teacherResult.count || 0;
    const logs = logsResult.data;
    const present = logs?.filter(l => l.status === 'PRESENT').length || 0;
    const late = logs?.filter(l => l.status === 'LATE').length || 0;
    const absent = Math.max(0, total - present - late);

    return [
        { name: 'Hadir', value: present },
        { name: 'Terlambat', value: late },
        { name: 'Tidak Hadir', value: absent },
    ];
}

/**
 * Combined dashboard data — single function to get stats, weekly trend, and distribution
 * Reduces total DB queries from ~12 to 3 by sharing the teacher count
 */
export async function getDashboardData(): Promise<{
    stats: DashboardStats;
    weeklyTrend: { date: string; present: number; late: number; absent: number }[];
    statusDistribution: { name: string; value: number }[];
}> {
    const supabase = createServerSupabaseClient();
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // 3 parallel queries total (instead of 12+ sequential)
    const [teacherResult, todayLogsResult, weekLogsResult] = await Promise.all([
        supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'teacher'),
        supabase
            .from('attendance_logs')
            .select('status')
            .eq('date', today),
        supabase
            .from('attendance_logs')
            .select('date, status')
            .gte('date', weekStartStr)
            .lte('date', today),
    ]);

    const totalTeachers = teacherResult.count || 0;
    const todayLogs = todayLogsResult.data || [];
    const weekLogs = weekLogsResult.data || [];

    // Stats
    const presentToday = todayLogs.filter(l => l.status === 'PRESENT').length;
    const lateToday = todayLogs.filter(l => l.status === 'LATE').length;
    const incompleteToday = todayLogs.filter(l => l.status === 'INCOMPLETE').length;
    const attendancePercentage = totalTeachers > 0
        ? Math.round(((presentToday + lateToday) / totalTeachers) * 100)
        : 0;

    // Weekly trend
    const logsByDate = new Map<string, { present: number; late: number }>();
    for (const log of weekLogs) {
        const entry = logsByDate.get(log.date) || { present: 0, late: 0 };
        if (log.status === 'PRESENT') entry.present++;
        else if (log.status === 'LATE') entry.late++;
        logsByDate.set(log.date, entry);
    }

    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const entry = logsByDate.get(dateStr) || { present: 0, late: 0 };
        weeklyTrend.push({
            date: dateStr,
            present: entry.present,
            late: entry.late,
            absent: Math.max(0, totalTeachers - entry.present - entry.late),
        });
    }

    return {
        stats: {
            totalTeachers,
            presentToday,
            lateToday,
            incompleteToday,
            attendancePercentage,
        },
        weeklyTrend,
        statusDistribution: [
            { name: 'Hadir', value: presentToday },
            { name: 'Terlambat', value: lateToday },
            { name: 'Tidak Hadir', value: Math.max(0, totalTeachers - presentToday - lateToday) },
        ],
    };
}
