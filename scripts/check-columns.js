const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.NEON_DATABASE_URL);

async function main() {
    try {
        const cols = await sql('SELECT column_name FROM information_schema.columns WHERE table_name = \'users\'');
        console.log('Columns in users table:', cols.map(c => c.column_name));
        
        // Ensure expert_status exists
        const expertStatusExists = cols.some(c => c.column_name === 'expert_status');
        if (!expertStatusExists) {
            console.log('Adding expert_status column...');
            await sql('ALTER TABLE users ADD COLUMN expert_status TEXT DEFAULT \'none\'');
            console.log('✅ expert_status added');
        } else {
            console.log('✅ expert_status already exists');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
