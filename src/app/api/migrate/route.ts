import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        console.log('Reading schema.sql...');
        const schemaPath = path.join(process.cwd(), 'src/lib/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        // postgres.js supports multiple statements in one call.
        await sql.unsafe(schema);

        return NextResponse.json({ message: 'Database initialized successfully!' });
    } catch (err: any) {
        console.error('Migration failed:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
