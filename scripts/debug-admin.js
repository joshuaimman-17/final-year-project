require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function debug() {
    const sql = neon(process.env.NEON_DATABASE_URL);
    try {
        const users = await sql('SELECT id, email, role, username FROM users WHERE email = \'ksdharanidharan2005@gmail.com\'');
        console.log('QUERY_RESULT:', JSON.stringify(users));
    } catch (err) {
        console.error('QUERY_ERROR:', err);
    }
}
debug();
