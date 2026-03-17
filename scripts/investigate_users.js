const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.NEON_DATABASE_URL);

async function investigate() {
    try {
        console.log("--- MIGRATION & INVESTIGATION START ---");
        
        // 1. Correct User Roles
        console.log("\nCorrecting user roles...");
        const update1 = await sql`
            UPDATE users 
            SET role = 'EXPERT' 
            WHERE username ILIKE '%projectplant3%' OR email ILIKE '%projectplant3%'
            RETURNING id, email, username, role
        `;
        const update2 = await sql`
            UPDATE users 
            SET role = 'FARMER' 
            WHERE username ILIKE '%dharanidharan2005edu%' OR email ILIKE '%dharanidharan2005edu%'
            RETURNING id, email, username, role
        `;
        console.log("Updated projectplant3:", JSON.stringify(update1, null, 2));
        console.log("Updated dharanidharan2005edu:", JSON.stringify(update2, null, 2));

        // 2. Report on Tony Stark / Recent registrations
        console.log("\nSearching for Tony Stark or recent registrations...");
        const stark = await sql`SELECT id, email, username, role, full_name, created_at FROM users WHERE full_name ILIKE '%Tony%' OR full_name ILIKE '%Stark%'`;
        const recent = await sql`SELECT id, email, username, role, full_name, created_at FROM users ORDER BY created_at DESC LIMIT 10`;
        
        console.log("Tony Stark Result:", JSON.stringify(stark, null, 2));
        console.log("Last 10 Users:", JSON.stringify(recent, null, 2));

        // 3. Overall stats
        const counts = await sql`SELECT role, count(*) FROM users GROUP BY role`;
        console.log("\nFinal Role Counts in DB:", JSON.stringify(counts, null, 2));

        console.log("--- MIGRATION & INVESTIGATION END ---");
        process.exit(0);
    } catch (err) {
        console.error("Task failed:", err);
        process.exit(1);
    }
}

investigate();
