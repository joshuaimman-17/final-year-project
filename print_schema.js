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
  
  const groups = {};
  columns.forEach(c => {
    if (!groups[c.table_name]) groups[c.table_name] = [];
    groups[c.table_name].push(c.column_name);
  });

  console.log("--- SCHEMA START ---");
  for (const table in groups) {
    console.log(`${table}: ${groups[table].join(', ')}`);
  }
  console.log("--- SCHEMA END ---");
  process.exit(0);
}
run();
