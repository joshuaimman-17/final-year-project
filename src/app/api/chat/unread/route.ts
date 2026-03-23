import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userId = decodedToken.phone_number || decodedToken.uid;
    
    try {
        const rows = await neonSql`
            SELECT sender_id, COUNT(*) as count 
            FROM chat_messages 
            WHERE receiver_id = ${userId} AND is_read = FALSE
            GROUP BY sender_id
        `;
        
        const unreadCounts: Record<string, number> = {};
        rows.forEach(row => {
            unreadCounts[row.sender_id] = parseInt(row.count, 10);
        });

        return NextResponse.json(unreadCounts);
    } catch (error: any) {
        console.error('Fetch Unread Counts Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
