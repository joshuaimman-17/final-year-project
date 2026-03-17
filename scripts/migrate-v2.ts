import neonSql from './src/lib/neon';

async function migrate() {
    try {
        console.log('🚀 Starting Database Migration...');

        // 1. Expert Requests (Expanded)
        await neonSql`
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
            );
        `;
        console.log('✅ expert_requests table ready');

        // 2. Issues Tracking
        await neonSql`
            CREATE TABLE IF NOT EXISTS issues (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                reporter_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT DEFAULT 'open',
                category TEXT,
                admin_notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        console.log('✅ issues table ready');

        // 3. Social: Followers
        await neonSql`
            CREATE TABLE IF NOT EXISTS followers (
                follower_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                following_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                PRIMARY KEY (follower_id, following_id)
            );
        `;
        console.log('✅ followers table ready');

        // 4. Social: Expert Likes
        await neonSql`
            CREATE TABLE IF NOT EXISTS expert_likes (
                user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                expert_id TEXT REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                PRIMARY KEY (user_id, expert_id)
            );
        `;
        console.log('✅ expert_likes table ready');

        // 5. Messaging: Conversations
        await neonSql`
            CREATE TABLE IF NOT EXISTS conversations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user1_id TEXT REFERENCES users(id),
                user2_id TEXT REFERENCES users(id),
                last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(user1_id, user2_id)
            );
        `;
        console.log('✅ conversations table ready');

        // 6. Messaging: Update chat_messages
        await neonSql`
            ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
            ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
        `;
        console.log('✅ chat_messages columns updated');

        // 7. Users: Extra profiles
        await neonSql`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS about TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
        `;
        console.log('✅ users columns updated');

        console.log('✨ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
