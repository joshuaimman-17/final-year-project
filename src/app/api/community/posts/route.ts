import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { supabaseStorage } from '@/lib/supabase';
import { appendPostToSheet } from '@/lib/googleSheets';

export async function GET() {
    try {
        const db = admin.firestore();
        const postsRef = db.collection('community_posts');
        const querySnapshot = await postsRef.orderBy('createdAt', 'desc').get();

        const posts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString()
        }));

        return NextResponse.json(posts);
    } catch (error: any) {
        console.error('Fetch Community Posts Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const content = formData.get('content') as string;
        const authorId = formData.get('authorId') as string;
        const authorName = formData.get('authorName') as string;
        const authorAvatar = formData.get('authorAvatar') as string;
        const image = formData.get('image') as File | null;

        if (!content || !authorId) {
            return NextResponse.json({ message: 'Content and authorId are required' }, { status: 400 });
        }

        let imageUrl = '';
        let storagePath = '';

        if (image) {
            const fileName = `posts/${authorId}/${Date.now()}_${image.name}`;
            const uploadData = await supabaseStorage.upload(image, fileName);
            imageUrl = uploadData.url;
            storagePath = uploadData.path;
        }

        const postData = {
            authorId,
            authorName,
            authorAvatar,
            content,
            imageUrl,
            storagePath,
            likeCount: 0,
            commentCount: 0,
            createdAt: admin.firestore.Timestamp.now(),
        };

        // 1. Save to Firestore
        const db = admin.firestore();
        const docRef = await db.collection('community_posts').add(postData);

        // 2. Mirror to Google Sheets (Async)
        appendPostToSheet(docRef.id, authorName, content, imageUrl);

        return NextResponse.json({
            id: docRef.id,
            ...postData,
            createdAt: postData.createdAt.toDate().toISOString()
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create Community Post Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
