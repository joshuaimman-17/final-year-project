import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

// GET: Fetch conversation messages for the current user
export async function GET(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userId = decodedToken.phone_number || decodedToken.uid;
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('otherUserId');

    try {
        let messages;
        if (otherUserId) {
            // Specific conversation
            messages = await neonSql`
                SELECT * FROM chat_messages 
                WHERE (sender_id = ${userId} AND receiver_id = ${otherUserId})
                OR (sender_id = ${otherUserId} AND receiver_id = ${userId})
                ORDER BY created_at ASC
            `;
        } else {
            // Recent conversations list (simplified)
            messages = await neonSql`
                SELECT DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
                    id, sender_id, receiver_id, encrypted_content, created_at
                FROM chat_messages
                WHERE sender_id = ${userId} OR receiver_id = ${userId}
                ORDER BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC
            `;
        }

        return NextResponse.json(messages);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST: Send an encrypted message
export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userId = decodedToken.phone_number || decodedToken.uid;
    const { receiverId, encryptedContent } = await req.json();

    if (!receiverId || !encryptedContent) {
        return NextResponse.json({ message: 'Receiver ID and encrypted content required' }, { status: 400 });
    }

    try {
        const result = await neonSql`
            INSERT INTO chat_messages (sender_id, receiver_id, encrypted_content)
            VALUES (${userId}, ${receiverId}, ${encryptedContent})
            RETURNING *
        `;

        return NextResponse.json(result[0]);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
