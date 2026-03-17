require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkDuplicates() {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const email = 'ksdharanidharan2005@gmail.com';
    try {
        const users = await sql`SELECT id, email, role, username FROM users WHERE email ILIKE ${email}`;
        console.log('USERS_FOR_EMAIL:', JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('ERROR:', err);
    }
}
checkDuplicates();
