import { NextRequest, NextResponse } from 'next/server';
import neonSql from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const email = 'ksdharanidharan2005@gmail.com';
        const users = await neonSql`SELECT * FROM users WHERE email = ${email}`;
        if (users.length === 0) return NextResponse.json({ message: "not found" });
        
        const existingUser = users[0];
        
        const new_full_name = existingUser.full_name;
        const new_username = existingUser.username;
        const new_farm_name = existingUser.farm_name;
        const new_location = existingUser.location;
        const new_latitude = existingUser.latitude;
        const new_longitude = existingUser.longitude;
        const new_avatar_url = existingUser.avatar_url;
        const new_role = 'ADMIN';

        const updatedUsers = await neonSql`
            UPDATE users 
            SET 
                full_name = ${new_full_name},
                username = ${new_username},
                farm_name = ${new_farm_name},
                location = ${new_location},
                latitude = ${new_latitude},
                longitude = ${new_longitude},
                avatar_url = ${new_avatar_url},
                role = ${new_role}
            WHERE id = ${existingUser.id}
            RETURNING *
        `;

        return NextResponse.json({ success: true, user: updatedUsers[0] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack, code: err.code });
    }
}
