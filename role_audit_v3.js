const postgres = require('postgres');
const fs = require('fs');
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
  
  const auditResults = {
    specificUsers: [],
    nameMatches: []
  };

  for (const email of emails) {
    const user = await sql`SELECT id, email, username, full_name, role FROM users WHERE email = ${email}`;
    if (user.length > 0) {
      auditResults.specificUsers.push(user[0]);
    }
  }
  
  const fragments = ['projectplant', 'dharanidharan', 'joshua', 'it2226044', 'stark'];
  for (const frag of fragments) {
    const results = await sql`SELECT id, email, username, full_name, role FROM users WHERE email ILIKE ${'%' + frag + '%'} OR full_name ILIKE ${'%' + frag + '%'}`;
    results.forEach(u => {
       if (!auditResults.specificUsers.find(su => su.id === u.id)) {
          auditResults.nameMatches.push(u);
       }
    });
  }
  
  fs.writeFileSync('role_audit_results.json', JSON.stringify(auditResults, null, 2));
  console.log("Audit complete. Results written to role_audit_results.json");
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
