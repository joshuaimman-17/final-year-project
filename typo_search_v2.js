const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  const exactTypos = [
    'dharandharan2005edu@gmail.com',
    'projectpalnt3@gmail.com',
    'it2226044@alpgagroup.edu'
  ];
  
  console.log("--- SEARCHING FOR EXACT TYPOS FROM USER MESSAGE ---");
  for (const email of exactTypos) {
    const user = await sql`SELECT id, email, role, username, full_name FROM users WHERE email = ${email}`;
    if (user.length > 0) {
      console.log(`FOUND: [${email}] | ID: ${user[0].id} | Role: ${user[0].role} | Username: ${user[0].username}`);
    } else {
      console.log(`NOT FOUND: [${email}]`);
    }
  }

  console.log("\n--- SEARCHING BY PARTIAL EMAIL ---");
  const partials = ['alpgagroup', 'palnt', 'dharandharan', 'it2226044'];
  for (const part of partials) {
    const results = await sql`SELECT id, email, role, username, full_name FROM users WHERE email ILIKE ${'%' + part + '%'}`;
    results.forEach(u => console.log(`MATCH [${part}]: ${u.email} | Role: ${u.role}`));
  }

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
