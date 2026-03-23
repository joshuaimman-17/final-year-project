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
        const about = body.about || null;
        const skills = body.skills || null;
        const experience = body.experience || null;
        const projects = body.projects || null;
        const achievements = body.achievements || null;
        const portfolioLink = body.portfolio_link || body.portfolioLink || null;
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
                    ? 'FARMER'  // non-admin-email users cannot keep ADMIN role
                    : (user.role || 'FARMER');

            const updatedUsers = await neonSql`
                UPDATE users 
                SET 
                    full_name = ${fbName || user.full_name || 'Agri User'},
                    avatar_url = ${picture || user.avatar_url || ''},
                    role = ${preservedRole},
                    farm_name = ${farmName || user.farm_name || null},
                    about = ${about || user.about || null},
                    skills = ${skills || user.skills || null},
                    experience = ${experience || user.experience || null},
                    projects = ${projects || user.projects || null},
                    achievements = ${achievements || user.achievements || null},
                    portfolio_link = ${portfolioLink || user.portfolio_link || null},
                    latitude = ${lat},
                    longitude = ${lon}
                WHERE id = ${userId}
                RETURNING *
            `;
            finalUser = updatedUsers[0];
        } else {
            console.log(`[Sync] Creating new user: ${email || userId}`);
            let defaultRole = body.role?.toUpperCase() || 'FARMER';
            if (defaultRole === 'ADMIN' && !isAdminEmail) {
                defaultRole = 'FARMER';
            }
            if (isAdminEmail) defaultRole = 'ADMIN';

            const defaultUsername = body.username || email?.split('@')[0] || `user_${userId.slice(-5)}`;
            
            const newUsers = await neonSql`
                INSERT INTO users (id, email, username, full_name, avatar_url, role, farm_name, about, skills, experience, projects, achievements, portfolio_link, latitude, longitude)
                VALUES (
                    ${userId}, 
                    ${email || null}, 
                    ${defaultUsername}, 
                    ${fbName || 'Agri User'}, 
                    ${picture || ''}, 
                    ${defaultRole},
                    ${farmName},
                    ${about},
                    ${skills},
                    ${experience},
                    ${projects},
                    ${achievements},
                    ${portfolioLink},
                    ${lat},
                    ${lon}
                )
                RETURNING *
            `;
            finalUser = newUsers[0];
        }

        // Return standardized user object for frontend
        return NextResponse.json({ 
            user: {
                ...finalUser,
                // Ensure frontend gets 'id' and 'full_name' as expected by types
                id: finalUser.id,
                full_name: finalUser.full_name,
                about: finalUser.about,
                skills: finalUser.skills,
                experience: finalUser.experience,
                projects: finalUser.projects,
                achievements: finalUser.achievements,
                portfolio_link: finalUser.portfolio_link,
                expert_status: finalUser.expert_status || 'none',
                follower_count: finalUser.follower_count || 0,
                following_count: finalUser.following_count || 0
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
