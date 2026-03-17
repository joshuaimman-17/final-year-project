const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

if (!process.env.NEON_DATABASE_URL) {
    console.error('❌ NEON_DATABASE_URL is not defined in .env.local');
    process.exit(1);
}

const sql = neon(process.env.NEON_DATABASE_URL);

async function runQuery(label, query) {
    try {
        console.log(`⏳ ${label}...`);
        await sql(query);
        console.log(`✅ ${label} done.`);
    } catch (error) {
        console.error(`❌ ${label} failed:`, error.message);
        // Don't exit here, some might fail if already exists and IF NOT EXISTS isn't supported for all
    }
}

async function migrate() {
    console.log('🚀 Starting Database Migration...');

    await runQuery('Expert Requests Table', `
        CREATE TABLE IF NOT EXISTS expert_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            skills TEXT NOT NULL,
            experience TEXT NOT NULL,
            portfolio_link TEXT,
            message TEXT,
            status TEXT DEFAULT 'pending',
            admin_response TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);

    await runQuery('Issues Table', `
        CREATE TABLE IF NOT EXISTS issues (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            reporter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            category TEXT,
            admin_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    `);

    await runQuery('Followers Table', `
        CREATE TABLE IF NOT EXISTS followers (
            follower_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            following_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (follower_id, following_id)
        )
    `);

    await runQuery('Expert Likes Table', `
        CREATE TABLE IF NOT EXISTS expert_likes (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            expert_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (user_id, expert_id)
        )
    `);

    await runQuery('Conversations Table', `
        CREATE TABLE IF NOT EXISTS conversations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user1_id TEXT REFERENCES users(id),
            user2_id TEXT REFERENCES users(id),
            last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user1_id, user2_id)
        )
    `);

    await runQuery('Chat Messages Column: conversation_id', `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE`);
    await runQuery('Chat Messages Column: is_read', `ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);
    
    await runQuery('Users Column: about', `ALTER TABLE users ADD COLUMN IF NOT EXISTS about TEXT`);
    await runQuery('Users Column: last_login', `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE`);

    console.log('✨ Migration process finished.');
}

migrate().catch(err => {
    console.error('💥 Fatal Migration Error:', err);
    process.exit(1);
});

