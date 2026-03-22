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

        let query = db.collection('market_listings')
                      .orderBy('created_at', 'desc')
                      .limit(limit);

        if (lastId) {
            const lastDoc = await db.collection('market_listings').doc(lastId).get();
            if (lastDoc.exists) {
                query = query.startAfter(lastDoc);
            }
        }

        const snapshot = await query.get();

        const listings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate() || new Date()
        }));

        return NextResponse.json(listings, { status: 200 });

    } catch (error: any) {
        console.error('Fetch Market Listings Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const userId = decodedToken.uid || decodedToken.phone_number;
        
        // Check role from database
        const { default: neonSql } = await import('@/lib/neon');
        const userRole = await neonSql`SELECT role FROM users WHERE id = ${userId}`;
        if (!userRole[0] || userRole[0].role === 'BUYER') {
            return NextResponse.json({ message: 'Forbidden: Buyers cannot create market listings' }, { status: 403 });
        }

        const db = admin.firestore();
        const body = await req.json();

        // Validate required fields based on the plan
        const { crop_name, quantity, price, location, harvest_date, contact, image_url } = body;

        if (!crop_name || !quantity || !price || !location) {
            return NextResponse.json({ message: 'Missing required listing fields' }, { status: 400 });
        }

        const newListing = {
            user_id: userId,
            crop_name,
            quantity: Number(quantity), // Ensure numeric
            price: Number(price),       // Ensure numeric
            location,
            harvest_date: harvest_date || null,
            contact: contact || null,
            image_url: image_url || null,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('market_listings').add(newListing);

        return NextResponse.json({ message: 'Listing created successfully', id: docRef.id, ...newListing }, { status: 201 });

    } catch (error: any) {
        console.error('Create Market Listing Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
