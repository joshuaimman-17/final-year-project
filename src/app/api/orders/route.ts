import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

async function ensureOrdersTable() {
    await neonSql`
        CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            buyer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            buyer_name TEXT,
            farmer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            delivery_address_id UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
            total_amount NUMERIC(10, 2) NOT NULL,
            status TEXT DEFAULT 'PENDING',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;

    await neonSql`
        CREATE TABLE IF NOT EXISTS order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
            product_id UUID REFERENCES products(id) ON DELETE CASCADE,
            product_name TEXT,
            product_image TEXT,
            quantity INTEGER NOT NULL,
            price NUMERIC(10, 2) NOT NULL,
            unit TEXT
        )
    `;
}

export async function POST(req: NextRequest) {
    try {
        const decoded = await verifyAuth(req);
        if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await ensureOrdersTable();

        const body = await req.json();
        const { farmer_id, delivery_address_id, items } = body;

        if (!farmer_id || !delivery_address_id || !items || !items.length) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Dynamically calculate the total amount securely from the database to prevent spoofing
        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
             const prods = await neonSql`SELECT name, image_url, price, unit FROM products WHERE id = ${item.product_id}`;
             if (prods.length === 0) return NextResponse.json({ message: `Product ${item.product_id} not found` }, { status: 404 });
             
             const p = prods[0];
             const qty = parseInt(item.quantity) || 1;
             const lineTotal = parseFloat(p.price) * qty;
             totalAmount += lineTotal;
             
             processedItems.push({
                 product_id: item.product_id,
                 product_name: p.name,
                 product_image: p.image_url,
                 price: parseFloat(p.price),
                 unit: p.unit,
                 quantity: qty
             });
        }

        // Insert Order
        const insertedOrders = await neonSql`
            INSERT INTO orders (buyer_id, buyer_name, farmer_id, delivery_address_id, total_amount, status)
            VALUES (${decoded.uid}, ${decoded.name || 'Buyer'}, ${farmer_id}, ${delivery_address_id}, ${totalAmount}, 'PENDING')
            RETURNING *
        `;
        const orderId = insertedOrders[0].id;

        // Insert Order Items
        for (const item of processedItems) {
             await neonSql`
                 INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price, unit)
                 VALUES (${orderId}, ${item.product_id}, ${item.product_name}, ${item.product_image}, ${item.quantity}, ${item.price}, ${item.unit})
             `;
        }

        return NextResponse.json(insertedOrders[0], { status: 201 });
    } catch (err: any) {
        console.error('[Orders POST] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const decoded = await verifyAuth(req);
        if (!decoded) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await ensureOrdersTable();
        const { searchParams } = new URL(req.url);
        const viewAs = searchParams.get('viewAs'); // 'farmer' or 'buyer'

        let orders = [];

        if (viewAs === 'farmer') {
             orders = await neonSql`
                 SELECT o.*, 
                 json_build_object('name', a.name, 'phone', a.phone, 'street', a.street, 'city', a.city, 'state', a.state, 'pincode', a.pincode) as delivery_address,
                 (
                     SELECT json_agg(json_build_object(
                         'id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name, 
                         'product_image', oi.product_image, 'quantity', oi.quantity, 'price', oi.price, 'unit', oi.unit
                     ))
                     FROM order_items oi WHERE oi.order_id = o.id
                 ) as items
                 FROM orders o
                 LEFT JOIN user_addresses a ON o.delivery_address_id = a.id
                 WHERE o.farmer_id = ${decoded.uid}
                 ORDER BY o.created_at DESC
             `;
        } else {
             orders = await neonSql`
                 SELECT o.*, 
                 (SELECT full_name FROM users WHERE id = o.farmer_id) as farmer_name,
                 (SELECT farm_name FROM users WHERE id = o.farmer_id) as farm_name,
                 json_build_object('name', a.name, 'phone', a.phone, 'street', a.street, 'city', a.city, 'state', a.state, 'pincode', a.pincode) as delivery_address,
                 (
                     SELECT json_agg(json_build_object(
                         'id', oi.id, 'product_id', oi.product_id, 'product_name', oi.product_name, 
                         'product_image', oi.product_image, 'quantity', oi.quantity, 'price', oi.price, 'unit', oi.unit
                     ))
                     FROM order_items oi WHERE oi.order_id = o.id
                 ) as items
                 FROM orders o
                 LEFT JOIN user_addresses a ON o.delivery_address_id = a.id
                 WHERE o.buyer_id = ${decoded.uid}
                 ORDER BY o.created_at DESC
             `;
        }

        return NextResponse.json(orders);
    } catch (err: any) {
        console.error('[Orders GET] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
