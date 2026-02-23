import admin from './firebaseAdmin';
import sql from './db';

const messaging = admin.messaging();

export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
    try {
        // 1. Get user's FCM tokens from Postgres
        const tokens = await sql`
            SELECT token FROM fcm_tokens WHERE user_id = ${userId}
        `;

        if (tokens.length === 0) {
            console.log(`No FCM tokens found for user ${userId}`);
            return;
        }

        const registrationTokens = tokens.map(t => t.token);

        // 2. Send multicast message
        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            tokens: registrationTokens,
        };

        const response = await messaging.sendEachForMulticast(message);
        console.log(`Successfully sent ${response.successCount} notifications; ${response.failureCount} failed.`);

        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(registrationTokens[idx]);
                }
            });

            // Optional: Clean up invalid tokens
            // await sql`DELETE FROM fcm_tokens WHERE token = ANY(${failedTokens})`;
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}
