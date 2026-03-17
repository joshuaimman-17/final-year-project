import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

// GET: List all users (Admin only - caller must check role on frontend; API also re-checks)
export async function GET(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // Verify calling user is admin
    const callerRows = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.phone_number || decodedToken.uid}`;
    if (!callerRows[0] || callerRows[0].role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const users = await neonSql`SELECT id, email, username, full_name, role, expert_status, created_at FROM users ORDER BY created_at DESC`;
    return NextResponse.json({ users });
}

// PATCH: Change a user's role (Admin only)
export async function PATCH(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const callerRows = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.phone_number || decodedToken.uid}`;
    if (!callerRows[0] || callerRows[0].role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { userId, role } = await req.json();
    if (!['BUYER', 'FARMER', 'EXPERT', 'ADMIN'].includes(role)) {
        return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    const updated = await neonSql`UPDATE users SET role = ${role} WHERE id = ${userId} RETURNING id, email, role`;
    return NextResponse.json({ user: updated[0] });
}

// DELETE: Remove a user (Admin only)
export async function DELETE(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const callerRows = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.phone_number || decodedToken.uid}`;
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
