import { syncUsersProfiles } from '@/app/(admin)/users/actions';
import { NextResponse } from 'next/server';

export async function GET() {
    console.log('--- STARTING GLOBAL SYNC ---');
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
