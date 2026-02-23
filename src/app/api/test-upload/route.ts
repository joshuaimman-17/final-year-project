import { NextResponse } from 'next/server';
import { supabaseStorage } from '@/lib/supabase';
import path from 'path';
import fs from 'fs';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'next.svg');
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Test file (next.svg) not found in public folder' }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = `test/supabase-check-${Date.now()}.svg`;

        const uploadData = await supabaseStorage.upload(fileBuffer, fileName);

        return NextResponse.json({
            message: 'Supabase Upload successful!',
            id: uploadData.id,
            url: uploadData.url,
            path: uploadData.path,
            fileName: fileName
        });

    } catch (error: any) {
        console.error('Supabase Test Upload Error:', error);
        return NextResponse.json({
            error: 'Supabase Upload failed',
            details: error.message,
            tip: 'Ensure the APP-STORAGE bucket exists and has public read access enabled.'
        }, { status: 500 });
    }
}
