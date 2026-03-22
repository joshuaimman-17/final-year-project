import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

// PATCH /api/products/[id] — update price/stock (farmer can only edit own products)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const decoded = await verifyAuth(req);
        if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { price, stock } = body;

        // Verify ownership
        const existing = await neonSql`SELECT farmer_id FROM products WHERE id = ${id}`;
        if (existing.length === 0) return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        if (existing[0].farmer_id !== decoded.uid) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        const result = await neonSql`
            UPDATE products
            SET 
                price = COALESCE(${price !== undefined ? price : null}::NUMERIC, price),
                stock = COALESCE(${stock !== undefined ? stock : null}::INTEGER, stock),
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;

        return NextResponse.json(result[0]);
    } catch (err: any) {
        console.error('[Products PATCH] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

// DELETE /api/products/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const decoded = await verifyAuth(req);
        if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Verify ownership (admin can delete any)
        const existing = await neonSql`SELECT farmer_id FROM products WHERE id = ${id}`;
        if (existing.length === 0) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

        const userRow = await neonSql`SELECT role FROM users WHERE id = ${decoded.uid}`;
        const isAdmin = userRow[0]?.role === 'ADMIN';

        if (existing[0].farmer_id !== decoded.uid && !isAdmin) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        await neonSql`DELETE FROM products WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Products DELETE] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
