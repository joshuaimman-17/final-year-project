import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

/**
 * GET: Fetch public profile of a user (Experts or Farmers)
 * Production-ready handler with robust error tracking and type safety.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: any }
) {
    const requestId = `prof_${Date.now().toString(36)}`;
    console.log(`[API][${requestId}] GET Profile request started`);

    try {
        // Resolve params for Next.js 14 vs 15 compatibility
        const resolvedParams = (params && typeof params.then === 'function') 
            ? await params 
            : params;
        
        const rawId = resolvedParams?.id;
        
        if (!rawId) {
            console.error(`[API][${requestId}] Missing ID in dynamic route parameters`);
            return NextResponse.json({ 
                message: 'User ID is required', 
                debug: 'Missing ID in params' 
            }, { status: 400 });
        }

        const id = String(rawId);
        console.log(`[API][${requestId}] Fetching profile for UID: "${id}"`);

        // Optional Auth check
        try {
            await verifyAuth(req);
        } catch (e) {
            console.warn(`[API][${requestId}] Auth verification issue (ignored):`, e);
        }

        // Primary User Fetch
        // We use ::text to ensure PostgreSQL treats the Firebase UID correctly as a string.
        const userResult = await neonSql`
            SELECT id, username, full_name, role, created_at, location, latitude, longitude, avatar_url, farm_name, follower_count, following_count,
                   about, skills, experience, projects, achievements, portfolio_link, expert_status
            FROM users 
            WHERE id = ${id}::text
            LIMIT 1
        `;

        if (!userResult || userResult.length === 0) {
            console.log(`[API][${requestId}] Profile not found for UID: "${id}"`);
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const user = userResult[0];

        console.log(`[API][${requestId}] Profile success: "${id}"`);
        return NextResponse.json(user);

    } catch (criticalError: any) {
        console.error(`[API][${requestId}] Internal Server Error:`, criticalError);
        return NextResponse.json({ 
            message: 'Server error while loading profile',
            error: criticalError.message || 'Unknown database or serialization error',
            requestId: requestId
        }, { status: 500 });
    }
}
