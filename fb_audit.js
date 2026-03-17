const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(sa)
    });
  }
  
  const emails = ['it2226044@alphagroup.edu', 'it2226044@alpgagroup.edu'];
  
  for (const email of emails) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      console.log(`Firebase User Found: ${email} | UID: ${user.uid}`);
    } catch (e) {
      console.log(`Firebase User NOT Found: ${email}`);
    }
  }
  process.exit(0);
}
run();
