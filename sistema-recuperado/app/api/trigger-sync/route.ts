import { syncUsersProfiles } from '@/app/(admin)/users/actions';
import { requireAdmin } from '@/lib/auth-guard';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Require admin authentication before allowing sync
        await requireAdmin();
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Unauthorized' },
            { status: 401 }
        );
    }

    console.log('--- STARTING GLOBAL SYNC (Admin Authorized) ---');
    const start = Date.now();

    const result = await syncUsersProfiles();

    const duration = Date.now() - start;
    console.log(`Global sync completed in ${duration}ms`, result);

    return NextResponse.json({
        message: 'Global sync executed',
        result,
        duration_ms: duration
    });
}
