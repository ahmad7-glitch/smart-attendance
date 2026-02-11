export type UserRole = 'teacher' | 'admin' | 'principal';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'INCOMPLETE';

export interface User {
    id: string;
    full_name: string;
    role: UserRole;
    created_at: string;
    email?: string;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
    accuracy: number;
}

export interface AttendanceLog {
    id: string;
    user_id: string;
    date: string;
    check_in: string | null;
    check_out: string | null;
    status: AttendanceStatus;
    ip_address: string | null;
    check_in_lat: number | null;
    check_in_lng: number | null;
    check_out_lat: number | null;
    check_out_lng: number | null;
    distance_from_school_meters: number | null;
    location_accuracy: number | null;
    created_at: string;
    // Joined field
    users?: {
        full_name: string;
    };
}

export interface SchoolSettings {
    id: string;
    school_name: string;
    latitude: number;
    longitude: number;
    allowed_radius_meters: number;
    max_accuracy_meters: number;
    start_time: string; // HH:MM
    end_time: string;   // HH:MM
    created_at: string;
}

export interface DashboardStats {
    totalTeachers: number;
    presentToday: number;
    lateToday: number;
    incompleteToday: number;
    attendancePercentage: number;
}

export interface AppSettings {
    key: string;
    value: string;
    updated_at: string;
}

export interface AttendanceFilter {
    month?: number;
    year?: number;
    date?: string;
    userId?: string;
}
