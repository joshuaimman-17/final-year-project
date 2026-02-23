import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/authHelper';

export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { uid, email, name, picture, phone_number } = decodedToken;
        const body = await req.json();

        // Priority ID: Phone Number -> UID
        const userId = phone_number || uid;

        const full_name = body.full_name || null;
        const farm_name = body.farm_name || null;
        const location = body.location || null;
        const avatar_url = picture || null;
        const username = body.username || null;
        const role = body.role || 'CUSTOMER';

        // Check if user exists
        const [existingUser] = await sql`SELECT * FROM users WHERE id = ${userId}`;

        if (existingUser) {
            try {
                // Update existing user info
                const updatedUser = await sql`
                    UPDATE users 
                    SET 
                        full_name = COALESCE(${full_name}::text, full_name),
                        username = COALESCE(${username}::text, username),
                        farm_name = COALESCE(${farm_name}::text, farm_name),
                        location = COALESCE(${location}::text, location),
                        avatar_url = COALESCE(${avatar_url}::text, avatar_url)
                    WHERE id = ${userId}
                    RETURNING *
                `;
                return NextResponse.json({ user: updatedUser[0], message: 'User synced (updated)' });
            } catch (updateErr: any) {
                if (updateErr.code === '23505') { // Unique constraint violation
                    return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
                }
                throw updateErr;
            }
        }

        // Create new user record
        if (!username) {
            return NextResponse.json({ message: 'Username is required for new accounts' }, { status: 400 });
        }

        try {
            const newUser = await sql`
                INSERT INTO users (id, email, username, full_name, role, farm_name, location, avatar_url)
                VALUES (
                    ${userId}, 
                    ${email || null}::text, 
                    ${username}::text, 
                    ${full_name || name || 'Agri User'}::text, 
                    ${role}::text,
                    ${farm_name || 'My Farm'}::text, 
                    ${location || ''}::text, 
                    ${avatar_url || ''}::text
                )
                RETURNING *
            `;
            return NextResponse.json({ user: newUser[0], message: 'User synced (created)' }, { status: 201 });
        } catch (createErr: any) {
            if (createErr.code === '23505') {
                return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
            }
            throw createErr;
        }
    } catch (err: any) {
        console.error('Sync Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
