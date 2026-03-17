const postgres = require('postgres');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  const users = await sql`SELECT id, email, username, full_name, role, expert_status, created_at FROM users ORDER BY created_at DESC`;
  let output = "--- FULL DB DUMP ---\n";
  users.forEach(u => {
    output += `[${u.id}] ${u.email || 'NO_EMAIL'} | ${u.role} | ${u.username} | ${u.full_name}\n`;
  });
  fs.writeFileSync('dump_utf8.txt', output, 'utf8');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
