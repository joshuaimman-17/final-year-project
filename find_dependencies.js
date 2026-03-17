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
  
  const suspectKeywords = ['user', 'id', 'author', 'sender', 'receiver', 'buyer', 'farmer', 'expert', 'member'];
  const suspectColumns = columns.filter(c => 
    suspectKeywords.some(k => c.column_name.toLowerCase().includes(k)) && 
    c.table_name !== 'users' // exclude the main users table
  );

  console.log("--- SUSPECT COLUMNS ---");
  suspectColumns.forEach(c => console.log(`${c.table_name}.${c.column_name}`));
  process.exit(0);
}
run();
