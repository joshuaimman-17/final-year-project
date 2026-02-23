import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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
        // Split by semicolon and filter out empty strings to execute statements one by one if needed,
        // or just execute the whole thing if the driver supports it.
        // postgres.js supports multiple statements in one call.
        await sql.unsafe(schema);

        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sql.end();
    }
}

init();
