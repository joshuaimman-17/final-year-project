"use client";

import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { useAuth } from '@/context/AuthContext';

interface CreatePostModalProps {
    onClose: () => void;
    onPostCreated: (post: any) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('authorId', user.id || user._id || '');
            formData.append('authorName', user.full_name || user.username || 'Farmer');
            formData.append('authorAvatar', user.avatarUrl || '');
            if (image) {
                formData.append('image', image);
            }

            const res = await fetch('/api/community/posts', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to create post');

            const data = await res.json();
            onPostCreated(data);
            onClose();
        } catch (error) {
            console.error('Create Post Error:', error);
            alert('Failed to publish post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-4 shadow-lg w-100 mx-3 overflow-hidden" style={{ maxWidth: '448px' }}>
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                    <h3 className="h6 mb-0 fw-bold">Create Post</h3>
                    <button onClick={onClose} className="btn btn-link p-0 text-muted"><Icon name="close" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-3">
                    <div className="d-flex gap-2 mb-3">
                        <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                            {user?.avatarUrl ? <img src={user.avatarUrl} className="rounded-circle w-100 h-100 object-fit-cover" alt="Me" /> : <span>{user?.full_name?.charAt(0)}</span>}
                        </div>
                        <textarea
                            className="form-control border-0 shadow-none p-0 pt-1"
                            rows={4}
                            placeholder="What's growing on your farm? Share an update or ask a question..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            style={{ resize: 'none' }}
                            autoFocus
                        ></textarea>
                    </div>

                    {imagePreview && (
                        <div className="position-relative mb-3 rounded-3 overflow-hidden border">
                            <img src={imagePreview} alt="Preview" className="w-100 h-auto" style={{ maxHeight: '200px', objectFit: 'cover' }} />
                            <button
                                type="button"
                                onClick={() => { setImage(null); setImagePreview(null); }}
                                className="position-absolute top-0 end-0 m-2 btn btn-dark btn-sm rounded-circle p-1 opacity-75"
                                style={{ width: '24px', height: '24px', lineHeight: 1 }}
                            >
                                <Icon name="close" style={{ fontSize: '14px' }} />
                            </button>
                        </div>
                    )}

                    <div className="d-flex align-items-center justify-content-between gap-2 border-top pt-3 mt-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-light rounded-pill px-3 d-flex align-items-center gap-2 text-muted fw-medium small"
                        >
                            <Icon name="image" className="text-primary" />
                            Photo
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="d-none" />

                        <button
                            type="submit"
                            className="btn btn-primary-green rounded-pill px-4 fw-bold"
                            disabled={loading || !content.trim()}
                        >
                            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
