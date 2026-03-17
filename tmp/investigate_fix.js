const { Client } = require('pg');

async function investigateAndFix() {
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_XW0xSup7eRVs@ep-red-waterfall-a1561xpg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    });
    
    try {
        await client.connect();

        console.log("=== INVESTIGATING projectplant3 ===\n");

        // 1. Check user record
        const userRows = await client.query(`SELECT id, username, email, role, expert_status FROM users WHERE username = 'projectplant3'`);
        if (userRows.rows.length === 0) {
            console.log("❌ User 'projectplant3' NOT FOUND in users table!");
        } else {
            const u = userRows.rows[0];
            console.log("✅ User found:");
            console.log(`   id: ${u.id}`);
            console.log(`   username: ${u.username}`);
            console.log(`   email: ${u.email}`);
            console.log(`   role: ${u.role}`);
            console.log(`   expert_status: ${u.expert_status}`);
        }

        // 2. Check expert_requests for this user
        const reqRows = await client.query(`
            SELECT er.id, er.user_id, er.status, er.created_at 
            FROM expert_requests er 
            JOIN users u ON u.id = er.user_id 
            WHERE u.username = 'projectplant3' 
            ORDER BY er.created_at DESC
        `);
        console.log(`\n✅ Found ${reqRows.rows.length} expert request(s) for projectplant3:`);
        reqRows.rows.forEach(r => {
            console.log(`   id: ${r.id}, status: ${r.status}, created: ${r.created_at}`);
        });

        // 3. Apply fix: set role = EXPERT and expert_status = approved for projectplant3
        if (userRows.rows.length > 0) {
            const userId = userRows.rows[0].id;
            console.log("\n=== APPLYING FIX ===");

            // Fix the user role
            await client.query(`
                UPDATE users SET role = 'EXPERT', expert_status = 'approved' WHERE id = $1
            `, [userId]);
            console.log("✅ Updated users.role = EXPERT, expert_status = approved");

            // Fix the request to show approved (keep only the latest)
            await client.query(`
                UPDATE expert_requests SET status = 'approved' 
                WHERE user_id = $1 AND id = (
                    SELECT id FROM expert_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
                )
            `, [userId]);
            console.log("✅ Updated latest expert_request status = approved");

            // Remove all other duplicate requests for this user
            const deleted = await client.query(`
                DELETE FROM expert_requests 
                WHERE user_id = $1 AND id NOT IN (
                    SELECT id FROM expert_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
                )
            `, [userId]);
            console.log(`✅ Removed ${deleted.rowCount} duplicate request(s)`);

            // Verify final state
            const finalUser = await client.query(`SELECT role, expert_status FROM users WHERE id = $1`, [userId]);
            console.log("\n=== FINAL STATE ===");
            console.log(`   role: ${finalUser.rows[0].role}`);
            console.log(`   expert_status: ${finalUser.rows[0].expert_status}`);
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await client.end();
    }
}

investigateAndFix();
