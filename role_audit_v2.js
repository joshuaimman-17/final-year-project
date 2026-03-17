const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  const emails = [
    'projectplant3@gmail.com',
    'dharanidharan2005edu@gmail.com',
    'dr.plant2026@gmail.com',
    'joshuaimman8@gmail.com',
    'it2226044@alphagroup.edu'
  ];
  
  console.log("--- AUDITING SPECIFIC USERS ---");
  for (const email of emails) {
    const user = await sql`SELECT id, email, username, full_name, role FROM users WHERE email = ${email}`;
    if (user.length > 0) {
      console.log(`FOUND: ${email} | ID: ${user[0].id} | Role: ${user[0].role} | Name: ${user[0].full_name}`);
    } else {
      console.log(`NOT FOUND: ${email}`);
    }
  }
  
  // Also search by name fragments if email didn't match exactly
  console.log("\n--- SEARCHING BY NAME FRAGMENTS ---");
  const fragments = ['projectplant', 'dharanidharan', 'joshua', 'it2226044'];
  for (const frag of fragments) {
    const results = await sql`SELECT id, email, username, full_name, role FROM users WHERE email ILIKE ${'%' + frag + '%'} OR full_name ILIKE ${'%' + frag + '%'}`;
    results.forEach(u => {
       console.log(`MATCH [${frag}]: ${u.email} | Role: ${u.role} | Name: ${u.full_name}`);
    });
  }
  
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
