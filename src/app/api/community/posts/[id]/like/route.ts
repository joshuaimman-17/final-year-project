import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { action } = await req.json(); // 'like' or 'unlike'

        if (!id) {
            return NextResponse.json({ message: 'Post ID is required' }, { status: 400 });
        }

        const db = admin.firestore();
        const postRef = db.collection('community_posts').doc(id);

        await postRef.update({
            likeCount: admin.firestore.FieldValue.increment(action === 'like' ? 1 : -1)
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Like Post Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
