const admin = require('firebase-admin');

async function testSync() {
    try {
        const serviceAccount = require('../serviceAccountKey.json');
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        
        // Let's just create a custom token, trade it for an ID token, and call the API
        // actually easier: just call the API directly if we could, but we need an ID token.
        // Or simply hit the API with a fetch from the server code directly. Let's just create a mock ID token
        
        // Wait, easier to read Next.js dev server logs: NextJS terminal output
    } catch(e) {
        console.error(e);
    }
}
