require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NEON_DATABASE_URL);

async function checkUser() {
    try {
        const email = 'ksdharanidharan2005@gmail.com';
        // Use tagged template literal style which is preferred by neon
        const users = await sql`SELECT id, email, role, username FROM users WHERE email = ${email}`;
        
        console.log('--- DATABASE USER REPORT ---');
        console.log(`Found ${users.length} record(s) for email: ${email}`);
        
        users.forEach((u, i) => {
            console.log(`User ${i + 1}:`, JSON.stringify(u, null, 2));
        });
        
        console.log('--- END REPORT ---');
    } catch (err) {
        console.error('Database Error:', err.stack || err.message);
    } finally {
        // Neon client usually doesn't need explicit close for serverless
        process.exit(0);
    }
}

checkUser();
