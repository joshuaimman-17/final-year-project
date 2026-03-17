/**
 * Force the admin role in Neon Postgres for the admin email.
 * Run: node scripts/force-admin-role.js
 */
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const ADMIN_EMAIL = 'ksdharanidharan2005@gmail.com';
const sql = neon(process.env.NEON_DATABASE_URL);

async function forceAdminRole() {
    try {
        const result = await sql`
            UPDATE users SET role = 'ADMIN' WHERE email = ${ADMIN_EMAIL} RETURNING id, email, role
        `;
        if (result.length > 0) {
            console.log(`✅ Admin role set in Neon DB for: ${result[0].email}`);
            console.log(`   User ID: ${result[0].id} | Role: ${result[0].role}`);
        } else {
            console.log(`⚠️  No user found with email: ${ADMIN_EMAIL}`);
            console.log('   They may not have logged in yet. The role will be set automatically on next login.');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

forceAdminRole();
