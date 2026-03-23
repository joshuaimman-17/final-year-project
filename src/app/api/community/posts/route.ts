import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { supabaseStorage } from '@/lib/supabase';
import { verifyAuth } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        // We ensure we can fetch posts even if user isn't fully authenticated, but 'liked' requires userId.
        const userId = decodedToken ? (decodedToken.phone_number || decodedToken.uid || null) as string | null : null;

        const db = admin.firestore();
        let docs = (await db.collection('community_posts').orderBy('createdAt', 'desc').get()).docs;

        const filter = req.nextUrl.searchParams.get('filter');
        if (filter === 'following' && userId) {
            const { default: neonSql } = await import('@/lib/neon');
            const followRows = await neonSql`SELECT followee_id FROM follows WHERE follower_id = ${userId}`;
            const followeeIds = followRows.map(r => r.followee_id);
            if (followeeIds.length === 0) {
                return NextResponse.json([]);
            }
            docs = docs.filter(doc => followeeIds.includes(doc.data().authorId));
        }

        // Perform lookups if we have a userId
        let userLikes = new Set<string>();
        if (userId) {
            // Find all like docs for this user matching these posts
            const docRefs = docs.map(doc => db.collection('post_likes').doc(`${doc.id}_${userId}`));

            if (docRefs.length > 0) {
                // Batch fetch (getAll supports up to 100 max, but typically we want to loop if > 100 limits, 
                // but let's just do Promise.all() for get() to handle any size cleanly)
                const likeDocs = await Promise.all(docRefs.map(ref => ref.get()));
                likeDocs.forEach((likeDoc, index) => {
                    if (likeDoc.exists) {
                        userLikes.add(docs[index].id);
                    }
                });
            }
        }

        const formattedPosts = docs.map(doc => {
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
                liked: userLikes.has(doc.id),
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
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });


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
