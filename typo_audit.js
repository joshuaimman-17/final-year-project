const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  const variations = [
    'dharandharan2005edu@gmail.com',
    'dharanidharan2005edu@gmail.com',
    'projectpalnt3@gmail.com',
    'projectplant3@gmail.com',
    'it2226044@alpgagroup.edu',
    'it2226044@alphagroup.edu'
  ];
  
  console.log("--- AUDITING EMAIL VARIATIONS ---");
  for (const email of variations) {
    const user = await sql`SELECT id, email, role, expert_status, full_name FROM users WHERE email = ${email}`;
    if (user.length > 0) {
      console.log(`FOUND: [${email}] | ID: ${user[0].id} | Role: ${user[0].role} | Status: ${user[0].expert_status}`);
    } else {
      console.log(`NOT FOUND: [${email}]`);
    }
  }
  
  const total = await sql`SELECT COUNT(*) FROM users`;
  console.log(`\nTOTAL USERS IN DB: ${total[0].count}`);
  
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
