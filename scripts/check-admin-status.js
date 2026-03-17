const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const ADMIN_EMAIL = 'ksdharanidharan2005@gmail.com';

async function checkAdminStatus() {
    try {
        const user = await admin.auth().getUserByEmail(ADMIN_EMAIL);
        console.log('--- ADMIN USER REPORT ---');
        console.log('UID:', user.uid);
        console.log('EMAIL:', user.email);
        console.log('DISABLED:', user.disabled);
        console.log('EMAIL_VERIFIED:', user.emailVerified);
        console.log('PROVIDERS:');
        user.providerData.forEach(p => {
            console.log(` - ID: ${p.providerId}, Email: ${p.email || 'N/A'}, UID: ${p.uid}`);
        });
        console.log('--- END REPORT ---');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit(0);
    }
}

checkAdminStatus();
