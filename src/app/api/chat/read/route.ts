import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

export async function PUT(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userId = decodedToken.phone_number || decodedToken.uid;
    const body = await req.json();
    const { senderId } = body;

    if (!senderId) {
        return NextResponse.json({ message: 'senderId required' }, { status: 400 });
    }

    try {
        await neonSql`
            UPDATE chat_messages 
            SET is_read = TRUE 
            WHERE receiver_id = ${userId} AND sender_id = ${senderId} AND is_read = FALSE
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Mark Messages Read Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
