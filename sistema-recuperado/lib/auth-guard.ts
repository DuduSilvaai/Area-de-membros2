/**
 * Authentication guard utilities for server-side protection
 * Use these helpers in Server Actions and API routes
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Verifies the current user is authenticated and returns the user
 * @throws Error if not authenticated
 */
export async function requireAuth() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Unauthorized: Authentication required');
    }

    return user;
}

/**
 * Verifies the current user is an admin
 * @throws Error if not authenticated or not an admin
 */
export async function requireAdmin() {
    const user = await requireAuth();

    const role = user.user_metadata?.role;
    if (role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
    }

    return user;
}

/**
 * Returns the current user if authenticated, null otherwise
 * Does not throw - use for optional authentication scenarios
 */
export async function getCurrentUser() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch {
        return null;
    }
}

/**
 * Checks if the current user has admin role
 * @returns boolean
 */
export async function isAdmin(): Promise<boolean> {
    try {
        const user = await getCurrentUser();
        return user?.user_metadata?.role === 'admin';
    } catch {
        return false;
    }
}
