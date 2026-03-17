require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkAdmin() {
    const sql = neon(process.env.NEON_DATABASE_URL);
    const users = await sql('SELECT * FROM users WHERE email = \'ksdharanidharan2005@gmail.com\'');
    console.log('Admin User in DB:', JSON.stringify(users, null, 2));
    process.exit(0);
}

checkAdmin().catch(err => {
    console.error(err);
    process.exit(1);
});
