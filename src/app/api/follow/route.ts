import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

async function ensureFollowsTable() {
    await neonSql`
        CREATE TABLE IF NOT EXISTS follows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            follower_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            followee_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(follower_id, followee_id)
        );
    `;
    await neonSql`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);`;
    await neonSql`CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);`;
}

// POST: Follow an expert
export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await ensureFollowsTable();
        const body = await req.json();
        const { followee_id } = body;

        if (!followee_id) {
            return NextResponse.json({ message: 'Missing followee_id' }, { status: 400 });
        }

        if (decodedToken.uid === followee_id) {
            return NextResponse.json({ message: 'Cannot follow yourself' }, { status: 400 });
        }

        // Validate Roles: Follower must be FARMER or EXPERT, Followee must be EXPERT
        const followerRow = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.uid}`;
        const followeeRow = await neonSql`SELECT role FROM users WHERE id = ${followee_id}`;

        if (!followerRow.length || !followeeRow.length) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const followerRole = followerRow[0].role;
        const followeeRole = followeeRow[0].role;

        if (followerRole !== 'FARMER' && followerRole !== 'EXPERT') {
            return NextResponse.json({ message: 'Only Farmers and Experts can follow' }, { status: 403 });
        }

        if (followeeRole !== 'EXPERT') {
            return NextResponse.json({ message: 'You can only follow Experts' }, { status: 403 });
        }

        // Insert
        await neonSql`
            INSERT INTO follows (follower_id, followee_id)
            VALUES (${decodedToken.uid}, ${followee_id})
            ON CONFLICT (follower_id, followee_id) DO NOTHING
        `;

        return NextResponse.json({ success: true, message: 'Followed successfully' }, { status: 201 });

    } catch (err: any) {
        console.error('[Follow POST] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

// DELETE: Unfollow
export async function DELETE(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await ensureFollowsTable();
        const body = await req.json();
        const { followee_id } = body;

        if (!followee_id) {
            return NextResponse.json({ message: 'Missing followee_id' }, { status: 400 });
        }

        await neonSql`
            DELETE FROM follows 
            WHERE follower_id = ${decodedToken.uid} AND followee_id = ${followee_id}
        `;

        return NextResponse.json({ success: true, message: 'Unfollowed successfully' }, { status: 200 });
    } catch (err: any) {
        console.error('[Follow DELETE] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

// GET: Check if following, or get followees/followers
export async function GET(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await ensureFollowsTable();
        const { searchParams } = new URL(req.url);
        
        const checkFolloweeId = searchParams.get('checkFolloweeId');
        if (checkFolloweeId) {
            // Check if current user follows this specific ID
            const rows = await neonSql`
                SELECT id FROM follows 
                WHERE follower_id = ${decodedToken.uid} AND followee_id = ${checkFolloweeId}
            `;
            return NextResponse.json({ isFollowing: rows.length > 0 });
        }

        const getFolloweesFor = searchParams.get('followeesOf');
        if (getFolloweesFor) {
            const rows = await neonSql`
                SELECT u.id, u.full_name, u.avatar_url, u.role
                FROM follows f
                JOIN users u ON f.followee_id = u.id
                WHERE f.follower_id = ${getFolloweesFor}
            `;
            return NextResponse.json({ followees: rows });
        }

        const getFollowersFor = searchParams.get('followersOf');
        if (getFollowersFor) {
            const rows = await neonSql`
                SELECT u.id, u.full_name, u.avatar_url, u.role
                FROM follows f
                JOIN users u ON f.follower_id = u.id
                WHERE f.followee_id = ${getFollowersFor}
            `;
            return NextResponse.json({ followers: rows });
        }

        return NextResponse.json({ message: 'Invalid query parameters' }, { status: 400 });
    } catch (err: any) {
        console.error('[Follow GET] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
