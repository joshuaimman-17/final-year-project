const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  console.log("--- SEARCHING FOR 'it2226044' ACROSS ALL FIELDS ---");
  const res = await sql`
    SELECT * FROM users 
    WHERE id ILIKE '%it2226044%' 
       OR email ILIKE '%it2226044%' 
       OR username ILIKE '%it2226044%' 
       OR full_name ILIKE '%it2226044%'
  `;
  console.log('RESULTS:', JSON.stringify(res, null, 2));

  console.log("\n--- SEARCHING FOR 'stark' ACROSS ALL FIELDS ---");
  const res2 = await sql`SELECT * FROM users WHERE full_name ILIKE '%stark%' OR username ILIKE '%stark%'`;
  console.log('RESULTS STARK:', JSON.stringify(res2, null, 2));

  console.log("\n--- LISTING ALL USERS (COMPACT) ---");
  const users = await sql`SELECT email, role, username FROM users`;
  users.forEach(u => console.log(`${u.email} | ${u.role} | ${u.username}`));

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
