-- Reset Tables for Breaking Change (Phone Number as Primary Key)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS user_public_keys CASCADE;
DROP TABLE IF EXISTS fcm_tokens CASCADE;
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table (ID is now Phone Number)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Phone Number (e.g., +911234567890)
    email TEXT,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'BUYER', -- 'BUYER', 'FARMER', 'EXPERT', 'ADMIN'
    farm_name TEXT,
    location TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, -- Supports both Postgres UUIDs and legacy Firestore IDs
    author_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_avatar TEXT,
    content TEXT,
    image_url TEXT,
    storage_path TEXT,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
    post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- 4. Community Comments Table (Postgres Unified)
CREATE TABLE IF NOT EXISTS community_comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, -- Firestore ID or gen_random_uuid()::text
    post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
    parent_id TEXT, -- For replies
    author_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    author_name TEXT,
    author_avatar TEXT,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Comment Likes Table
CREATE TABLE IF NOT EXISTS comment_likes (
    comment_id TEXT REFERENCES community_comments(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- 6. FCM Tokens Table
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_type TEXT, -- 'web', 'ios', 'android'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- 7. Chat Service (Neon Database)
CREATE TABLE IF NOT EXISTS user_public_keys (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL, -- Base64 encoded RSA public key
    encrypted_private_key TEXT, -- AES encrypted private key (Base64)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    encrypted_content TEXT NOT NULL, -- Base64 encoded encrypted message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON community_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_fcm_user ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_receiver ON chat_messages(receiver_id);
