import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/authHelper';

export async function GET() {
    try {
        const db = admin.firestore();
        const snap = await db.collection('posts').orderBy('createdAt', 'desc').get();
        const posts = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data() as any).createdAt?.toDate() || new Date()
        }));
        return NextResponse.json(posts);
    } catch (err: any) {
        console.error('Fetch Posts Error (Firestore):', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);

    try {
        const body = await req.json();
        const { content, author_name, author_role, image_url, tags } = body;

        const db = admin.firestore();
        const postData = {
            authorName: author_name || decodedToken?.name || 'Anonymous',
            authorRole: author_role || 'FARMER',
            content: content || '',
            imageUrl: image_url || '',
            tags: tags || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('posts').add(postData);
        return NextResponse.json({ id: docRef.id, ...postData }, { status: 201 });
    } catch (err: any) {
        console.error('Create Post Error (Firestore):', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
