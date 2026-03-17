require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function forceAdmin() {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const email = 'ksdharanidharan2005@gmail.com';
    try {
        const result = await sql`UPDATE users SET role = 'ADMIN' WHERE email = ${email} RETURNING id, email, role`;
        console.log('FORCE_ADMIN_RESULT:', JSON.stringify(result));
        if (result.length === 0) {
            console.log('User not found in DB. They need to log in first to be created/synced.');
        }
    } catch (err) {
        console.error('FORCE_ADMIN_ERROR:', err);
    }
}
forceAdmin();
