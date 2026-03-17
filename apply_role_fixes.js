const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.NEON_DATABASE_URL);

async function run() {
  const updates = [
    { email: 'dr.plant2026@gmail.com', role: 'EXPERT' },
    { email: 'joshuaimman8@gmail.com', role: 'FARMER' }
  ];

  console.log("--- APPLYING ROLE UPDATES ---");
  for (const update of updates) {
    const res = await sql`
      UPDATE users 
      SET role = ${update.role} 
      WHERE email = ${update.email} 
      RETURNING id, email, role
    `;
    if (res.length > 0) {
      console.log(`UPDATED: ${update.email} -> ${update.role}`);
    } else {
      console.log(`FAILED TO UPDATE: ${update.email} (Not found)`);
    }
  }

  // Also ensure projectplant3 has expert_status = 'approved' if they are an expert
  console.log("\n--- ENSURING EXPERT STATUS FOR EXPERTS ---");
  const experts = await sql`SELECT id, email, role, expert_status FROM users WHERE role = 'EXPERT'`;
  for (const exp of experts) {
    if (exp.expert_status !== 'approved') {
       await sql`UPDATE users SET expert_status = 'approved' WHERE id = ${exp.id}`;
       console.log(`SET approved status for expert: ${exp.email}`);
    }
  }

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
