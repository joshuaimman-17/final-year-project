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
  console.log("--- TABLE_COLUMNS ---");
  const groups = {};
  columns.forEach(c => {
    if (!groups[c.table_name]) groups[c.table_name] = [];
    groups[c.table_name].push(c.column_name);
  });
  
  for (const table in groups) {
    console.log(`${table}: ${groups[table].join(', ')}`);
  }
  process.exit(0);
}
run();
