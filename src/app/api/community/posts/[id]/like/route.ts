import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/authHelper';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const postId = params.id;
    const userId = decodedToken.uid;

    try {
        // Toggle Like logic in a transaction
        const result = await sql.begin(async (sql) => {
            // Check if like exists
            const existingLikes = await sql`
                SELECT * FROM post_likes 
                WHERE post_id = ${postId} AND user_id = ${userId}
            `;

            if (existingLikes.length > 0) {
                // Unlike: Remove entry and decrement count
                await sql`
                    DELETE FROM post_likes 
                    WHERE post_id = ${postId} AND user_id = ${userId}
                `;

                const [updatedPost] = await sql`
                    UPDATE community_posts 
                    SET like_count = GREATEST(0, like_count - 1) 
                    WHERE id = ${postId}
                    RETURNING like_count
                `;

                return { liked: false, likeCount: updatedPost.like_count };
            } else {
                // Like: Add entry and increment count
                await sql`
                    INSERT INTO post_likes (post_id, user_id) 
                    VALUES (${postId}, ${userId})
                `;

                const [updatedPost] = await sql`
                    UPDATE community_posts 
                    SET like_count = like_count + 1 
                    WHERE id = ${postId}
                    RETURNING like_count
                `;

                return { liked: true, likeCount: updatedPost.like_count };
            }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Like Toggle Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
