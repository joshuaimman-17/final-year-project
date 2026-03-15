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
        
        const userId = decodedToken.uid || decodedToken.phone_number;
        const { id } = await params;

        const db = admin.firestore();
        const docRef = db.collection('market_listings').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ message: 'Listing not found' }, { status: 404 });
        }

        if (doc.data()?.user_id !== userId) {
            return NextResponse.json({ message: 'Permission denied' }, { status: 403 });
        }

        await docRef.delete();

        return NextResponse.json({ message: 'Listing deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Delete Market Listing Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
