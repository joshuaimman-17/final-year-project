const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function check() {
    try {
        const users = await sql`SELECT id, email, username, full_name, role FROM users`;
        console.log("--- ALL USERS ---");
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
