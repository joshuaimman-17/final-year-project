const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  const columns = await sql`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, column_name;
  `;
  console.log("--- START TABLES ---");
  columns.forEach(c => console.log(`${c.table_name}.${c.column_name}`));
  console.log("--- END TABLES ---");
  process.exit(0);
}
run();
