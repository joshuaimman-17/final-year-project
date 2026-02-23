import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/authHelper';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: postId } = await params;
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    try {
        // Toggle Like logic in a transaction
        const result = await sql.begin(async (tx: any) => {
            // Check if like exists
            const existingLikes = await tx`
                SELECT * FROM post_likes 
                WHERE post_id = ${postId} AND user_id = ${userId}
            `;

            if (existingLikes.length > 0) {
                // Unlike: Remove entry and decrement count
                await tx`
                    DELETE FROM post_likes 
                    WHERE post_id = ${postId} AND user_id = ${userId}
                `;

                const [updatedPost] = await tx`
                    UPDATE community_posts 
                    SET like_count = GREATEST(0, like_count - 1) 
                    WHERE id = ${postId}
                    RETURNING like_count
                `;

                return { liked: false, likeCount: updatedPost.like_count };
            } else {
                // Like: Add entry and increment count
                await tx`
                    INSERT INTO post_likes (post_id, user_id) 
                    VALUES (${postId}, ${userId})
                `;

                const [updatedPost] = await tx`
                    UPDATE community_posts 
                    SET like_count = like_count + 1 
                    WHERE id = ${postId}
                    RETURNING like_count
                `;

                return { liked: true, likeCount: updatedPost.like_count };
            }
        });

        if (result.liked) {
            // Trigger push notification to post author (don't notify oneself)
            try {
                const [post] = await sql`SELECT author_id, author_name FROM community_posts WHERE id = ${postId}`;
                if (post && post.author_id !== userId) {
                    const { sendPushNotification } = require('@/lib/notifications');
                    sendPushNotification(
                        post.author_id,
                        "New Like! ❤️",
                        `${decodedToken.name || "Someone"} liked your post in the community.`
                    );
                }
            } catch (notifyError) {
                console.error('Failed to trigger post like notification:', notifyError);
            }
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Like Toggle Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
