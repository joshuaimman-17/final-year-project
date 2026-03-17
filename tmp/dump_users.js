const { Client } = require('pg');

async function dumpUsers() {
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_XW0xSup7eRVs@ep-red-waterfall-a1561xpg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    });
    
    try {
        await client.connect();
        const res = await client.query('SELECT id, username, email, role, expert_status FROM users');
        console.log("=== ALL USERS ===");
        console.table(res.rows);

        const reqs = await client.query('SELECT id, user_id, status FROM expert_requests');
        console.log("\n=== EXPERT REQUESTS ===");
        console.table(reqs.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

dumpUsers();
