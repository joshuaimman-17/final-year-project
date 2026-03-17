const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function check() {
  const emails = [
    'projectplant3@gmail.com',
    'dharanidharan2005edu@gmail.com',
    'dr.plant2026@gmail.com',
    'joshuaimman8@gmail.com',
    'it2226044@alphagroup.edu'
  ];
  
  console.log("--- FINAL ROLE VERIFICATION ---");
  for (const email of emails) {
    const user = await sql`SELECT id, email, username, full_name, role, expert_status FROM users WHERE email = ${email}`;
    if (user.length > 0) {
      console.log(`VERIFIED: ${email} | Role: ${user[0].role} | ExpertStatus: ${user[0].expert_status} | Name: ${user[0].full_name}`);
    } else {
      console.log(`NOT FOUND: ${email}`);
    }
  }
  process.exit(0);
}
check();
