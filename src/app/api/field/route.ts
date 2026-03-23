import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyAuth } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = decodedToken.phone_number || decodedToken.uid;

        // Check role from database
        const neonSql = (await import('@/lib/neon')).default;
        const userRole = await neonSql`SELECT role FROM users WHERE id = ${userId}`;
        if (!userRole[0] || userRole[0].role === 'BUYER') {
            return NextResponse.json({ message: 'Forbidden: Buyers cannot access field data' }, { status: 403 });
        }

        const db = admin.firestore();
        const fieldSnap = await db.collection('user_fields').where('userId', '==', userId).limit(1).get();

        if (fieldSnap.empty) {
            return NextResponse.json({ field: null });
        }

        const data = fieldSnap.docs[0].data();
        return NextResponse.json({
            field: data.config ? data.config[0] : null, // For backward compatibility if needed
            configs: data.config || [],
            id: fieldSnap.docs[0].id
        });
    } catch (error: any) {
        console.error('Fetch Field Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = decodedToken.phone_number || decodedToken.uid;

        // Check role from database
        const neonSql = (await import('@/lib/neon')).default;
        const userRole = await neonSql`SELECT role FROM users WHERE id = ${userId}`;
        if (!userRole[0] || userRole[0].role === 'BUYER') {
            return NextResponse.json({ message: 'Forbidden: Buyers cannot manage fields' }, { status: 403 });
        }

        const body = await req.json();
        const { configs, latitude, longitude } = body;

        if (!configs || !Array.isArray(configs)) {
            return NextResponse.json({ message: 'Configs array is required' }, { status: 400 });
        }

        const db = admin.firestore();
        
        // Use the primary configuration (first one) for top-level search/filtering if needed
        const primary = configs[0] || {};
        
        const fieldData = {
            userId,
            latitude: latitude || 0,
            longitude: longitude || 0,
            config: configs, // Store the full array
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        let docId = '';
        const existingSnap = await db.collection('user_fields').where('userId', '==', userId).limit(1).get();
        
        if (!existingSnap.empty) {
            docId = existingSnap.docs[0].id;
            await db.collection('user_fields').doc(docId).update(fieldData);
        } else {
            const docRef = db.collection('user_fields').doc();
            docId = docRef.id;
            await docRef.set({
                ...fieldData,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        return NextResponse.json({ message: 'Field saved successfully', id: docId, configs }, { status: 200 });

    } catch (error: any) {
        console.error('Save Field Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
