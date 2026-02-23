import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const products = await sql`SELECT * FROM products ORDER BY created_at DESC`;
        return NextResponse.json(products);
    } catch (err: any) {
        console.error('Fetch Products Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
