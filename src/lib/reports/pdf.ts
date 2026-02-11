import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AttendanceLog } from '@/types';

export function generateAttendancePDF(
    logs: AttendanceLog[],
    title: string,
    period: string
): Buffer {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text('Smart Attendance System', 14, 15);
    doc.setFontSize(12);
    doc.text(title, 14, 25);
    doc.setFontSize(10);
    doc.text(`Periode: ${period}`, 14, 32);
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 38);

    // Table
    const tableData = logs.map((log, index) => [
        index + 1,
        log.users?.full_name || '-',
        log.date,
        log.check_in ? new Date(log.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
        log.check_out ? new Date(log.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
        log.status === 'PRESENT' ? 'Hadir' : log.status === 'LATE' ? 'Terlambat' : 'Tidak Lengkap',
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['No', 'Nama', 'Tanggal', 'Masuk', 'Pulang', 'Status']],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
    });

    return Buffer.from(doc.output('arraybuffer'));
}
