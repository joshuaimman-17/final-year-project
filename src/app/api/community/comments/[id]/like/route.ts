import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
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

        const userId = decodedToken.phone_number || decodedToken.uid;
        const body = await req.json();
        const action = body.action || (body.liked ? 'unlike' : 'like'); // Handle various client formats

        const db = admin.firestore();
        const likeId = `${commentId}_${userId}`;
        const likeRef = db.collection('comment_likes').doc(likeId);
        const commentRef = db.collection('community_comments').doc(commentId);

        const result = await db.runTransaction(async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            const commentDoc = await transaction.get(commentRef);

            if (!commentDoc.exists) {
                throw new Error("Comment does not exist");
            }

            if (likeDoc.exists || action === 'unlike') {
                if (!likeDoc.exists && action === 'unlike') return { success: true, liked: false };

                // Unlike
                transaction.delete(likeRef);
                const newCount = Math.max(0, (commentDoc.data()?.likeCount || 0) - 1);
                transaction.update(commentRef, { likeCount: newCount });
                return { success: true, liked: false, likeCount: newCount };
            } else {
                // Like
                transaction.set(likeRef, {
                    commentId,
                    userId,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                const newCount = (commentDoc.data()?.likeCount || 0) + 1;
                transaction.update(commentRef, { likeCount: newCount });
                return { success: true, liked: true, likeCount: newCount };
            }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Comment Like Error (Firestore):', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
