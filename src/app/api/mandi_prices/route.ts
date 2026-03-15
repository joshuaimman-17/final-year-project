import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = admin.firestore();
        const snap = await db.collection('mandi_prices').orderBy('last_updated', 'desc').get();
        
        if (snap.empty) {
            // Seed with some initial data if empty for demo purposes
            const initialData = [
                { crop: 'Rice', market: 'Bangalore', min_price: 2100, max_price: 2400, avg_price: 2250, last_updated: new Date().toISOString() },
                { crop: 'Tomato', market: 'Kolar', min_price: 900, max_price: 1200, avg_price: 1050, last_updated: new Date().toISOString() },
                { crop: 'Onion', market: 'Nasik', min_price: 1500, max_price: 1800, avg_price: 1650, last_updated: new Date(Date.now() - 3600000).toISOString() },
                { crop: 'Potato', market: 'Agra', min_price: 1100, max_price: 1300, avg_price: 1200, last_updated: new Date(Date.now() - 7200000).toISOString() },
                { crop: 'Wheat', market: 'Khanna', min_price: 2300, max_price: 2600, avg_price: 2450, last_updated: new Date().toISOString() },
            ];

            const batch = db.batch();
            initialData.forEach(item => {
                const ref = db.collection('mandi_prices').doc();
                batch.set(ref, item);
            });
            await batch.commit();
            return NextResponse.json(initialData);
        }

        const prices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(prices);
    } catch (err: any) {
        console.error('Fetch Mandi Prices Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
