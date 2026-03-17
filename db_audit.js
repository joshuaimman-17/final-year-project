const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sql = postgres(process.env.NEON_DATABASE_URL);

async function check() {
    try {
        console.log("--- TABLE CONSTRAINTS ---");
        const constraints = await sql`
            SELECT conname, pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            WHERE conrelid = 'users'::regclass
        `;
        console.log(JSON.stringify(constraints, null, 2));

        console.log("\n--- COLUMN DEFAULTS ---");
        const columns = await sql`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `;
        console.log(JSON.stringify(columns, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
