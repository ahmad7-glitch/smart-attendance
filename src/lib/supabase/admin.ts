import { createClient } from '@supabase/supabase-js';

// Service role client – NEVER expose to client-side code
// This bypasses RLS and should only be used in server actions / API routes
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
