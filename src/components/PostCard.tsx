"use client";

import React, { useState } from 'react';
import { Icon } from './Icon';
import { useAuth } from '@/context/AuthContext';
import { CommentSection } from '@/components/CommentSection';

interface PostCardProps {
    post: any;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.liked || false);
    const [likeCount, setLikeCount] = useState<number>(post.likeCount || 0);
    const [showComments, setShowComments] = useState(false);

    const handleLike = async () => {
        const newLiked = !liked;
        const diff = newLiked ? 1 : -1;

        // Optimistic UI
        setLiked(newLiked);
        setLikeCount((prev: number) => prev + diff);

        try {
            await fetch(`/api/community/posts/${post.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: newLiked ? 'like' : 'unlike' })
            });
        } catch (error) {
            console.error('Failed to like post:', error);
            // Revert on failure
            setLiked(!newLiked);
            setLikeCount((prev: number) => prev - diff);
        }
    };

    return (
        <div className="card rounded-4 border-0 shadow-sm mb-3 overflow-hidden">
            <div className="card-body p-3">
                <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center me-2 overflow-hidden" style={{ width: '40px', height: '40px' }}>
                        {post.authorAvatar ? (
                            <img src={post.authorAvatar} alt={post.authorName} className="w-100 h-100 object-fit-cover" />
                        ) : (
                            <span className="fw-bold text-success">{post.authorName?.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h4 className="h6 mb-0 fw-bold">{post.authorName}</h4>
                        <span className="small text-muted">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <p className="card-text mb-3">{post.content}</p>

                {post.imageUrl && (
                    <div className="rounded-3 overflow-hidden mb-3 bg-light border">
                        <img src={post.imageUrl} alt="Post content" className="w-100 h-auto d-block" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                    </div>
                )}

                <div className="d-flex align-items-center gap-4 pt-2 border-top">
                    <button
                        onClick={handleLike}
                        className={`btn btn-link p-0 d-flex align-items-center gap-1 text-decoration-none transition-all ${liked ? 'text-danger' : 'text-muted'}`}
                    >
                        <Icon name="favorite" filled={liked} className={liked ? 'scale-up' : ''} />
                        <span className="small fw-bold">{likeCount}</span>
                    </button>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="btn btn-link p-0 d-flex align-items-center gap-1 text-decoration-none text-muted"
                    >
                        <Icon name="chat_bubble" />
                        <span className="small fw-bold">{post.commentCount || 0}</span>
                    </button>
                </div>
            </div>

            {showComments && (
                <div className="bg-light border-top p-3">
                    <CommentSection postId={post.id} />
                </div>
            )}

            <style jsx>{`
                .scale-up {
                    animation: scale 0.3s ease-in-out;
                }
                @keyframes scale {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};
