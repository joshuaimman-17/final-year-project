const postgres = require('postgres');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  const columns = await sql`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, column_name;
  `;
  
  const schema = {};
  columns.forEach(c => {
    if (!schema[c.table_name]) schema[c.table_name] = [];
    schema[c.table_name].push(c.column_name);
  });

  fs.writeFileSync('schema_audit.json', JSON.stringify(schema, null, 2));
  console.log("Schema written to schema_audit.json");
  process.exit(0);
}
run();
