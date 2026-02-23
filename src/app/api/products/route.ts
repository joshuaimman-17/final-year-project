import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET() {
    try {
        const db = admin.firestore();
        const snap = await db.collection('products').orderBy('createdAt', 'desc').get();
        const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(products);
    } catch (err: any) {
        console.error('Fetch Products Error (Firestore):', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
