const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  const tables = ['chat_messages', 'expert_requests', 'user_public_keys'];
  console.log("--- CONSTRAINT DEFINITIONS ---");
  for (const table of tables) {
    const res = await sql`SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c WHERE conrelid = ${table}::regclass`;
    console.log(`\nTable: ${table}`);
    res.forEach(r => console.log(`- ${r.conname}: ${r.pg_get_constraintdef}`));
  }
  process.exit(0);
}
run();
