/**
 * One-off script: set admin account password via Firebase Admin SDK.
 * Run: node scripts/set-admin-password.js
 */
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const ADMIN_EMAIL = 'ksdharanidharan2005@gmail.com';
const NEW_PASSWORD = 'Admin@123';

async function setAdminPassword() {
    try {
        const user = await admin.auth().getUserByEmail(ADMIN_EMAIL);
        await admin.auth().updateUser(user.uid, { password: NEW_PASSWORD });
        console.log(`✅ Password updated successfully for ${ADMIN_EMAIL}`);
        console.log(`   New password: ${NEW_PASSWORD}`);
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        process.exit(0);
    }
}

setAdminPassword();
