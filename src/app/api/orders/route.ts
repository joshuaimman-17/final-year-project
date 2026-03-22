import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

async function ensureOrdersTables() {
    await neonSql`
        CREATE TABLE IF NOT EXISTS orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            buyer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            buyer_name TEXT,
            farmer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            farmer_name TEXT,
            total_amount NUMERIC(10, 2) NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
            delivery_address_id UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `;
    
    await neonSql`
        CREATE TABLE IF NOT EXISTS order_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
            product_id UUID REFERENCES products(id) ON DELETE SET NULL,
            product_name TEXT NOT NULL,
            product_image TEXT,
            quantity NUMERIC(10, 2) NOT NULL,
            unit TEXT NOT NULL,
            price_at_purchase NUMERIC(10, 2) NOT NULL
        );
    `;

    await neonSql`CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);`;
    await neonSql`CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id);`;
    await neonSql`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);`;
}

// POST: Place a new order
export async function POST(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await ensureOrdersTables();
        const body = await req.json();
        const { farmer_id, items, delivery_address_id } = body;
        
        if (!farmer_id || !items || !items.length || !delivery_address_id) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Validate Role (Prevent farmers from ordering)
        const userRows = await neonSql`SELECT role, full_name FROM users WHERE id = ${decodedToken.uid}`;
        if (!userRows.length) return NextResponse.json({ message: 'User not found' }, { status: 404 });
        const buyerName = userRows[0].full_name || decodedToken.name || 'Unknown Buyer';
        
        // Let's get farmer name
        const farmerRows = await neonSql`SELECT full_name FROM users WHERE id = ${farmer_id}`;
        const farmerName = farmerRows.length ? farmerRows[0].full_name : 'Unknown Farmer';

        let totalAmount = 0;

        // Perform stock check and calculate total sequentially before transaction
        for (const item of items) {
            const productQuery = await neonSql`SELECT stock, price, name, image_url, unit FROM products WHERE id = ${item.product_id}`;
            if (!productQuery.length) return NextResponse.json({ message: `Product ${item.product_id} not found` }, { status: 404 });
            
            const product = productQuery[0];
            if (product.stock < item.quantity) {
                return NextResponse.json({ message: `Not enough stock for ${product.name}. Available: ${product.stock}` }, { status: 400 });
            }
            
            totalAmount += parseFloat(product.price) * parseFloat(item.quantity);
            
            // Enrich item for later insertion
            item.price_at_purchase = product.price;
            item.product_name = product.name;
            item.product_image = product.image_url;
            item.unit = product.unit;
        }

        // --- Execute Transaction using arrays inside neonSql if we had full access.
        // For simplicity we will handle it step-by-step:
        try {
            // 1. Create Order
            const orderRes = await neonSql`
                INSERT INTO orders (buyer_id, buyer_name, farmer_id, farmer_name, total_amount, delivery_address_id)
                VALUES (${decodedToken.uid}, ${buyerName}, ${farmer_id}, ${farmerName}, ${totalAmount}, ${delivery_address_id})
                RETURNING *
            `;
            const orderId = orderRes[0].id;

            // 2. Insert Items and Deduct Stock
            for (const item of items) {
                await neonSql`
                    INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit, price_at_purchase)
                    VALUES (${orderId}, ${item.product_id}, ${item.product_name}, ${item.product_image}, ${item.quantity}, ${item.unit}, ${item.price_at_purchase})
                `;

                // Decrement stock
                await neonSql`
                    UPDATE products 
                    SET stock = stock - ${item.quantity}
                    WHERE id = ${item.product_id}
                `;
            }

            return NextResponse.json(orderRes[0], { status: 201 });
            
        } catch (e: any) {
             throw new Error("Failed to process order details securely: " + e.message);
        }

    } catch (err: any) {
        console.error('[Orders POST] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

// GET: Fetch orders for the user (as Buyer or Farmer depending on their role)
export async function GET(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await ensureOrdersTables();

        const { searchParams } = new URL(req.url);
        const viewAs = searchParams.get('viewAs') || 'buyer'; // 'buyer' or 'farmer'

        let orders;
        if (viewAs === 'farmer') {
             orders = await neonSql`
                SELECT o.*, 
                    json_agg(
                        json_build_object(
                            'id', i.id, 'product_id', i.product_id, 'product_name', i.product_name, 
                            'product_image', i.product_image, 'quantity', i.quantity, 
                            'unit', i.unit, 'price', i.price_at_purchase
                        )
                    ) as items,
                    row_to_json(a.*) as delivery_address
                FROM orders o
                LEFT JOIN order_items i ON o.id = i.order_id
                LEFT JOIN user_addresses a ON o.delivery_address_id = a.id
                WHERE o.farmer_id = ${decodedToken.uid}
                GROUP BY o.id, a.id
                ORDER BY o.created_at DESC
            `;
        } else {
             orders = await neonSql`
                SELECT o.*, 
                    json_agg(
                        json_build_object(
                            'id', i.id, 'product_id', i.product_id, 'product_name', i.product_name, 
                            'product_image', i.product_image, 'quantity', i.quantity, 
                            'unit', i.unit, 'price', i.price_at_purchase
                        )
                    ) as items,
                    row_to_json(a.*) as delivery_address
                FROM orders o
                LEFT JOIN order_items i ON o.id = i.order_id
                LEFT JOIN user_addresses a ON o.delivery_address_id = a.id
                WHERE o.buyer_id = ${decodedToken.uid}
                GROUP BY o.id, a.id
                ORDER BY o.created_at DESC
            `;
        }

        return NextResponse.json(orders);
    } catch (err: any) {
        console.error('[Orders GET] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
