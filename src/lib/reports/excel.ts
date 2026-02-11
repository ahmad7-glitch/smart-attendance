import * as XLSX from 'xlsx';
import type { AttendanceLog } from '@/types';

export function generateAttendanceExcel(
    logs: AttendanceLog[],
    sheetName: string = 'Attendance'
): Buffer {
    const data = logs.map((log, index) => ({
        'No': index + 1,
        'Nama': log.users?.full_name || '-',
        'Tanggal': log.date,
        'Jam Masuk': log.check_in
            ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            : '-',
        'Jam Pulang': log.check_out
            ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
            : '-',
        'Status': log.status === 'PRESENT' ? 'Hadir' : log.status === 'LATE' ? 'Terlambat' : 'Tidak Lengkap',
        'IP Address': log.ip_address || '-',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 25 },  // Nama
        { wch: 12 },  // Tanggal
        { wch: 12 },  // Jam Masuk
        { wch: 12 },  // Jam Pulang
        { wch: 15 },  // Status
        { wch: 18 },  // IP
    ];

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    return Buffer.from(excelBuffer);
}
