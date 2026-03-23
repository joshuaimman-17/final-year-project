import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const decoded = await verifyAuth(req);
        if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { status } = body;
        if (!status) return NextResponse.json({ message: 'Status is required' }, { status: 400 });

        const updatedOrders = await neonSql`
            UPDATE orders 
            SET status = ${status}, updated_at = NOW()
            WHERE id = ${params.id} AND (farmer_id = ${decoded.uid} OR buyer_id = ${decoded.uid})
            RETURNING *
        `;

        if (updatedOrders.length === 0) {
            return NextResponse.json({ message: 'Order not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json(updatedOrders[0]);
    } catch (err: any) {
        console.error('[Orders PATCH] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
