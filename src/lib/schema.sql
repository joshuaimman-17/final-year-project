-- 1. Users Table (Already used by auth sync)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    username TEXT,
    full_name TEXT,
    farm_name TEXT,
    location TEXT,
    avatar_url TEXT
);

-- 2. Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 3. Post Likes Table (Many-to-Many with Unique Constraint)
CREATE TABLE IF NOT EXISTS post_likes (
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON post_likes(user_id);
