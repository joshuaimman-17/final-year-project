const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not found');
        return;
    }

    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    try {
        console.log('Adding latitude and longitude columns to users table...');
        
        // Add columns if they don't exist
        await sql.unsafe(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
            ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
        `);

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sql.end();
    }
}

migrate();
