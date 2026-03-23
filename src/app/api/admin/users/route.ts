import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

// GET: List all users (Admin only)
export async function GET(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Verify calling user is admin
    const callerRows = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.uid}`;
    if (!callerRows[0] || callerRows[0].role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Ensure status column exists before querying
    await neonSql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;
    
    // Include status in the result
    const users = await neonSql`SELECT id, email, username, full_name, role, expert_status, status, created_at FROM users ORDER BY created_at DESC`;
    return NextResponse.json({ users });
}

// PATCH: Change a user's role (Admin only)
export async function PATCH(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const callerRows = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.uid}`;
    if (!callerRows[0] || callerRows[0].role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body;
    console.log(`[AdminAPI] Request to update user ${userId} to role ${role}`);

    if (!userId || !role) {
        return NextResponse.json({ message: 'Missing userId or role' }, { status: 400 });
    }

    const normalizedRole = role.toUpperCase();
    if (!['BUYER', 'FARMER', 'EXPERT', 'ADMIN'].includes(normalizedRole)) {
        return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    try {
        const updated = await neonSql`
            UPDATE users SET role = ${normalizedRole} WHERE id = ${userId} 
            RETURNING id, email, role
        `;

        if (updated.length === 0) {
            console.warn(`[AdminAPI] User ${userId} not found during update`);
            return NextResponse.json({ message: 'User not found in database' }, { status: 404 });
        }

        console.log(`[AdminAPI] Successfully updated ${updated[0].email} to ${normalizedRole}`);
        return NextResponse.json({ 
            message: `Role successfully updated to ${normalizedRole}`,
            user: updated[0] 
        });
    } catch (err: any) {
        console.error(`[AdminAPI] Database error during role update:`, err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove a user (Admin only)
export async function DELETE(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const callerRows = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.uid}`;
    if (!callerRows[0] || callerRows[0].role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await req.json();

    // Prevent deletion of main admin
    const targetUser = await neonSql`SELECT email FROM users WHERE id = ${userId}`;
    if (targetUser[0]?.email === 'ksdharanidharan2005@gmail.com') {
        return NextResponse.json({ message: 'Cannot delete the main admin account' }, { status: 403 });
    }

    await neonSql`DELETE FROM users WHERE id = ${userId}`;
    return NextResponse.json({ message: 'User deleted' });
}
