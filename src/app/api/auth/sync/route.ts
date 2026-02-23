import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/authHelper';

export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { uid, email, name, picture } = decodedToken;
        const body = await req.json();
        const full_name = body.full_name || null;
        const farm_name = body.farm_name || null;
        const location = body.location || null;
        const avatar_url = picture || null;

        // Check if user exists
        const [existingUser] = await sql`SELECT * FROM users WHERE id = ${uid}`;

        if (existingUser) {
            // Update existing user info if provided
            const updatedUser = await sql`
                UPDATE users 
                SET 
                    full_name = COALESCE(${full_name}::text, full_name),
                    farm_name = COALESCE(${farm_name}::text, farm_name),
                    location = COALESCE(${location}::text, location),
                    avatar_url = COALESCE(${avatar_url}::text, avatar_url)
                WHERE id = ${uid}
                RETURNING *
            `;
            return NextResponse.json({ user: updatedUser[0], message: 'User synced (updated)' });
        }

        // Create new user record
        const newUser = await sql`
            INSERT INTO users (id, email, username, full_name, farm_name, location, avatar_url)
            VALUES (
                ${uid}, 
                ${email || null}::text, 
                ${(email || 'user').split('@')[0]}::text, 
                ${full_name || name || 'Agri User'}::text, 
                ${farm_name || 'My Farm'}::text, 
                ${location || ''}::text, 
                ${avatar_url || ''}::text
            )
            RETURNING *
        `;

        return NextResponse.json({ user: newUser[0], message: 'User synced (created)' }, { status: 201 });
    } catch (err: any) {
        console.error('Sync Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
