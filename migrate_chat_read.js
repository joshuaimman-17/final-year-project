const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_XW0xSup7eRVs@ep-red-waterfall-a1561xpg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrate() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('✅ Connected to Neon DB');

  const migration = `
    ALTER TABLE chat_messages
      ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
  `;

  await client.query(migration);
  console.log('✅ Migration complete! Added is_read column to chat_messages table.');

  // Verify
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  console.log('\n📋 Current chat_messages table columns:');
  res.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`));

  await client.end();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
