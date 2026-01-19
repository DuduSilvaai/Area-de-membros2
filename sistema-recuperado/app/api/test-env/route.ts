
import { NextResponse } from 'next/server';

export async function GET() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    return NextResponse.json({
        hasUrl: !!url,
        hasServiceKey: !!serviceKey,
        keyPrefix: serviceKey ? serviceKey.substring(0, 5) : 'MISSING',
        nodeEnv: process.env.NODE_ENV
    });
}
