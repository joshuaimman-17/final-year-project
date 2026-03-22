import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/authHelper';
import neonSql from '@/lib/neon';

// Helper to check if caller is Admin
async function checkAdmin(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return null;

    const userId = decodedToken.uid;
    const rows = await neonSql`SELECT role FROM users WHERE id = ${userId}`;
    
    if (rows[0]?.role === 'ADMIN' || decodedToken.email?.toLowerCase() === 'ksdharanidharan2005@gmail.com') {
        return decodedToken;
    }
    return null;
}

export async function GET(req: NextRequest) {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    try {
        const db = admin.firestore();
        const postsSnap = await db.collection('community_posts').orderBy('createdAt', 'desc').get();
        
        const posts = postsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        return NextResponse.json({ posts });
    } catch (error: any) {
        console.error('Admin Post Fetch Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    try {
        const { postId } = await req.json();
        if (!postId) return NextResponse.json({ message: 'Post ID required' }, { status: 400 });

        const db = admin.firestore();
        
        // Delete the post document
        await db.collection('community_posts').doc(postId).delete();
        
        // Optionally: Delete associated likes/comments (if needed for cleanup)
        // For now, simple deletion of the post doc is the requirement.

        return NextResponse.json({ message: 'Post deleted by administrator' });
    } catch (error: any) {
        console.error('Admin Post Delete Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
