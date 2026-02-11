import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <DashboardShell userName={user.full_name} userRole={user.role}>
            {children}
        </DashboardShell>
    );
}
