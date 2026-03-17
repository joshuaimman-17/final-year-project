import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    try {
        // Fetch user basic info and follower count
        const userResult = await neonSql`
            SELECT 
                u.id, u.username, u.full_name, u.role, u.created_at, u.about, u.avatar_url,
                (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as follower_count
            FROM users u
            WHERE u.id = ${id}
        `;

        if (userResult.length === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(userResult[0]);
    } catch (error: any) {
        console.error('Fetch User Profile Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
