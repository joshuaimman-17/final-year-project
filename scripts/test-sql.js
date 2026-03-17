require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.NEON_DATABASE_URL);

async function test() {
    try {
        const userId = 'ksdharanidharan2005@gmail.com'; // or whatever the auth ID actually is!
        // Wait, what is the auth ID for email/password login? It's the UID, a random string!
        
        // Let's just fetch the user by email first
        let users = await sql`SELECT * FROM users WHERE email = 'ksdharanidharan2005@gmail.com'`;
        console.log("Found user:", users[0]);
        if (!users[0]) return;
        
        const existingUser = users[0];
        
        const new_full_name = 'Dharanidharan';
        const new_username = existingUser.username;
        const new_farm_name = existingUser.farm_name;
        const new_location = existingUser.location;
        const new_latitude = existingUser.latitude;
        const new_longitude = existingUser.longitude;
        const new_avatar_url = existingUser.avatar_url;
        const new_role = 'ADMIN';

        const updatedUsers = await sql`
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
        console.log("Updated user:", updatedUsers[0]);
    } catch (e) {
        console.error("SQL Error:", e);
    }
}
test();
