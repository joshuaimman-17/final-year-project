const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_XW0xSup7eRVs@ep-red-waterfall-a1561xpg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function migrate() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('✅ Connected to Neon DB');

  const migration = `
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS about TEXT,
      ADD COLUMN IF NOT EXISTS skills TEXT,
      ADD COLUMN IF NOT EXISTS experience TEXT,
      ADD COLUMN IF NOT EXISTS projects TEXT,
      ADD COLUMN IF NOT EXISTS achievements TEXT,
      ADD COLUMN IF NOT EXISTS portfolio_link TEXT,
      ADD COLUMN IF NOT EXISTS expert_status TEXT DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS farm_name TEXT,
      ADD COLUMN IF NOT EXISTS location TEXT,
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
  `;

  await client.query(migration);
  console.log('✅ Migration complete! Added missing columns to users table.');

  // Verify
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  console.log('\n📋 Current users table columns:');
  res.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`));

  await client.end();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
