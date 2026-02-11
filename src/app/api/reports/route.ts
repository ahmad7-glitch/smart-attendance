import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getMonthlyAttendance } from '@/lib/attendance/actions';

// Lazy load heavy export libraries — only loaded when this route is hit
const loadPDFGenerator = () => import('@/lib/reports/pdf').then(m => m.generateAttendancePDF);
const loadExcelGenerator = () => import('@/lib/reports/excel').then(m => m.generateAttendanceExcel);

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
] as const;

export async function GET(request: NextRequest) {
    try {
        const supabase = createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check role - only admin and principal can download reports
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'principal'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const searchParams = request.nextUrl.searchParams;
        const format = searchParams.get('format') || 'pdf';
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

        const logs = await getMonthlyAttendance({ month, year });

        const period = `${MONTH_NAMES[month - 1]} ${year}`;
        const filename = `Laporan_Kehadiran_${MONTH_NAMES[month - 1]}_${year}`;

        if (format === 'excel') {
            const generateExcel = await loadExcelGenerator();
            const buffer = generateExcel(logs, `Kehadiran ${period}`);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
                    'Cache-Control': 'no-store',
                },
            });
        }

        // Default: PDF
        const generatePDF = await loadPDFGenerator();
        const buffer = generatePDF(logs, 'Laporan Kehadiran Guru', period);
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}.pdf"`,
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('[Reports API Error]:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
