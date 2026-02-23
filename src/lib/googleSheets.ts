import { google } from 'googleapis';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

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
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT for Google Sheets');
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
        console.error('Failed to read serviceAccountKey.json for Google Sheets');
    }

    return new google.auth.GoogleAuth({
        scopes: SCOPES,
    });
};

const getSheetsService = () => google.sheets({ version: 'v4', auth: getAuth() });

/**
 * Appends a new post record to a Google Sheet for moderation/logging.
 */
export const appendPostToSheet = async (
    postId: string,
    authorName: string,
    content: string,
    imageUrl: string
) => {
    const sheetId = process.env.GOOGLE_SHEET_ID || '1yHhC_K5m8Wz_PLACEHOLDER_SHEET_ID';

    try {
        const sheets = getSheetsService();
        const timestamp = new Date().toISOString();

        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Sheet1!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    [postId, authorName, content, imageUrl, timestamp]
                ],
            },
        });

        console.log(`Successfully mirrored post ${postId} to Google Sheets`);
    } catch (error) {
        console.error('Google Sheets Append Error:', error);
        // We don't throw here to avoid failing the post creation if Sheets fails
    }
};
