import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/authHelper';

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { token, deviceType = 'web' } = await req.json();
        const userId = decodedToken.uid;

        if (!token) {
            return NextResponse.json({ message: 'Token is required' }, { status: 400 });
        }

        await sql`
            INSERT INTO fcm_tokens (user_id, token, device_type)
            VALUES (${userId}, ${token}, ${deviceType})
            ON CONFLICT (user_id, token) DO NOTHING
        `;

        return NextResponse.json({ message: 'Token registered successfully' });
    } catch (error: any) {
        console.error('Token Registration Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
