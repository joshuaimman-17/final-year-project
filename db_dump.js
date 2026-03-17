const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);
async function run() {
  console.log("--- FULL USER DUMP ---");
  const users = await sql`SELECT id, email, username, full_name, role, created_at FROM users ORDER BY created_at DESC`;
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
