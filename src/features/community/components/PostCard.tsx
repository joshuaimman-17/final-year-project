"use client";

import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/features/auth/context/AuthContext';
import { CommentSection } from '@/features/community/components/CommentSection';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface PostCardProps {
    post: any;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const { user } = useAuth();
    const router = useRouter();
    const [liked, setLiked] = useState(post.liked || false);
    const [likeCount, setLikeCount] = useState<number>(post.likeCount || 0);
    const [showComments, setShowComments] = useState(false);

    // Sync state with props to handle updates from the 2s polling
    React.useEffect(() => {
        setLiked(post.liked || false);
        setLikeCount(post.likeCount || 0);
    }, [post.liked, post.likeCount]);

    const handleAuthorClick = () => {
        if (post.authorId) {
            router.push(`/profile/${post.authorId}`);
        }
    };

    const handleLike = async () => {
        const newLiked = !liked;
        const diff = newLiked ? 1 : -1;

        // Optimistic UI
        setLiked(newLiked);
        setLikeCount((prev: number) => prev + diff);

        try {
            const token = await auth.currentUser?.getIdToken();
            await fetch(`/api/community/posts/${post.id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
                <div 
                    className="d-flex align-items-center mb-3 author-click-area" 
                    onClick={handleAuthorClick}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center me-2 overflow-hidden author-avatar" style={{ width: '40px', height: '40px' }}>
                        {post.authorAvatar ? (
                            <img src={post.authorAvatar} alt={post.authorName} className="w-100 h-100 object-fit-cover" />
                        ) : (
                            <span className="fw-bold text-success">{post.authorName?.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h4 className="h6 mb-0 fw-bold author-name">{post.authorName}</h4>
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
                .author-click-area:hover .author-name {
                    color: #198754 !important;
                    text-decoration: underline;
                }
                .author-click-area:hover .author-avatar {
                    transform: scale(1.05);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .author-avatar {
                    transition: all 0.2s ease;
                }
            `}</style>
        </div>
    );
};
