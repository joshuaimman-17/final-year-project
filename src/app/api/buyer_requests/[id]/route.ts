import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const { id } = await params;

        const db = admin.firestore();
        const docRef = db.collection('buyer_requests').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ message: 'Request not found' }, { status: 404 });
        }

        await docRef.delete();

        return NextResponse.json({ message: 'Request deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Delete Buyer Request Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
