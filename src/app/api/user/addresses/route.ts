import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

async function ensureAddressesTable() {
    await neonSql`
        CREATE TABLE IF NOT EXISTS user_addresses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            street TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            pincode TEXT NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `;
    
    // Add index for faster lookups
    await neonSql`CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);`;
}

export async function GET(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await ensureAddressesTable();

        const addresses = await neonSql`
            SELECT * FROM user_addresses 
            WHERE user_id = ${decodedToken.uid} 
            ORDER BY is_default DESC, created_at DESC
        `;

        return NextResponse.json(addresses);
    } catch (err: any) {
        console.error('[Addresses GET] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await ensureAddressesTable();

        const body = await req.json();
        const { name, phone, street, city, state, pincode, is_default } = body;

        if (!name || !phone || !street || !city || !state || !pincode) {
            return NextResponse.json({ message: 'All address fields are required.' }, { status: 400 });
        }

        // If setting as default, unset other defaults
        if (is_default) {
            await neonSql`UPDATE user_addresses SET is_default = FALSE WHERE user_id = ${decodedToken.uid}`;
        }

        // Output of address creation
        const newAddress = await neonSql`
            INSERT INTO user_addresses (user_id, name, phone, street, city, state, pincode, is_default)
            VALUES (${decodedToken.uid}, ${name}, ${phone}, ${street}, ${city}, ${state}, ${pincode}, ${is_default || false})
            RETURNING *
        `;

        return NextResponse.json(newAddress[0], { status: 201 });
    } catch (err: any) {
        console.error('[Addresses POST] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
