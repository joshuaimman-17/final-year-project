const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function init() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not found');
        return;
    }

    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    try {
        console.log('Reading schema.sql...');
        const schema = fs.readFileSync(path.join(process.cwd(), 'src/lib/schema.sql'), 'utf8');

        console.log('Executing schema...');
        await sql.unsafe(schema);

        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sql.end();
    }
}

init();
