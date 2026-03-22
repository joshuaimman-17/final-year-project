import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    if (!decodedToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const farmerId = decodedToken.uid;

    try {
        // Total products listed by this farmer
        const productsResult = await neonSql`
            SELECT COUNT(*) as count FROM products 
            WHERE farmer_id = ${farmerId}
        `;
        const totalProducts = parseInt(productsResult[0]?.count ?? '0');

        // Orders for this farmer's products
        let totalOrders = 0;
        let pendingOrders = 0;
        let totalRevenue = 0;

        try {
            const ordersResult = await neonSql`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ('PENDING', 'CONFIRMED', 'SHIPPED') THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'DELIVERED' THEN total_amount ELSE 0 END) as revenue
                FROM orders 
                WHERE farmer_id = ${farmerId}
            `;
            totalOrders = parseInt(ordersResult[0]?.total ?? '0');
            pendingOrders = parseInt(ordersResult[0]?.pending ?? '0');
            totalRevenue = parseFloat(ordersResult[0]?.revenue ?? '0');
        } catch {
            // orders table might not exist yet — return zero safely
        }

        return NextResponse.json({
            totalProducts,
            pendingOrders,
            totalOrders,
            totalRevenue
        });
    } catch (error) {
        console.error('[Farmer Stats] Error:', error);
        return NextResponse.json({
            totalProducts: 0,
            pendingOrders: 0,
            totalOrders: 0,
            totalRevenue: 0
        });
    }
}
