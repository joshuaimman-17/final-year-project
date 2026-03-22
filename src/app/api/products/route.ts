import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

// Ensure products table exists
async function ensureProductsTable() {
    await neonSql`
        CREATE TABLE IF NOT EXISTS products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            price NUMERIC(10, 2) NOT NULL,
            unit TEXT NOT NULL DEFAULT 'kg',
            category TEXT DEFAULT 'Vegetables',
            image_url TEXT,
            stock INTEGER DEFAULT 0,
            farmer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            farmer_name TEXT,
            farm_name TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
}

// GET /api/products — fetch all products (or farmer-only with ?farmerOnly=true)
export async function GET(req: NextRequest) {
    try {
        await ensureProductsTable();
        const { searchParams } = new URL(req.url);
        const farmerOnly = searchParams.get('farmerOnly') === 'true';

        if (farmerOnly) {
            const decoded = await verifyAuth(req);
            if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
            const products = await neonSql`
                SELECT * FROM products WHERE farmer_id = ${decoded.uid} ORDER BY created_at DESC
            `;
            return NextResponse.json(products);
        }

        const category = searchParams.get('category');
        const search = searchParams.get('search') || '';

        let products;
        if (category && category !== 'All') {
            products = await neonSql`
                SELECT * FROM products 
                WHERE is_active = TRUE AND category = ${category}
                AND (name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})
                ORDER BY created_at DESC
            `;
        } else {
            products = await neonSql`
                SELECT * FROM products 
                WHERE is_active = TRUE
                AND (name ILIKE ${'%' + search + '%'} OR description ILIKE ${'%' + search + '%'})
                ORDER BY created_at DESC
            `;
        }

        return NextResponse.json(products);
    } catch (err: any) {
        console.error('[Products GET] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

// POST /api/products — add a new product
export async function POST(req: NextRequest) {
    try {
        const decoded = await verifyAuth(req);
        if (!decoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Ensure products table exists before inserting
        await ensureProductsTable();

        const body = await req.json();
        const { name, description, price, unit, category, image_url, stock, farmer_name, farm_name } = body;

        if (!name || !price) {
            return NextResponse.json({ message: 'Product name and price are required.' }, { status: 400 });
        }

        const result = await neonSql`
            INSERT INTO products (name, description, price, unit, category, image_url, stock, farmer_id, farmer_name, farm_name)
            VALUES (
                ${name},
                ${description || ''},
                ${parseFloat(price)},
                ${unit || 'kg'},
                ${category || 'Vegetables'},
                ${image_url || ''},
                ${parseInt(stock) || 0},
                ${decoded.uid},
                ${farmer_name || decoded.name || ''},
                ${farm_name || ''}
            )
            RETURNING *
        `;

        return NextResponse.json(result[0], { status: 201 });
    } catch (err: any) {
        console.error('[Products POST] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
