import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
    try {
        const { email, newPassword, adminSecret } = await req.json();

        // Simple secret check - avoids need for a logged-in session during initial setup
        if (adminSecret !== process.env.ADMIN_SETUP_SECRET) {
            return NextResponse.json({ message: 'Invalid admin secret' }, { status: 403 });
        }

        const user = await authAdmin.getUserByEmail(email);
        await authAdmin.updateUser(user.uid, { password: newPassword });

        return NextResponse.json({ message: `Password updated for ${email}` });
    } catch (err: any) {
        console.error('Admin password set error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
