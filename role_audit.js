const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function check() {
    const emails = [
        'projectplant3@gmail.com',
        'dharanidharan2005edu@gmail.com',
        'dr.plant2026@gmail.com',
        'joshuaimman8@gmail.com'
    ];
    
    try {
        console.log("--- CHECKING REQUESTED USERS ---");
        const users = await sql`
            SELECT id, email, username, full_name, role 
            FROM users 
            WHERE email IN (${emails})
        `;
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
