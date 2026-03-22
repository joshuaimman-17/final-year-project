import { NextRequest, NextResponse } from 'next/server';
import { supabaseStorage } from '@/lib/supabase';
import { verifyAuth } from '@/lib/authHelper';

export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = decodedToken.phone_number || decodedToken.uid;
    
    // Check role from database
    const { default: neonSql } = await import('@/lib/neon');
    const userRole = await neonSql`SELECT role FROM users WHERE id = ${userId}`;
    if (!userRole[0] || userRole[0].role?.toUpperCase() === 'BUYER') {
        return NextResponse.json({ message: 'Forbidden: Buyers cannot perform diagnosis' }, { status: 403 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const fileName = `diagnosis/${decodedToken.uid}/${Date.now()}_${file.name}`;

        // Upload to Supabase Storage
        const uploadData = await supabaseStorage.upload(file, fileName);

        // Simulated AI Diagnoses (Ported Business Logic)
        const diagnoses = [
            {
                disease: "Early Blight",
                confidence: 0.94,
                severity: "HIGH",
                recommendations: ["Apply Fungicide X", "Prune lower leaves"]
            },
            {
                disease: "Late Blight",
                confidence: 0.88,
                severity: "CRITICAL",
                recommendations: ["Isolate affected plants", "Copper-based spray"]
            },
            {
                disease: "Leaf Spot",
                confidence: 0.91,
                severity: "LOW",
                recommendations: ["Improve air circulation", "Avoid overhead watering"]
            }
        ];

        const result = diagnoses[Math.floor(Math.random() * diagnoses.length)];

        return NextResponse.json({
            id: uploadData.id,
            result,
            imageUrl: uploadData.url,
            timestamp: new Date()
        });

    } catch (error: any) {
        console.error('Diagnosis Upload Error:', error);
        return NextResponse.json({ message: 'Failed to upload diagnosis image', error: error.message }, { status: 500 });
    }
}
