const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  const users = await sql`SELECT id, email, username, full_name, role, expert_status, created_at FROM users ORDER BY created_at DESC`;
  console.log("--- FULL DB DUMP ---");
  users.forEach(u => {
    console.log(`[${u.id}] ${u.email || 'NO_EMAIL'} | ${u.role} | ${u.username} | ${u.full_name}`);
  });
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
