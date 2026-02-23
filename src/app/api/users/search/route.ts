import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ users: [] });
    }

    try {
        const users = await sql`
            SELECT id, username, full_name, avatar_url, role 
            FROM users 
            WHERE username ILIKE ${'%' + query + '%'}
            OR full_name ILIKE ${'%' + query + '%'}
            LIMIT 10
        `;

        return NextResponse.json({ users });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
