"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { PostCard } from '@/components/PostCard';
import { CreatePostModal } from '@/components/CreatePostModal';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function CommunityContent() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/community/posts');
            const data = await res.json();
            setPosts(data);
        } catch (error) {
            console.error('Failed to fetch community posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePostCreated = (newPost: any) => {
        setPosts(prev => [newPost, ...prev]);
    };

    return (
        <div className="min-vh-100 bg-light d-flex flex-column pb-5">
            <Header title="Community Feed" showBack={false} />

            <main className="flex-grow-1 w-100 mx-auto p-3 pt-4 animate-fade-in" style={{ maxWidth: '448px' }}>
                {/* Create Post Trigger */}
                <div className="card rounded-4 border-0 shadow-sm mb-4 p-3 d-flex flex-row align-items-center gap-3 transition-all hover-scale">
                    <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                        {user?.avatarUrl ? <img src={user.avatarUrl} className="rounded-circle w-100 h-100 object-fit-cover" alt="Me" /> : <span>{user?.full_name?.charAt(0)}</span>}
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-outline-light text-muted border border-secondary border-opacity-10 rounded-pill text-start ps-4 flex-grow-1 py-1"
                        style={{ backgroundColor: '#f3f6f8' }}
                    >
                        Start a post...
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-link p-0 text-primary d-flex align-items-center transition-all hover-scale"
                    >
                        <Icon name="image" className="fs-4" />
                    </button>
                </div>

                <div className="d-flex align-items-center justify-content-between mb-3 px-1">
                    <h2 className="h6 fw-bold mb-0">Recent Updates</h2>
                    <Icon name="tune" className="text-muted small" />
                </div>

                {/* Feed */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary-green" role="status"></div>
                        <p className="mt-2 text-muted small">Loading updates...</p>
                    </div>
                ) : (
                    <div className="d-grid gap-1">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                        {posts.length === 0 && (
                            <div className="text-center py-5 bg-white rounded-4 border border-dashed">
                                <Icon name="groups" className="display-4 text-muted opacity-25 mb-3" />
                                <p className="text-muted mb-0">No posts here yet. Start the conversation!</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {showCreateModal && (
                <CreatePostModal
                    onClose={() => setShowCreateModal(false)}
                    onPostCreated={handlePostCreated}
                />
            )}

            <BottomNav />
        </div>
    );
}

export default function CommunityPage() {
    return (
        <ProtectedRoute>
            <CommunityContent />
        </ProtectedRoute>
    );
}
