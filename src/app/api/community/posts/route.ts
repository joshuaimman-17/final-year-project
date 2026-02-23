import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { supabaseStorage } from '@/lib/supabase';
import { appendPostToSheet } from '@/lib/googleSheets';

import { verifyAuth } from '@/lib/authHelper';

export async function GET(req: NextRequest) {
    try {
        const decodedToken = await verifyAuth(req);
        const userId = decodedToken?.uid || null;

        const posts = await sql`
            SELECT p.*, 
                   (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
                   (CASE WHEN ${userId} IS NOT NULL THEN 
                        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ${userId})
                    ELSE false END) as liked
            FROM community_posts p
            ORDER BY p.created_at DESC
        `;

        const formattedPosts = posts.map(post => ({
            id: post.id,
            authorId: post.author_id,
            authorName: post.author_name,
            authorAvatar: post.author_avatar,
            content: post.content,
            imageUrl: post.image_url,
            storagePath: post.storage_path,
            likeCount: parseInt(post.like_count),
            commentCount: post.comment_count,
            liked: post.liked,
            createdAt: post.created_at
        }));

        return NextResponse.json(formattedPosts);
    } catch (error: any) {
        console.error('Fetch Community Posts Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const content = formData.get('content') as string;
        const authorId = formData.get('authorId') as string;
        const authorName = formData.get('authorName') as string;
        const authorAvatar = formData.get('authorAvatar') as string;
        const image = formData.get('image') as File | null;

        if (!content || !authorId) {
            return NextResponse.json({ message: 'Content and authorId are required' }, { status: 400 });
        }

        let imageUrl = '';
        let storagePath = '';

        if (image) {
            const fileName = `posts/${authorId}/${Date.now()}_${image.name}`;
            const uploadData = await supabaseStorage.upload(image, fileName);
            imageUrl = uploadData.url;
            storagePath = uploadData.path;
        }

        const [newPost] = await sql`
            INSERT INTO community_posts (
                author_id, author_name, author_avatar, content, image_url, storage_path
            ) VALUES (
                ${authorId}, ${authorName}, ${authorAvatar}, ${content}, ${imageUrl}, ${storagePath}
            )
            RETURNING *
        `;

        // Mirror to Google Sheets (Async)
        appendPostToSheet(newPost.id, authorName, content, imageUrl);

        return NextResponse.json({
            ...newPost,
            id: newPost.id,
            createdAt: newPost.created_at
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create Community Post Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
