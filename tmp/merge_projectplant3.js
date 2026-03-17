const { Client } = require('pg');

async function mergeAccounts() {
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_XW0xSup7eRVs@ep-red-waterfall-a1561xpg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    });
    
    try {
        await client.connect();

        const email = 'projectplant3@gmail.com';
        console.log(`Checking accounts for ${email}...`);
        
        const res = await client.query('SELECT id, role, username FROM users WHERE email = $1', [email]);
        console.log("Found rows:", res.rows);

        const legacyUser = res.rows.find(r => r.id === 'projectplant3');
        const firebaseUser = res.rows.find(r => r.id !== 'projectplant3');

        if (legacyUser && firebaseUser) {
            console.log(`Found legacy account (${legacyUser.id}) and Firebase account (${firebaseUser.id}). Merging...`);

            // 1. Update any foreign keys that might exist to point to the firebase ID
            // We should check tables like expert_requests, followers, etc.
            
            console.log("Updating expert_requests...");
            await client.query('UPDATE expert_requests SET user_id = $1 WHERE user_id = $2', [firebaseUser.id, legacyUser.id]);

            console.log("Updating followers (following_id)...");
            await client.query('UPDATE followers SET following_id = $1 WHERE following_id = $2', [firebaseUser.id, legacyUser.id]);
            
            console.log("Updating followers (follower_id)...");
            await client.query('UPDATE followers SET follower_id = $1 WHERE follower_id = $2', [firebaseUser.id, legacyUser.id]);

            // 2. Delete the legacy user record
            console.log("Deleting legacy user record...");
            await client.query('DELETE FROM users WHERE id = $1', [legacyUser.id]);

            // 3. Promote the firebase user to EXPERT
            console.log("Promoting Firebase user to EXPERT...");
            await client.query("UPDATE users SET role = 'EXPERT', expert_status = 'approved' WHERE id = $1", [firebaseUser.id]);

            console.log("✅ Merge and Promotion complete!");
        } else if (legacyUser && !firebaseUser) {
            console.log("Only legacy account found. No merge needed, but user might log in with a UID later.");
        } else if (!legacyUser && firebaseUser) {
            console.log("Only Firebase account found. Promoting if not already Expert...");
            await client.query("UPDATE users SET role = 'EXPERT', expert_status = 'approved' WHERE id = $1", [firebaseUser.id]);
            console.log("✅ Promotion complete!");
        } else {
            console.log("No accounts found for this email.");
        }

    } catch (err) {
        console.error("Error merging accounts:", err);
    } finally {
        await client.end();
    }
}

mergeAccounts();
