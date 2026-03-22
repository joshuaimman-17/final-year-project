import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';
import fs from 'fs';
import path from 'path';

// ✅ Add any admin emails here — these will always get the ADMIN role on login
const ADMIN_EMAILS: string[] = [
    'ksdharanidharan2005@gmail.com',
    'dr.plant2026@gmail.com',
];

export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { uid, email, name: fbName, picture } = decodedToken;
    const userId = uid;

    try {
        let body: any = {};
        try {
            body = await req.json();
        } catch (e) {}

        const isAdminEmail = ADMIN_EMAILS.includes(email?.toLowerCase() || '');
        
        // Extract extra fields from body
        const farmName = body.farm_name || body.farmName || null;
        const lat = body.latitude || 20.5937;
        const lon = body.longitude || 78.9629;

        console.log(`[Sync] Syncing user: ${email || userId}, isAdmin: ${isAdminEmail}, Farm: ${farmName}`);

        // Try to find user by id
        let existingUsers = await neonSql`SELECT * FROM users WHERE id = ${userId}`;

        // Healing: If not found by ID, try email (for legacy transitions)
        if (existingUsers.length === 0 && email) {
            const byEmail = await neonSql`SELECT * FROM users WHERE email = ${email}`;
            if (byEmail.length > 0) {
                console.log(`[Sync] Updating ID for legacy email user ${email}`);
                await neonSql`UPDATE users SET id = ${userId} WHERE email = ${email}`;
                existingUsers = await neonSql`SELECT * FROM users WHERE id = ${userId}`;
            }
        }

        let finalUser;
        if (existingUsers.length > 0) {
            const user = existingUsers[0];
            // Trust the existing DB role UNLESS we're overriding with admin email list
            // This allows admins set via DB script to keep their role on re-login
            const preservedRole = isAdminEmail
                ? 'ADMIN'
                : user.role === 'ADMIN'
                    ? 'BUYER'  // non-admin-email users cannot keep ADMIN role
                    : (user.role || 'BUYER');

            const updatedUsers = await neonSql`
                UPDATE users 
                SET 
                    full_name = ${fbName || user.full_name || 'Agri User'},
                    avatar_url = ${picture || user.avatar_url || ''},
                    role = ${preservedRole},
                    farm_name = ${farmName || user.farm_name || null},
                    latitude = ${lat},
                    longitude = ${lon}
                WHERE id = ${userId}
                RETURNING *
            `;
            finalUser = updatedUsers[0];
        } else {
            console.log(`[Sync] Creating new user: ${email || userId}`);
            let defaultRole = body.role?.toUpperCase() || 'BUYER';
            if (defaultRole === 'ADMIN' && !isAdminEmail) {
                defaultRole = 'BUYER';
            }
            if (isAdminEmail) defaultRole = 'ADMIN';

            const defaultUsername = body.username || email?.split('@')[0] || `user_${userId.slice(-5)}`;
            
            const newUsers = await neonSql`
                INSERT INTO users (id, email, username, full_name, avatar_url, role, farm_name, latitude, longitude)
                VALUES (
                    ${userId}, 
                    ${email || null}, 
                    ${defaultUsername}, 
                    ${fbName || 'Agri User'}, 
                    ${picture || ''}, 
                    ${defaultRole},
                    ${farmName},
                    ${lat},
                    ${lon}
                )
                RETURNING *
            `;
            finalUser = newUsers[0];
        }

        // Fetch follow counts
        let follower_count = 0;
        let following_count = 0;
        try {
            // Note: We avoid creating tables inside the GET/POST handlers for performance and safety.
            // If the table is missing, the catch block handles it by defaulting to 0.
            const followerRes = await neonSql`SELECT COUNT(*) as count FROM follows WHERE followee_id = ${userId}`;
            follower_count = Number(followerRes[0]?.count || 0);

            const followingRes = await neonSql`SELECT COUNT(*) as count FROM follows WHERE follower_id = ${userId}`;
            following_count = Number(followingRes[0]?.count || 0);
        } catch (e) {
            console.warn('[Sync] Follow counts fetch failed (possibly table missing):', e);
        }

        // Return standardized user object for frontend
        return NextResponse.json({ 
            user: {
                ...finalUser,
                follower_count,
                following_count,
                // Ensure frontend gets 'id' and 'full_name' as expected by types
                id: finalUser.id,
                full_name: finalUser.full_name
            }, 
            message: 'Sync successful' 
        });

    } catch (err: any) {
        const errorDetail = err.message || String(err);
        const stack = err.stack || 'No stack trace';
        
        try {
            const logPath = path.join(process.cwd(), 'sync-error.log');
            const logMessage = `[${new Date().toISOString()}] Sync failure for ${userId}:\nError: ${errorDetail}\nStack: ${stack}\n\n`;
            fs.appendFileSync(logPath, logMessage);
        } catch (e) {
            console.error('Failed to write to sync-error.log', e);
        }

        console.error(`[Sync] Critical failure for ${userId}:`, err);
        return NextResponse.json({ 
            message: 'Internal synchronization error',
            error: errorDetail
        }, { status: 500 });
    }
}
