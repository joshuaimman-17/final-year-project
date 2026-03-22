import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

// GET: List all expert requests (Admin only)
export async function GET(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const callerRows = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.uid}`;
    if (!callerRows[0] || callerRows[0].role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Fetch deduplicated expert requests (latest per user)
    const requests = await neonSql`
        WITH RankedRequests AS (
            SELECT er.*, u.full_name, u.email, u.username,
                   ROW_NUMBER() OVER(PARTITION BY er.user_id ORDER BY er.created_at DESC) as rn
            FROM expert_requests er 
            JOIN users u ON u.id = er.user_id 
        )
        SELECT * FROM RankedRequests WHERE rn = 1
        ORDER BY created_at DESC
    `;
    return NextResponse.json({ requests });
}

// POST: Submit an expert application (Customer only)
export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const userId = decodedToken.uid;

    // Check for existing pending or already approved application
    const existing = await neonSql`SELECT status FROM expert_requests WHERE user_id = ${userId} AND status IN ('pending', 'approved')`;
    if (existing.length > 0) {
        const status = existing[0].status;
        if (status === 'approved') return NextResponse.json({ message: 'You are already an expert' }, { status: 400 });
        return NextResponse.json({ message: 'You already have a pending expert request' }, { status: 409 });
    }

    const { skills, experience, portfolio_link, message } = await req.json();
    const created = await neonSql`
        INSERT INTO expert_requests (user_id, skills, experience, portfolio_link, message, status)
        VALUES (${userId}, ${skills}, ${experience}, ${portfolio_link || null}, ${message || null}, 'pending')
        RETURNING *
    `;
    return NextResponse.json({ request: created[0] }, { status: 201 });
}

// PATCH: Approve or reject an expert request (Admin only)
export async function PATCH(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const callerRows = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.uid}`;
    if (!callerRows[0] || callerRows[0].role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { requestId, status } = await req.json();
    if (!['approved', 'denied'].includes(status)) {
        return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const updated = await neonSql`
        UPDATE expert_requests SET status = ${status} WHERE id = ${requestId} RETURNING user_id
    `;
    const userId = updated[0]?.user_id;

    if (userId) {
        // Update user's expert_status and role accordingly
        const newRole = status === 'approved' ? 'EXPERT' : 'CUSTOMER';
        await neonSql`
            UPDATE users SET expert_status = ${status}, role = ${newRole} WHERE id = ${userId}
        `;
    }

    return NextResponse.json({ message: `Application ${status}` });
}
