import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const columns = await neonSql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `;
        return NextResponse.json({ columns: columns.map(c => c.column_name) });
    } catch (err: any) {
        return NextResponse.json({ error: err.message });
    }
}
