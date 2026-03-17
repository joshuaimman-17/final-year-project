const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);
async function run() {
  const c = await sql`SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c WHERE conrelid = 'users'::regclass`;
  console.log("CONSTRAINTS:");
  c.forEach(x => console.log(`- ${x.conname}: ${x.pg_get_constraintdef}`));
  
  const cols = await sql`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users'`;
  console.log("\nCOLUMNS:");
  cols.forEach(x => console.log(`- ${x.column_name} (${x.data_type}, null=${x.is_nullable}, def=${x.column_default})`));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
