const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_XW0xSup7eRVs@ep-red-waterfall-a1561xpg-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function clearAllTables() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('✅ Connected to Neon DB');

  // Get all user tables (exclude system tables)
  const res = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  const tables = res.rows.map(r => r.tablename);

  if (tables.length === 0) {
    console.log('No tables found.');
    await client.end();
    return;
  }

  console.log(`\n📦 Found ${tables.length} tables: ${tables.join(', ')}\n`);

  // Disable FK checks and truncate all at once
  const tableList = tables.map(t => `"${t}"`).join(', ');
  await client.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
  
  console.log(`✅ Truncated all ${tables.length} tables:`);
  tables.forEach(t => console.log(`   - ${t}`));
  console.log('\n✅ All tables cleared. Structure preserved.');

  await client.end();
}

clearAllTables().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
