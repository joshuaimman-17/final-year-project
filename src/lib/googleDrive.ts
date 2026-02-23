import { google } from 'googleapis';
import path from 'path';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const getAuth = () => {
    const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (envServiceAccount) {
        try {
            const credentials = JSON.parse(envServiceAccount);
            return new google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES,
            });
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT for Google Drive');
        }
    }

    try {
        const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
        const fs = require('fs');
        if (fs.existsSync(keyPath)) {
            const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            return new google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES,
            });
        }
    } catch (e) {
        console.error('Failed to read serviceAccountKey.json for Google Drive');
    }

    // Last resort fallback
    return new google.auth.GoogleAuth({
        scopes: SCOPES,
    });
};

const getDriveService = () => google.drive({ version: 'v3', auth: getAuth() });

/**
 * Uploads a file buffer to Google Drive.
 */
export const uploadFileToDrive = async (
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId: string = '1oAJfI1nwTLNhkBR1Ba7UulUZJSUHjP1d'
) => {
    try {
        const fileMetadata = {
            name: fileName,
            parents: [folderId],
        };

        const media = {
            mimeType: mimeType,
            body: Readable.from(fileBuffer),
        };

        const response = await getDriveService().files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        await getDriveService().permissions.create({
            fileId: response.data.id!,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Google Drive Upload Error:', error);
        throw error;
    }
};
