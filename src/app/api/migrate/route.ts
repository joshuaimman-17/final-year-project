import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import neonSql from '@/lib/neon';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        console.log('Reading schema.sql...');
        const schemaPath = path.join(process.cwd(), 'src/lib/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema on Supabase...');
        // postgres.js supports multiple statements in one call.
        await sql.unsafe(schema);

        console.log('Initializing Chat tables on Neon...');
        // Neon serverless driver requires individual statements.
        await neonSql`DROP TABLE IF EXISTS chat_messages CASCADE`;
        await neonSql`DROP TABLE IF EXISTS user_public_keys CASCADE`;

        await neonSql`
            CREATE TABLE IF NOT EXISTS user_public_keys (
                user_id TEXT PRIMARY KEY,
                public_key TEXT NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;

        await neonSql`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                sender_id TEXT,
                receiver_id TEXT,
                encrypted_content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;

        return NextResponse.json({ message: 'Database initialized successfully on Supabase and Neon!' });
    } catch (err: any) {
        console.error('Migration failed:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
