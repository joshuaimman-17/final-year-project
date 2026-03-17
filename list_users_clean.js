const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function check() {
    try {
        const users = await sql`SELECT id, email, username, full_name, role FROM users`;
        console.log("--- START USERS ---");
        users.forEach(u => {
            console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.full_name} | Role: ${u.role}`);
        });
        console.log("--- END USERS ---");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
