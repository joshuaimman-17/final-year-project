import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const db = admin.firestore();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20');
        const lastId = searchParams.get('lastId');

        let query = db.collection('buyer_requests')
                      .orderBy('created_at', 'desc')
                      .limit(limit);

        if (lastId) {
            const lastDoc = await db.collection('buyer_requests').doc(lastId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }

        const snapshot = await query.get();

        const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate() || new Date()
        }));

        return NextResponse.json(requests, { status: 200 });

    } catch (error: any) {
        console.error('Fetch Buyer Requests Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const db = admin.firestore();
        const body = await req.json();

        // Validate required fields
        const { buyer_name, crop_name, quantity, offered_price, location, contact } = body;

        if (!buyer_name || !crop_name || !quantity || !location || !contact) {
            return NextResponse.json({ message: 'Missing required buyer request fields' }, { status: 400 });
        }

        const newRequest = {
            buyer_name,
            crop_name,
            quantity: Number(quantity),
            offered_price: offered_price ? Number(offered_price) : null,
            location,
            contact,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('buyer_requests').add(newRequest);

        return NextResponse.json({ message: 'Buyer request created successfully', id: docRef.id, ...newRequest }, { status: 201 });

    } catch (error: any) {
        console.error('Create Buyer Request Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
