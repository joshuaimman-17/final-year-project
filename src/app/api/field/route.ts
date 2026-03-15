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

        const db = admin.firestore();
        const fieldSnap = await db.collection('user_fields').where('userId', '==', userId).limit(1).get();

        if (fieldSnap.empty) {
            return NextResponse.json({ field: null });
        }

        const data = fieldSnap.docs[0].data();
        return NextResponse.json({
            field: {
                id: fieldSnap.docs[0].id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date()
            }
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

        const body = await req.json();
        const { latitude, longitude, terrainType, soilType, soilPh, soilMoisture, elevation } = body;

        if (latitude === undefined || longitude === undefined) {
            return NextResponse.json({ message: 'Latitude and Longitude are required' }, { status: 400 });
        }

        const db = admin.firestore();
        
        // Find if they already have a field to update, or create a new one
        const existingSnap = await db.collection('user_fields').where('userId', '==', userId).limit(1).get();
        
        const fieldData = {
            userId,
            latitude,
            longitude,
            terrainType: terrainType || 'Unknown',
            soilType: soilType || 'Unknown',
            soilPh: soilPh || 0,
            soilMoisture: soilMoisture || 0,
            elevation: elevation || 0,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        let docId = '';
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

        return NextResponse.json({ message: 'Field saved successfully', id: docId, field: fieldData }, { status: 200 });

    } catch (error: any) {
        console.error('Save Field Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
