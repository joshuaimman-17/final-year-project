import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Add expert_status column to users if it doesn't exist
        await neonSql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS expert_status VARCHAR(20) DEFAULT 'none'
        `;

        // Create expert_requests table if it doesn't exist
        await neonSql`
            CREATE TABLE IF NOT EXISTS expert_requests (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                skills TEXT NOT NULL,
                experience TEXT NOT NULL,
                portfolio_link TEXT,
                message TEXT,
                status VARCHAR(20) DEFAULT 'pending' NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;

        // Force admin email to have ADMIN role
        await neonSql`
            UPDATE users SET role = 'ADMIN' WHERE email = 'ksdharanidharan2005@gmail.com'
        `;

        return NextResponse.json({ message: 'Migration applied: expert_status, expert_requests table, and admin role forced.' });
    } catch (err: any) {
        console.error('Migration error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
