import { NextResponse } from 'next/server';
import { uploadFileToDrive } from '@/lib/googleDrive';
import path from 'path';
import fs from 'fs';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'next.svg');
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Test file (next.svg) not found in public folder' }, { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = `test-upload-v3-${Date.now()}.svg`;
        const mimeType = 'image/svg+xml';

        const driveData = await uploadFileToDrive(fileBuffer, fileName, mimeType);

        return NextResponse.json({
            message: 'Upload successful!',
            fileId: driveData.id,
            webViewLink: driveData.webViewLink,
            fileName: fileName
        });

    } catch (error: any) {
        console.error('Test Upload Error:', error);
        return NextResponse.json({
            error: 'Upload failed',
            details: error.message,
            tip: 'If you see "Service Accounts do not have storage quota", it means the folder belongs to a personal drive. Use a Shared Drive instead.'
        }, { status: 500 });
    }
}
