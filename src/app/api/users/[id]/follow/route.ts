import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

// POST: Follow a user
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const followerId = decodedToken.phone_number || decodedToken.uid;
    const resolvedParams = await params;
    const followingId = resolvedParams.id;

    if (followerId === followingId) {
        return NextResponse.json({ message: 'You cannot follow yourself' }, { status: 400 });
    }

    try {
        // 0. Experts cannot follow anyone
        const callerRows = await neonSql`SELECT role FROM users WHERE id = ${followerId}`;
        if (callerRows[0]?.role === 'EXPERT') {
            return NextResponse.json({ message: 'Experts cannot follow anyone' }, { status: 403 });
        }

        // 1. Check if the user to be followed is an EXPERT.
        const targetUserRows = await neonSql`SELECT role FROM users WHERE id = ${followingId}`;
        if (targetUserRows.length === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const targetRole = targetUserRows[0].role;
        if (targetRole !== 'EXPERT' && followingId !== 'ksdharanidharan2005@gmail.com') { // Admin/Expert allowed
            return NextResponse.json({ message: 'You can only follow Experts' }, { status: 403 });
        }

        // 2. Insert into followers table
        await neonSql`
            INSERT INTO followers (follower_id, following_id) 
            VALUES (${followerId}, ${followingId})
            ON CONFLICT (follower_id, following_id) DO NOTHING
        `;

        return NextResponse.json({ message: 'Successfully followed user' });
    } catch (err: any) {
        console.error('Follow Error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Unfollow a user
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const followerId = decodedToken.phone_number || decodedToken.uid;
    const resolvedParams = await params;
    const followingId = resolvedParams.id;

    try {
        await neonSql`
            DELETE FROM followers 
            WHERE follower_id = ${followerId} AND following_id = ${followingId}
        `;

        return NextResponse.json({ message: 'Successfully unfollowed user' });
    } catch (err: any) {
        console.error('Unfollow Error:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
