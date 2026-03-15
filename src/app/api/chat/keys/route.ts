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
        // Find the requester's identity if they are authenticated
        const decodedToken = await verifyAuth(req);
        const myId = decodedToken ? (decodedToken.phone_number || decodedToken.uid) : null;

        // SMART LOOKUP: Try to find the key by the given ID, 
        // OR by any alternate ID that shares the same email (e.g. UID vs Phone Number)
        const results = await neonSql`
            SELECT public_key, encrypted_private_key 
            FROM user_public_keys 
            WHERE user_id = ${userId}
            OR user_id IN (
                SELECT id FROM users WHERE email = (
                    SELECT email FROM users WHERE id = ${userId} AND email IS NOT NULL
                )
            )
            LIMIT 1
        `;

        if (results.length === 0) {
            return NextResponse.json({ message: 'User public key not found' }, { status: 404 });
        }

        const response: any = { publicKey: results[0].public_key };
        
        // Only return encrypted private key if the user is requesting their own key
        if (myId === userId) {
            response.encryptedPrivateKey = results[0].encrypted_private_key;
        }

        return NextResponse.json(response);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: Register or update the current user's public key
export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userId = decodedToken.phone_number || decodedToken.uid;
    const { publicKey, encryptedPrivateKey } = await req.json();

    if (!publicKey) {
        return NextResponse.json({ message: 'Public key required' }, { status: 400 });
    }

    try {
        await neonSql`
            INSERT INTO user_public_keys (user_id, public_key, encrypted_private_key, updated_at)
            VALUES (${userId}, ${publicKey}, ${encryptedPrivateKey || null}, NOW())
            ON CONFLICT (user_id) DO UPDATE SET 
                public_key = EXCLUDED.public_key, 
                encrypted_private_key = COALESCE(EXCLUDED.encrypted_private_key, user_public_keys.encrypted_private_key),
                updated_at = NOW()
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
// DELETE: Remove the current user's encryption keys (Reset functionality)
export async function DELETE(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userId = decodedToken.phone_number || decodedToken.uid;

    try {
        await neonSql`
            DELETE FROM user_public_keys WHERE user_id = ${userId}
        `;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
