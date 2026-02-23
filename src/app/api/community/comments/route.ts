import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const postId = searchParams.get('postId');
        const parentId = searchParams.get('parentId') || null;

        if (!postId) {
            return NextResponse.json({ message: 'postId is required' }, { status: 400 });
        }

        const db = admin.firestore();
        let query: admin.firestore.Query = db.collection('community_comments')
            .where('postId', '==', postId)
            .where('parentId', '==', parentId)
            .orderBy('createdAt', 'asc');

        const querySnapshot = await query.get();
        const comments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));

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

        // 1. Save comment
        const docRef = await db.collection('community_comments').add(commentData);

        // 2. Increment comment count on the post
        const postRef = db.collection('community_posts').doc(postId);
        await postRef.update({
            commentCount: admin.firestore.FieldValue.increment(1)
        });

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
