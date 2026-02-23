import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { uploadFileToDrive } from '@/lib/googleDrive';
import { appendPostToSheet } from '@/lib/googleSheets';

// Note: Using Firestore client SDK in Route Handlers is generally fine in Next.js 13+ App Router
// if properly initialized, but for high-load server side, firebase-admin is preferred.
// Here we use the client SDK 'db' imported from @/lib/firebase as it's already set up.

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
        let driveFileId = '';

        if (image) {
            const buffer = Buffer.from(await image.arrayBuffer());
            const driveResponse = await uploadFileToDrive(
                buffer,
                `${Date.now()}-${image.name}`,
                image.type
            );

            // googleDrive.ts permissions.create handles public view
            // We use webViewLink or webContentLink. webContentLink is better for direct <img> src
            imageUrl = driveResponse.webViewLink || ''; // Web view link
            driveFileId = driveResponse.id || '';

            // Convert webViewLink to a direct embeddable link if possible, 
            // or just use it as is if the browser handles it.
            // Often https://drive.google.com/thumbnail?id=FILE_ID is useful for quick previews
            if (driveFileId) {
                imageUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`;
            }
        }

        const postData = {
            authorId,
            authorName,
            authorAvatar,
            content,
            imageUrl,
            driveFileId,
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
