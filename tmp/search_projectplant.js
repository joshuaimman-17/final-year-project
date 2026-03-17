const { Client } = require('pg');

async function search() {
    const client = new Client({
        connectionString: 'postgresql://neondb_owner:npg_XW0xSup7eRVs@ep-red-waterfall-a1561xpg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
    });
    
    try {
        await client.connect();
        const res = await client.query("SELECT id, username, email, role, expert_status FROM users WHERE username ILIKE '%projectplant%' OR email ILIKE '%projectplant%' OR id ILIKE '%projectplant%'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

search();
