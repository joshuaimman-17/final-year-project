import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { verifyAuth } from '@/lib/authHelper';

export async function GET() {
    try {
        const posts = await sql`SELECT * FROM posts ORDER BY created_at DESC`;
        return NextResponse.json(posts);
    } catch (err: any) {
        console.error('Fetch Posts Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const decodedToken = await verifyAuth(req);
    // Authentication is optional for posts in some cases, but usually required

    try {
        const body = await req.json();
        const { content, author_name, author_role, image_url, tags } = body;

        const authorName = author_name || decodedToken?.name || 'Anonymous';
        const authorRole = author_role || 'FARMER';
        const postTags = tags || [];

        const result = await sql`
            INSERT INTO posts (author_name, author_role, content, image_url, tags)
            VALUES (
                ${authorName}::text, 
                ${authorRole}::text, 
                ${content || null}::text, 
                ${image_url || null}::text, 
                ${postTags}
            )
            RETURNING *
        `;

        return NextResponse.json(result[0], { status: 201 });
    } catch (err: any) {
        console.error('Create Post Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
