const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);
async function run() {
  console.log("--- SEARCHING FOR it2226044@alphagroup.edu ---");
  const res = await sql`SELECT * FROM users WHERE email = 'it2226044@alphagroup.edu' OR full_name ILIKE '%Tony%' OR id LIKE '%it2226044%'`;
  console.log('SEARCH_RESULT:', JSON.stringify(res, null, 2));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
