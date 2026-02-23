import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ message: 'Username required' }, { status: 400 });
    }

    try {
        const results = await sql`
            SELECT id FROM users WHERE username = ${username}
        `;

        return NextResponse.json({ available: results.length === 0 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
