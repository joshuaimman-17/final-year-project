const { Client } = require('pg');

async function fixDuplicateRequests() {
    console.log("Connecting to DB...");
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_XW0xSup7eRVs@ep-red-waterfall-a1561xpg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    });
    
    try {
        await client.connect();

        console.log("Checking for users with both approved and pending requests...");
        // If a user has an approved request, all other pending requests for that user should be deleted.
        await client.query(`
            DELETE FROM expert_requests 
            WHERE status = 'pending' 
            AND user_id IN (
                SELECT user_id FROM expert_requests WHERE status = 'approved'
            )
        `);

        console.log("Fixing projectplant3 and similar users...");
        // Ensure any user who has an 'approved' request actually has the 'EXPERT' role and 'approved' expert_status in the users table
        await client.query(`
            UPDATE users 
            SET role = 'EXPERT', expert_status = 'approved'
            WHERE id IN (
                SELECT user_id FROM expert_requests WHERE status = 'approved'
            ) AND role != 'EXPERT'
        `);

        // Ensure users with pending requests have expert_status = 'pending'
        await client.query(`
            UPDATE users 
            SET expert_status = 'pending'
            WHERE id IN (
                SELECT user_id FROM expert_requests WHERE status = 'pending'
            ) AND expert_status != 'pending'
        `);

        console.log("DB Cleanup and Role Fixes Applied!");
    } catch (err) {
        console.error("Error applying DB fixes:", err);
    } finally {
        await client.end();
    }
}

fixDuplicateRequests();
