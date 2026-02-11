import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Redirect unauthenticated users to login
    if (!user && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect root to login
    if (pathname === '/' && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // For authenticated users, fetch role once and reuse
    if (user) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const role = profile?.role || 'teacher';

        // Redirect root to dashboard
        if (pathname === '/') {
            return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
        }

        // Redirect away from login
        if (pathname === '/login') {
            return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
        }

        // Role-based route protection
        if (pathname.startsWith('/dashboard/')) {
            const segments = pathname.split('/');
            const dashboardRole = segments[2];

            if (dashboardRole && ['teacher', 'admin', 'principal'].includes(dashboardRole) && dashboardRole !== role) {
                return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
            }
        }
    }

    return response;
}

export const config = {
    matcher: ['/', '/login', '/dashboard/:path*'],
};
