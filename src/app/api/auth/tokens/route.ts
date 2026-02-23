import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { token, deviceType = 'web' } = await req.json();
        const userId = decodedToken.phone_number || decodedToken.uid;

        if (!token) {
            return NextResponse.json({ message: 'Token is required' }, { status: 400 });
        }

        await neonSql`
            INSERT INTO fcm_tokens (user_id, token, device_type)
            VALUES (${userId}, ${token}, ${deviceType})
            ON CONFLICT (user_id, token) DO NOTHING
        `;

        return NextResponse.json({ message: 'Token registered successfully in Neon' });
    } catch (error: any) {
        console.error('Token Registration Error (Neon):', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
