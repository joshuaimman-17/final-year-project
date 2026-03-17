const { Client } = require('pg');

async function fixDb() {
    console.log("Connecting to DB...");
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_XW0xSup7eRVs@ep-red-waterfall-a1561xpg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    });
    
    try {
        await client.connect();

        console.log("Removing duplicate pending expert requests...");
        await client.query(`
            DELETE FROM expert_requests 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM expert_requests 
                WHERE status = 'pending' 
                GROUP BY user_id
            ) AND status = 'pending'
        `);

        console.log("Adding unique constraint on user_id for pending requests...");
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS unique_active_expert_request 
            ON expert_requests (user_id) 
            WHERE status IN ('pending', 'approved')
        `);

        console.log("Creating followers table if not exists...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS followers (
                id SERIAL PRIMARY KEY,
                follower_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                following_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(follower_id, following_id)
            )
        `);

        console.log("DB fixes applied successfully!");
    } catch (err) {
        console.error("Error applying DB fixes:", err);
    } finally {
        await client.end();
    }
}

fixDb();
