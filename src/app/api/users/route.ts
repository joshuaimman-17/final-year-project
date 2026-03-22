import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const users = await neonSql`
            SELECT id, username, full_name, avatar_url, role 
            FROM users 
            WHERE role != 'BUYER'
            ORDER BY created_at DESC
            LIMIT 50
        `;

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('All Users Fetch Error (Neon):', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
