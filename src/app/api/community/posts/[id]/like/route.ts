import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
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
    const userId = decodedToken.phone_number || decodedToken.uid;

    try {
        const db = admin.firestore();
        const likeId = `${postId}_${userId}`;
        const likeRef = db.collection('post_likes').doc(likeId);
        const postRef = db.collection('community_posts').doc(postId);

        const result = await db.runTransaction(async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            const postDoc = await transaction.get(postRef);

            if (!postDoc.exists) {
                throw new Error("Post does not exist");
            }

            if (likeDoc.exists) {
                // Unlike
                transaction.delete(likeRef);
                const newCount = Math.max(0, (postDoc.data()?.likeCount || 0) - 1);
                transaction.update(postRef, { likeCount: newCount });
                return { liked: false, likeCount: newCount };
            } else {
                // Like
                transaction.set(likeRef, {
                    postId,
                    userId,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                const newCount = (postDoc.data()?.likeCount || 0) + 1;
                transaction.update(postRef, { likeCount: newCount });
                return { liked: true, likeCount: newCount };
            }
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Like Toggle Error (Firestore):', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
