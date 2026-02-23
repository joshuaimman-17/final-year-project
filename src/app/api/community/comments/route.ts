import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const postId = searchParams.get('postId');
        let parentId = searchParams.get('parentId');

        // Handle string representation of null from client
        if (parentId === 'null' || parentId === '' || !parentId) {
            parentId = null;
        }

        if (!postId) {
            return NextResponse.json({ message: 'postId is required' }, { status: 400 });
        }

        const db = admin.firestore();
        console.log(`Fetching comments for post: ${postId}, parent: ${parentId}`);

        let query: admin.firestore.Query = db.collection('community_comments')
            .where('postId', '==', postId)
            .where('parentId', '==', parentId)
            .orderBy('createdAt', 'asc');

        const querySnapshot = await query.get();
        const firestoreComments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        })) as any[];

        if (firestoreComments.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Fetch like data from Postgres for these comments
        const decodedToken = await verifyAuth(req);
        const userId = decodedToken?.uid || null;
        const commentIds = firestoreComments.map(c => c.id);

        const likesData = await sql`
            SELECT comment_id,
                   COUNT(*) as like_count,
                   (CASE WHEN ${userId}::text IS NOT NULL THEN
                        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = cl.comment_id AND user_id = ${userId}::text)
                    ELSE false END) as liked
            FROM comment_likes cl
            WHERE comment_id = ANY(${commentIds})
            GROUP BY comment_id
        `;

        // 3. Merge data
        const comments = firestoreComments.map(comment => {
            const likeInfo = likesData.find(l => l.comment_id === comment.id);
            return {
                ...comment,
                likeCount: parseInt(likeInfo?.like_count || '0'),
                liked: likeInfo?.liked || false
            };
        });

        return NextResponse.json(comments);
    } catch (error: any) {
        console.error('Fetch Comments Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { postId, parentId, authorId, authorName, authorAvatar, text } = body;

        if (!postId || !authorId || !text) {
            return NextResponse.json({ message: 'postId, authorId, and text are required' }, { status: 400 });
        }

        const commentData = {
            postId,
            parentId: parentId || null,
            authorId,
            authorName,
            authorAvatar,
            text,
            createdAt: admin.firestore.Timestamp.now(),
        };

        const db = admin.firestore();

        // 1. Save comment in Firestore
        const docRef = await db.collection('community_comments').add(commentData);

        // 2. Increment comment count in Supabase Postgres
        try {
            await sql`
                UPDATE community_posts 
                SET comment_count = comment_count + 1 
                WHERE id = ${postId}
            `;
        } catch (sqlError) {
            console.error('Failed to sync comment count to Postgres:', sqlError);
            // We don't fail the whole request because the comment WAS saved in Firestore
        }

        // 3. Push Notifications
        try {
            const { sendPushNotification } = require('@/lib/notifications');
            if (parentId) {
                // It's a reply: notify the parent comment author
                const parentDoc = await db.collection('community_comments').doc(parentId).get();
                if (parentDoc.exists) {
                    const parentComment = parentDoc.data();
                    if (parentComment && parentComment.authorId !== authorId) {
                        sendPushNotification(
                            parentComment.authorId,
                            "New Reply! 💬",
                            `${authorName} replied to your comment: "${text.substring(0, 30)}..."`
                        );
                    }
                }
            } else {
                // It's a top-level comment: notify post author
                const [post] = await sql`SELECT author_id FROM community_posts WHERE id = ${postId}`;
                if (post && post.author_id !== authorId) {
                    sendPushNotification(
                        post.author_id,
                        "New Comment! 💬",
                        `${authorName} commented on your post: "${text.substring(0, 30)}..."`
                    );
                }
            }
        } catch (notifyError) {
            console.error('Failed to trigger comment/reply notification:', notifyError);
        }

        return NextResponse.json({
            id: docRef.id,
            ...commentData,
            createdAt: commentData.createdAt.toDate().toISOString()
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create Comment Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
