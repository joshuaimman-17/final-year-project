import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: commentId } = await params;
        const decodedToken = await verifyAuth(req);

        if (!decodedToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = decodedToken.uid;
        const { action } = await req.json(); // 'like' or 'unlike'

        if (action === 'like') {
            await sql`
                INSERT INTO comment_likes (comment_id, user_id)
                VALUES (${commentId}, ${userId})
                ON CONFLICT (comment_id, user_id) DO NOTHING
            `;
        } else {
            await sql`
                DELETE FROM comment_likes
                WHERE comment_id = ${commentId} AND user_id = ${userId}
            `;
        }

        if (action === 'like') {
            try {
                const admin = require('@/lib/firebaseAdmin').default;
                const doc = await admin.firestore().collection('community_comments').doc(commentId).get();
                if (doc.exists) {
                    const comment = doc.data();
                    if (comment.authorId !== userId) {
                        const { sendPushNotification } = require('@/lib/notifications');
                        sendPushNotification(
                            comment.authorId,
                            "Comment Liked! ❤️",
                            `${decodedToken.name || "Someone"} liked your comment: "${comment.text.substring(0, 30)}..."`
                        );
                    }
                }
            } catch (notifyError) {
                console.error('Failed to trigger comment like notification:', notifyError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Comment Like Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
