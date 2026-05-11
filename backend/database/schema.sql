-- Dr.Plant Database Schema (Neon Postgres)

-- Enums
CREATE TYPE user_role AS ENUM ('FARMER', 'EXPERT', 'BUYER', 'ADMIN', 'SUPERADMIN');
CREATE TYPE diagnosis_status AS ENUM ('PENDING', 'AI_REVIEWED', 'EXPERT_REVIEWED', 'RESOLVED');
CREATE TYPE order_status AS ENUM ('PLACED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE TYPE listing_status AS ENUM ('ACTIVE', 'SOLD_OUT', 'DRAFT', 'DEACTIVATED');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'FARMER',
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Farms Table
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    polygon JSONB, -- Spatial boundaries
    area_acres DOUBLE PRECISION,
    crop_type TEXT,
    crop_duration_days INTEGER,
    planted_date DATE,
    soil_type TEXT,
    irrigation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Profiles
CREATE TABLE expert_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_number TEXT UNIQUE NOT NULL,
    approval_status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    specialization TEXT,
    avg_rating DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diagnoses Table
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    farmer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    ai_raw_result JSONB, -- Raw JSON from AI model
    disease_name TEXT,
    confidence DOUBLE PRECISION,
    severity TEXT,
    status diagnosis_status DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Reviews
CREATE TABLE expert_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnosis_id UUID REFERENCES diagnoses(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES expert_profiles(id) ON DELETE CASCADE,
    overridden BOOLEAN DEFAULT FALSE,
    disease_name TEXT,
    treatment_plan TEXT,
    rating DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Listings
CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    crop_name TEXT NOT NULL,
    price_per_unit DOUBLE PRECISION NOT NULL,
    quantity_available DOUBLE PRECISION NOT NULL,
    status listing_status DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing Images
CREATE TABLE listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);

-- Cart Items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    quantity DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    total_price DOUBLE PRECISION NOT NULL,
    delivery_address TEXT NOT NULL,
    status order_status DEFAULT 'PLACED',
    placed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE SET NULL,
    quantity DOUBLE PRECISION NOT NULL,
    price_at_purchase DOUBLE PRECISION NOT NULL
);

-- Follows
CREATE TABLE follows (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Indexes for performance
CREATE INDEX idx_farms_owner ON farms(owner_id);
CREATE INDEX idx_diagnoses_farmer ON diagnoses(farmer_id);
CREATE INDEX idx_diagnoses_farm ON diagnoses(farm_id);
CREATE INDEX idx_marketplace_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
