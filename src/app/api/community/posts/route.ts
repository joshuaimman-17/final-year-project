import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { supabaseStorage } from '@/lib/supabase';
import { verifyAuth } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        const userId = (decodedToken?.phone_number || decodedToken?.uid || null) as string | null;

        const db = admin.firestore();
        const postsSnap = await db.collection('community_posts').orderBy('createdAt', 'desc').get();

        const formattedPosts = postsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                authorId: data.authorId,
                authorName: data.authorName,
                authorAvatar: data.authorAvatar,
                content: data.content,
                imageUrl: data.imageUrl,
                storagePath: data.storagePath,
                likeCount: data.likeCount || 0,
                commentCount: data.commentCount || 0,
                liked: false, // Liked logic will need a separate check if required
                createdAt: data.createdAt?.toDate() || new Date()
            };
        });

        return NextResponse.json(formattedPosts);
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

        const db = admin.firestore();
        const postData = {
            authorId,
            authorName,
            authorAvatar,
            content,
            imageUrl,
            storagePath,
            likeCount: 0,
            commentCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('community_posts').add(postData);
        const newPost = { id: docRef.id, ...postData, createdAt: new Date() };

        return NextResponse.json(newPost, { status: 201 });

    } catch (error: any) {
        console.error('Create Community Post Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
