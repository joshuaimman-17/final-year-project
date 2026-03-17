const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  try {
    console.log("--- AUDITING ALL FOREIGN KEYS POINTING TO 'users' ---");
    const fks = await sql`
      SELECT
        tc.table_name, 
        kcu.column_name,
        tc.constraint_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name='users' 
        AND ccu.column_name='id';
    `;
    console.log("FOREIGN_KEYS:", JSON.stringify(fks, null, 2));

    console.log("\n--- CHECKING FOR DUPLICATE EMAILS ---");
    const dups = await sql`
      SELECT email, COUNT(*) 
      FROM users 
      WHERE email IS NOT NULL 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;
    console.log("DUPLICATE_EMAILS:", JSON.stringify(dups, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
