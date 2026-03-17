const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  try {
    console.log("--- FINAL EXHAUSTIVE SEARCH ---");
    
    const search = await sql`
      SELECT * FROM users 
      WHERE email ILIKE '%alphagroup%' 
         OR email ILIKE '%it2226044%' 
         OR full_name ILIKE '%Tony%' 
         OR full_name ILIKE '%Stark%'
         OR username ILIKE '%stark%'
    `;
    
    console.log('SEARCH_RESULTS:', JSON.stringify(search, null, 2));

    process.exit(0);
  } catch (e) {
    console.error("SEARCH FAILED:", e);
    process.exit(1);
  }
}

run();
