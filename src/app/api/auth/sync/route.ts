import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

const ADMIN_EMAIL = 'ksdharanidharan2005@gmail.com';

export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { uid, email, name, picture, phone_number } = decodedToken;
        const body = await req.json();

        const userId = phone_number || uid;

        const full_name = body.full_name || null;
        const farm_name = body.farm_name || null;
        const location = body.location || null;
        const latitude = body.latitude || null;
        const longitude = body.longitude || null;
        const avatar_url = picture || null;
        const username = body.username || null;
        const about = body.about || null;

        // ── ADMIN EMAIL ENFORCEMENT ──
        const isAdminEmail = email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        console.log(`[Sync] Processing sync for ${email || 'no email'}, isAdminEmail: ${isAdminEmail}`);
        const roleForNewUser = isAdminEmail ? 'ADMIN' : (body.role || 'BUYER');
        console.log(`[Sync] Derived role: ${roleForNewUser}`);

        let existingUsers = await neonSql`SELECT * FROM users WHERE id = ${userId}`;

        if (existingUsers.length === 0 && email) {
            const byEmail = await neonSql`SELECT * FROM users WHERE email = ${email}`;
            if (byEmail.length > 0) {
                console.log(`[Sync] Healing ID transition for ${email}: ${byEmail[0].id} -> ${userId}`);
                await neonSql`UPDATE user_public_keys SET user_id = ${userId} WHERE user_id = ${byEmail[0].id}`;
                await neonSql`UPDATE users SET id = ${userId} WHERE id = ${byEmail[0].id}`;
                existingUsers = await neonSql`SELECT * FROM users WHERE id = ${userId}`;
            }
        }

        const existingUser = existingUsers[0];
        let finalUser;

        if (existingUser) {
            try {
                const new_full_name = full_name ?? existingUser.full_name;
                const new_username = username ?? existingUser.username;
                const new_about = about ?? existingUser.about;
                const new_farm_name = farm_name ?? existingUser.farm_name;
                const new_location = location ?? existingUser.location;
                const new_avatar_url = avatar_url ?? existingUser.avatar_url;
                // ── ROLE LOGIC ──
                let new_role = existingUser.role;
                if (isAdminEmail) {
                    new_role = 'ADMIN'; // admin email always gets ADMIN
                } else if (!existingUser.role || existingUser.role === 'BUYER' || existingUser.role === 'CUSTOMER') {
                    // Allow updating from basic/legacy role if a role is provided in the sync request
                    if (body.role) {
                        new_role = body.role;
                    }
                }
                // otherwise keep existingUser.role as-is (e.g., don't downgrade EXPERT/FARMER)

                const updatedUsers = await neonSql`
                    UPDATE users 
                    SET 
                        full_name = ${new_full_name},
                        username = ${new_username},
                        about = ${new_about},
                        farm_name = ${new_farm_name},
                        location = ${new_location},
                        avatar_url = ${new_avatar_url},
                        role = ${new_role},
                        last_login = NOW()
                    WHERE id = ${userId}
                    RETURNING *
                `;
                finalUser = updatedUsers[0];
            } catch (updateErr: any) {
                if (updateErr.code === '23505') {
                    return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
                }
                throw updateErr;
            }
        } else {
            // Create new user - Resilience: provide fallback for username/role if missing (orphaned users)
            const finalUsername = username || email?.split('@')[0] || `user_${userId.slice(-5)}`;
            console.log(`[Sync] Creating missing record for ${email || userId}. Derived username: ${finalUsername}, role: ${roleForNewUser}`);

            try {
                const newUsers = await neonSql`
                    INSERT INTO users (id, email, username, full_name, role, farm_name, location, avatar_url, last_login)
                    VALUES (
                        ${userId}, 
                        ${email || null}, 
                        ${finalUsername}, 
                        ${full_name || name || 'Agri User'}, 
                        ${roleForNewUser},
                        ${farm_name || 'My Farm'}, 
                        ${location || ''}, 
                        ${avatar_url || ''},
                        NOW()
                    )
                    RETURNING *
                `;
                finalUser = newUsers[0];
            } catch (createErr: any) {
                if (createErr.code === '23505') {
                    return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
                }
                throw createErr;
            }
        }

        // Fetch Social Stats
        const [followerRes, followingRes, likesRes] = await Promise.all([
            neonSql`SELECT COUNT(*) as count FROM followers WHERE following_id = ${userId}`,
            neonSql`SELECT COUNT(*) as count FROM followers WHERE follower_id = ${userId}`,
            neonSql`SELECT COUNT(*) as count FROM expert_likes WHERE expert_id = ${userId}`
        ]);

        const userWithStats = {
            ...finalUser,
            follower_count: parseInt(followerRes[0].count),
            following_count: parseInt(followingRes[0].count),
            like_count: parseInt(likesRes[0].count)
        };

        return NextResponse.json({ 
            user: userWithStats, 
            message: 'User synced with Postgres' 
        });

    } catch (err: any) {
        console.error('Sync Error (Neon):', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
