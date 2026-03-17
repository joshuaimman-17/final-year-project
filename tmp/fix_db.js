const { neon } = require('@neondatabase/serverless');

async function fixDb() {
    console.log("Connecting to DB...");
    const neonSql = neon('postgresql://neondb_owner:npg_XW0xSup7eRVs@ep-red-waterfall-a1561xpg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
    
    try {
        console.log("Removing duplicate pending expert requests...");
        await neonSql`
            DELETE FROM expert_requests 
            WHERE id NOT IN (
                SELECT MIN(id) 
                FROM expert_requests 
                WHERE status = 'pending' 
                GROUP BY user_id
            ) AND status = 'pending'
        `;

        console.log("Adding unique constraint on user_id for pending requests...");
        // Add unique index on user_id where status is 'pending' or 'approved'
        await neonSql`
            CREATE UNIQUE INDEX IF NOT EXISTS unique_active_expert_request 
            ON expert_requests (user_id) 
            WHERE status IN ('pending', 'approved')
        `;

        console.log("Checking followers table schema...");
        await neonSql`
            CREATE TABLE IF NOT EXISTS followers (
                id SERIAL PRIMARY KEY,
                follower_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                following_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(follower_id, following_id)
            )
        `;

        console.log("DB fixes applied successfully!");
    } catch (err) {
        console.error("Error applying DB fixes:", err);
    }
}

fixDb();
