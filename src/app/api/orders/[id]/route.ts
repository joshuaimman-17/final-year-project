import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

// PATCH /api/orders/[id] — update order status (Farmer only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
        }

        // Verify ownership (only Farmer of this order or Admin can change it)
        const existing = await neonSql`SELECT farmer_id FROM orders WHERE id = ${id}`;
        if (existing.length === 0) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        
        const userRow = await neonSql`SELECT role FROM users WHERE id = ${decodedToken.uid}`;
        const isAdmin = userRow[0]?.role === 'ADMIN';

        if (existing[0].farmer_id !== decodedToken.uid && !isAdmin) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const result = await neonSql`
            UPDATE orders
            SET status = ${status}, updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;

        return NextResponse.json(result[0]);
    } catch (err: any) {
        console.error('[Orders PATCH] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
