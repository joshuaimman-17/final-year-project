import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const postId = searchParams.get('postId');
        let parentId = searchParams.get('parentId');

        // Handle string representation of null from client
        if (parentId === 'null' || !parentId) {
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
        console.log(`Found ${querySnapshot.size} comments`);
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
