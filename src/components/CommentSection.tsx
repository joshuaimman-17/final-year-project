"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { useAuth } from '@/context/AuthContext';

interface Comment {
    id: string;
    postId: string;
    parentId: string | null;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    text: string;
    createdAt: string;
}

interface CommentSectionProps {
    postId: string;
    parentId?: string | null;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, parentId = null }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);

    const fetchComments = async () => {
        try {
            const url = `/api/community/comments?postId=${postId}${parentId ? `&parentId=${parentId}` : '&parentId=null'}`;
            const res = await fetch(url);
            const data = await res.json();
            setComments(data);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId, parentId]);

    const handleSubmit = async (e: React.FormEvent, customParentId: string | null = null) => {
        e.preventDefault();
        const text = customParentId ? newComment : newComment; // Placeholder logic
        if (!newComment.trim() || !user) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/community/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    parentId: customParentId || parentId,
                    authorId: user.id || user._id,
                    authorName: user.full_name || user.username,
                    authorAvatar: user.avatarUrl || '',
                    text: newComment
                })
            });
            const data = await res.json();

            // Update UI
            setComments(prev => [...prev, data]);
            setNewComment('');
            setReplyingTo(null);
        } catch (error) {
            console.error('Failed to post comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !parentId) return <div className="text-center py-2"><div className="spinner-border spinner-border-sm text-primary" role="status"></div></div>;

    return (
        <div className={parentId ? 'mt-3 ps-4 border-start' : ''}>
            {/* Comment Input */}
            {!parentId && (
                <form onSubmit={(e) => handleSubmit(e)} className="d-flex gap-2 mb-3">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="form-control form-control-sm rounded-pill border-0 shadow-none px-3 bg-white"
                        disabled={submitting}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary-green btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px' }}
                        disabled={submitting || !newComment.trim()}
                    >
                        <Icon name="send" style={{ fontSize: '16px' }} />
                    </button>
                </form>
            )}

            {/* Comments List */}
            <div className="d-grid gap-3">
                {comments.map(comment => (
                    <div key={comment.id} className="comment">
                        <div className="d-flex gap-2">
                            <div className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '30px', height: '30px' }}>
                                {comment.authorAvatar ? (
                                    <img src={comment.authorAvatar} alt={comment.authorName} className="w-100 h-100 rounded-circle object-fit-cover" />
                                ) : (
                                    <span className="small">{comment.authorName?.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-grow-1">
                                <div className="bg-white p-2 rounded-3 shadow-sm border-0 position-relative">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="small fw-bold">{comment.authorName}</span>
                                        <span className="text-muted" style={{ fontSize: '10px' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className="small">{comment.text}</span>
                                </div>

                                <div className="d-flex gap-3 mt-1 ps-1">
                                    <button
                                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                        className="btn btn-link p-0 text-decoration-none text-muted"
                                        style={{ fontSize: '11px' }}
                                    >
                                        Reply
                                    </button>
                                </div>

                                {replyingTo === comment.id && (
                                    <form onSubmit={(e) => handleSubmit(e, comment.id)} className="d-flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder={`Reply to ${comment.authorName}...`}
                                            className="form-control form-control-sm rounded-pill border-0 shadow-none px-3 bg-white"
                                            autoFocus
                                        />
                                        <button type="submit" className="btn btn-success btn-sm rounded-pill px-3" disabled={submitting}>Post</button>
                                    </form>
                                )}

                                {/* Recursive nested comments */}
                                <CommentSection postId={postId} parentId={comment.id} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {comments.length === 0 && !loading && !parentId && (
                <p className="text-center text-muted small my-2">No comments yet. Be the first!</p>
            )}
        </div>
    );
};
