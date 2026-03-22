import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';
import { verifyAuth } from '@/lib/authHelper';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { name, phone, street, city, state, pincode, is_default } = body;

        // Verify ownership
        const existing = await neonSql`SELECT user_id FROM user_addresses WHERE id = ${id}`;
        if (existing.length === 0) return NextResponse.json({ message: 'Address not found' }, { status: 404 });
        if (existing[0].user_id !== decodedToken.uid) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        if (is_default) {
            // Unset current defaults
            await neonSql`UPDATE user_addresses SET is_default = FALSE WHERE user_id = ${decodedToken.uid}`;
        }

        const updated = await neonSql`
            UPDATE user_addresses
            SET 
                name = COALESCE(${name !== undefined ? name : null}, name),
                phone = COALESCE(${phone !== undefined ? phone : null}, phone),
                street = COALESCE(${street !== undefined ? street : null}, street),
                city = COALESCE(${city !== undefined ? city : null}, city),
                state = COALESCE(${state !== undefined ? state : null}, state),
                pincode = COALESCE(${pincode !== undefined ? pincode : null}, pincode),
                is_default = COALESCE(${is_default !== undefined ? is_default : null}::BOOLEAN, is_default),
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;

        return NextResponse.json(updated[0]);
    } catch (err: any) {
        console.error('[Address PUT] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Verify ownership
        const existing = await neonSql`SELECT user_id FROM user_addresses WHERE id = ${id}`;
        if (existing.length === 0) return NextResponse.json({ message: 'Address not found' }, { status: 404 });
        if (existing[0].user_id !== decodedToken.uid) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

        await neonSql`DELETE FROM user_addresses WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[Address DELETE] Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
