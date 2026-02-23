import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

// GET: Fetch a public key for a specific user ID
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ message: 'User ID required' }, { status: 400 });
    }

    try {
        const results = await neonSql`
            SELECT public_key FROM user_public_keys WHERE user_id = ${userId}
        `;

        if (results.length === 0) {
            return NextResponse.json({ message: 'User public key not found' }, { status: 404 });
        }

        return NextResponse.json({ publicKey: results[0].public_key });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: Register or update the current user's public key
export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userId = decodedToken.phone_number || decodedToken.uid;
    const { publicKey } = await req.json();

    if (!publicKey) {
        return NextResponse.json({ message: 'Public key required' }, { status: 400 });
    }

    try {
        await neonSql`
            INSERT INTO user_public_keys (user_id, public_key, updated_at)
            VALUES (${userId}, ${publicKey}, NOW())
            ON CONFLICT (user_id) DO UPDATE SET public_key = EXCLUDED.public_key, updated_at = NOW()
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
