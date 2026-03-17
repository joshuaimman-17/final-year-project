require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NEON_DATABASE_URL);

async function healAdmin() {
    const ADMIN_EMAIL = 'ksdharanidharan2005@gmail.com';
    const FIREBASE_UID = 'c2U2eQH218eF8q6M9U9vOnR8h1G2';

    try {
        console.log('--- ADMIN ID HEALING ---');
        
        // 1. Check if UID already exists
        const usersByUid = await sql`SELECT * FROM users WHERE id = ${FIREBASE_UID}`;
        if (usersByUid.length > 0) {
            console.log('User with Firebase UID already exists in DB:', usersByUid[0]);
        } else {
            console.log('Firebase UID not found in DB users table.');
        }

        // 2. Check if email exists with wrong ID
        const usersByEmail = await sql`SELECT * FROM users WHERE email = ${ADMIN_EMAIL}`;
        if (usersByEmail.length > 0) {
            const user = usersByEmail[0];
            console.log('Found user by email. Current ID:', user.id);
            
            if (user.id !== FIREBASE_UID) {
                console.log('ID Mismatch detected. Healing...');
                
                // Update ID in users table
                // Note: If there are foreign keys, they might need updates too.
                // Based on previous sync logic, user_public_keys is one.
                
                await sql`UPDATE user_public_keys SET user_id = ${FIREBASE_UID} WHERE user_id = ${user.id}`;
                await sql`UPDATE users SET id = ${FIREBASE_UID}, role = 'ADMIN' WHERE id = ${user.id}`;
                
                console.log('ID Healed to:', FIREBASE_UID);
            } else {
                console.log('ID already matches Firebase UID.');
                if (user.role !== 'ADMIN') {
                   console.log('Correcting role to ADMIN...');
                   await sql`UPDATE users SET role = 'ADMIN' WHERE id = ${FIREBASE_UID}`;
                }
            }
        } else {
            console.log('No user found with email:', ADMIN_EMAIL);
            console.log('Creating admin user with correct ID...');
            await sql`INSERT INTO users (id, email, username, full_name, role, farm_name) 
                      VALUES (${FIREBASE_UID}, ${ADMIN_EMAIL}, 'admin', 'Admin User', 'ADMIN', 'Dr.Plant Admin')`;
        }

        console.log('--- HEALING COMPLETE ---');
    } catch (err) {
        console.error('Healing Error:', err);
    } finally {
        process.exit(0);
    }
}

healAdmin();
