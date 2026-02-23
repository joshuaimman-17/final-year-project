import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { verifyAuth } from '@/lib/authHelper';

export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { uid, email, name, picture } = decodedToken;
        const body = await req.json();
        const { full_name, farm_name, location } = body;

        // Check if user exists
        const sql = getDb();
        const existingUsers = await sql`SELECT * FROM users WHERE id = ${uid}`;

        if (existingUsers.length > 0) {
            // Update existing user info if provided
            const updatedUser = await sql`
                UPDATE users 
                SET 
                    full_name = COALESCE(${full_name}, full_name),
                    farm_name = COALESCE(${farm_name}, farm_name),
                    location = COALESCE(${location}, location),
                    avatar_url = COALESCE(${picture}, avatar_url)
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
                ${email}, 
                ${email?.split('@')[0] || 'user'}, 
                ${full_name || name || 'Agri User'}, 
                ${farm_name || 'My Farm'}, 
                ${location || ''}, 
                ${picture || ''}
            )
            RETURNING *
        `;

        return NextResponse.json({ user: newUser[0], message: 'User synced (created)' }, { status: 201 });
    } catch (err: any) {
        console.error('Sync Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
