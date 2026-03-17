import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

// GET: Check if current user is following the given user
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ isFollowing: false }, { status: 401 });

    const followerId = decodedToken.phone_number || decodedToken.uid;
    const resolvedParams = await params;
    const followingId = resolvedParams.id;

    try {
        const result = await neonSql`
            SELECT 1 FROM followers 
            WHERE follower_id = ${followerId} AND following_id = ${followingId}
        `;

        return NextResponse.json({ isFollowing: result.length > 0 });
    } catch (err: any) {
        console.error('Check Follow Error:', err);
        return NextResponse.json({ isFollowing: false }, { status: 500 });
    }
}
