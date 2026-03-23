import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const callerRows = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.uid}`;
    if (!callerRows[0] || callerRows[0].role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !['block', 'unblock'].includes(action)) {
        return NextResponse.json({ message: 'Invalid request parameters' }, { status: 400 });
    }

    // Prevent blocking main admin
    const targetUser = await neonSql`SELECT email FROM users WHERE id = ${userId}`;
    if (targetUser[0]?.email === 'ksdharanidharan2005@gmail.com') {
        return NextResponse.json({ message: 'Cannot modify main admin account status' }, { status: 403 });
    }

    try {
        // Ensure status column exists
        await neonSql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`;
        
        const newStatus = action === 'block' ? 'blocked' : 'active';
        await neonSql`UPDATE users SET status = ${newStatus} WHERE id = ${userId}`;
        
        // Attempt to disable user in Firebase Auth
        try {
            await admin.auth().updateUser(userId, { disabled: action === 'block' });
        } catch (err) {
            console.warn('[AdminAPI] Firebase Auth update failed. Assuming user may be phone-based only or not synced:', err);
        }

        return NextResponse.json({ message: `User ${newStatus} successfully` });
    } catch (e: any) {
        console.error('[AdminAPI] Block user error:', e);
        return NextResponse.json({ message: e.message }, { status: 500 });
    }
}
