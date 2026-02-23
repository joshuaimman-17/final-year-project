import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
    try {
        const sql = getDb();
        const products = await sql`SELECT * FROM products ORDER BY created_at DESC`;
        return NextResponse.json(products);
    } catch (err: any) {
        console.error('Fetch Products Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
