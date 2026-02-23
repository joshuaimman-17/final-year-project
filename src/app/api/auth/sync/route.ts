import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
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

        // Check if user exists in Neon
        const existingUsers = await neonSql`SELECT * FROM users WHERE id = ${userId}`;
        const existingUser = existingUsers[0];

        if (existingUser) {
            try {
                // Update existing user info in Neon
                const updatedUsers = await neonSql`
                    UPDATE users 
                    SET 
                        full_name = COALESCE(${full_name}, full_name),
                        username = COALESCE(${username}, username),
                        farm_name = COALESCE(${farm_name}, farm_name),
                        location = COALESCE(${location}, location),
                        avatar_url = COALESCE(${avatar_url}, avatar_url)
                    WHERE id = ${userId}
                    RETURNING *
                `;
                return NextResponse.json({ user: updatedUsers[0], message: 'User synced (updated) in Neon' });
            } catch (updateErr: any) {
                if (updateErr.code === '23505') { // Unique constraint violation
                    return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
                }
                throw updateErr;
            }
        }

        // Create new user record in Neon
        if (!username) {
            return NextResponse.json({ message: 'Username is required for new accounts' }, { status: 400 });
        }

        try {
            const newUsers = await neonSql`
                INSERT INTO users (id, email, username, full_name, role, farm_name, location, avatar_url)
                VALUES (
                    ${userId}, 
                    ${email || null}, 
                    ${username}, 
                    ${full_name || name || 'Agri User'}, 
                    ${role},
                    ${farm_name || 'My Farm'}, 
                    ${location || ''}, 
                    ${avatar_url || ''}
                )
                RETURNING *
            `;
            return NextResponse.json({ user: newUsers[0], message: 'User synced (created) in Neon' }, { status: 201 });
        } catch (createErr: any) {
            if (createErr.code === '23505') {
                return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
            }
            throw createErr;
        }
    } catch (err: any) {
        console.error('Sync Error (Neon):', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
