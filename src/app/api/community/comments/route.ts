import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const postId = searchParams.get('postId');
        let parentId = searchParams.get('parentId');
        if (parentId === 'null' || parentId === '') {
            parentId = null;
        }

        if (!postId) {
            return NextResponse.json({ message: 'postId is required' }, { status: 400 });
        }

        const db = admin.firestore();
        let query = db.collection('community_comments')
            .where('postId', '==', postId)
            .where('parentId', '==', parentId)
            .orderBy('createdAt', 'asc');

        const snap = await query.get();
        const comments = snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                postId: data.postId,
                parentId: data.parentId,
                authorId: data.authorId,
                authorName: data.authorName,
                authorAvatar: data.authorAvatar,
                text: data.text,
                likeCount: data.likeCount || 0,
                liked: false,
                createdAt: data.createdAt?.toDate() || new Date()
            };
        });

        return NextResponse.json(comments);
    } catch (error: any) {
        console.error('Fetch Comments Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Check role from database
    const { default: neonSql } = await import('@/lib/neon');
    const userRole = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.phone_number || decodedToken.uid}`;
    if (!userRole[0] || userRole[0].role === 'BUYER') {
        return NextResponse.json({ message: 'Forbidden: Buyers cannot comment on posts' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { postId, parentId, authorId, authorName, authorAvatar, text } = body;

        if (!postId || !authorId || !text) {
            return NextResponse.json({ message: 'postId, authorId, and text are required' }, { status: 400 });
        }

        const db = admin.firestore();
        const batch = db.batch();

        const commentRef = db.collection('community_comments').doc();
        const commentData = {
            postId,
            parentId: parentId || null,
            authorId,
            authorName,
            authorAvatar,
            text,
            likeCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        batch.set(commentRef, commentData);

        // Increment count on post
        const postRef = db.collection('community_posts').doc(postId);
        batch.update(postRef, {
            commentCount: admin.firestore.FieldValue.increment(1)
        });

        await batch.commit();

        return NextResponse.json({
            id: commentRef.id,
            ...commentData,
            createdAt: new Date()
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create Comment Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
