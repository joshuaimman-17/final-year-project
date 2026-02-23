"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { EncryptionService } from '@/lib/encryption';
import ProtectedRoute from '@/components/ProtectedRoute';
import { auth } from '@/lib/firebase';

function ChatContent() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getValidToken = async () => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return null;
            return await currentUser.getIdToken(true); // Force refresh to be sure
        } catch (e) {
            console.error("Token retrieval failed", e);
            return null;
        }
    };

    // 1. Initialize Encryption Keys on Mount
    useEffect(() => {
        const initKeys = async () => {
            if (!EncryptionService.getLocalPublicKey()) {
                console.log("Generating E2E keys...");
                const { publicKeyBase64 } = await EncryptionService.generateKeyPair();

                // Register with backend
                const token = await getValidToken();
                if (!token) return;

                await fetch('/api/chat/keys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ publicKey: publicKeyBase64 })
                });
            }
        };
        initKeys();
        fetchConversations();
    }, []);

    // 2. Fetch Conversations
    const fetchConversations = async () => {
        try {
            const token = await getValidToken();
            if (!token) return;

            const res = await fetch('/api/chat/messages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            // In a real app, you'd group these by user and fetch profile details
            setConversations(data);
        } catch (e) {
            console.error("Failed to fetch conversations", e);
        }
    };

    // 3. Search Users
    useEffect(() => {
        const doSearch = async () => {
            if (search.length < 2) {
                setSearchResults([]);
                return;
            }
            const token = await getValidToken();
            if (!token) return;

            const res = await fetch(`/api/users/search?q=${search}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSearchResults(data.users || []);
        };
        const timer = setTimeout(doSearch, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // 4. Fetch Messages for Selected User
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            const token = await getValidToken();
            if (!token) return;

            const res = await fetch(`/api/chat/messages?otherUserId=${selectedUser.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            // Decrypt messages locally
            const decrypted = await Promise.all(data.map(async (msg: any) => {
                try {
                    const text = await EncryptionService.decrypt(msg.encrypted_content);
                    return { ...msg, text };
                } catch (e) {
                    return { ...msg, text: "[Unable to decrypt - encryption keys missing on this device]" };
                }
            }));

            setMessages(decrypted);
            scrollToBottom();
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Polling for new messages
        return () => clearInterval(interval);
    }, [selectedUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 5. Send Message
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        try {
            // Get recipient's public key
            const resKey = await fetch(`/api/chat/keys?userId=${selectedUser.id}`);
            const { publicKey } = await resKey.json();

            // Encrypt
            const encryptedContent = await EncryptionService.encrypt(newMessage, publicKey);

            // Send
            const token = await getValidToken();
            if (!token) {
                alert("Session expired. Please log in again.");
                return;
            }

            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    receiverId: selectedUser.id,
                    encryptedContent
                })
            });

            setNewMessage('');
            // Optimistic update
            setMessages(prev => [...prev, { sender_id: user?.id, text: newMessage, created_at: new Date() }]);
            scrollToBottom();
        } catch (e) {
            alert("Failed to send message: " + (e as any).message);
        }
    };

    return (
        <div className="min-vh-100 bg-white d-flex flex-column pb-5 overflow-hidden">
            <Header title={selectedUser ? selectedUser.full_name : "Messages"} showBack={!!selectedUser} />

            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                {!selectedUser ? (
                    <div className="p-3">
                        {/* Search */}
                        <div className="input-group mb-4 shadow-sm rounded-pill overflow-hidden border">
                            <span className="input-group-text bg-white border-0 ps-3">
                                <Icon name="search" className="text-muted" />
                            </span>
                            <input
                                type="text"
                                className="form-control border-0 shadow-none ps-1"
                                placeholder="Search by username..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mb-4 animate-fade-in">
                                <h6 className="text-muted small fw-bold px-2 mb-2">People</h6>
                                {searchResults.map(u => (
                                    <div
                                        key={u.id}
                                        className="d-flex align-items-center gap-3 p-2 hover-bg-light rounded-3 mb-2 cursor-pointer"
                                        onClick={() => { setSelectedUser(u); setSearch(''); setSearchResults([]); }}
                                    >
                                        <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                            {u.avatar_url ? <img src={u.avatar_url} className="rounded-circle w-100 h-100 object-fit-cover" /> : <span className="text-success small fw-bold">{u.full_name.charAt(0)}</span>}
                                        </div>
                                        <div>
                                            <p className="mb-0 fw-bold small d-flex align-items-center gap-1">
                                                {u.full_name}
                                                <span className="badge bg-light text-muted fw-normal" style={{ fontSize: '9px' }}>{u.role}</span>
                                            </p>
                                            <p className="text-muted mb-0" style={{ fontSize: '11px' }}>@{u.username}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Recent Conversations */}
                        <div className="animate-fade-in">
                            <h6 className="text-muted small fw-bold px-2 mb-2">Recent Chats</h6>
                            {conversations.length === 0 ? (
                                <div className="text-center py-5">
                                    <Icon name="chat_bubble_outline" className="display-4 text-muted opacity-25 mb-3" />
                                    <p className="text-muted small">No active conversations.<br />Search for a user to start chatting.</p>
                                </div>
                            ) : (
                                conversations.map(c => (
                                    <div key={c.id} className="d-flex align-items-center gap-3 p-3 border-bottom cursor-pointer hover-bg-light">
                                        <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                            <Icon name="person" className="text-success" />
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <p className="mb-0 fw-bold small">User ID: {c.sender_id === user?.id ? c.receiver_id : c.sender_id}</p>
                                                <span className="text-muted" style={{ fontSize: '10px' }}>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-muted mb-0 text-truncate small" style={{ maxWidth: '200px' }}>Encrypted message...</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="d-flex flex-column h-100">
                        {/* Messages Area */}
                        <main className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3 bg-light" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                            {messages.map((m, i) => {
                                const isMe = m.sender_id === user?.id;
                                return (
                                    <div key={i} className={`d-flex ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                        <div className={`p-3 rounded-4 shadow-sm small ${isMe ? 'bg-primary-green text-white rounded-bottom-end-0' : 'bg-white text-dark rounded-bottom-start-0'}`} style={{ maxWidth: '80%' }}>
                                            {m.text}
                                            <div className={`text-end mt-1 ${isMe ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '9px' }}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </main>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-top">
                            <form onSubmit={sendMessage} className="d-flex gap-2 align-items-center">
                                <button type="button" className="btn btn-link p-0 text-muted">
                                    <Icon name="add_circle" />
                                </button>
                                <input
                                    className="form-control rounded-pill bg-light border-0 py-2 px-4 shadow-none fs-6"
                                    placeholder="Type a secure message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary-green rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                    style={{ width: '40px', height: '40px' }}
                                    disabled={!newMessage.trim()}
                                >
                                    <Icon name="send" className="text-white fs-5" />
                                </button>
                            </form>
                            <div className="text-center mt-2">
                                <span className="text-muted" style={{ fontSize: '9px' }}>
                                    <Icon name="lock" style={{ fontSize: '10px' }} className="me-1" />
                                    End-to-end encrypted
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .hover-bg-light:hover { background-color: #f8f9fa; }
                .cursor-pointer { cursor: pointer; }
                .rounded-bottom-end-0 { border-bottom-right-radius: 0 !important; }
                .rounded-bottom-start-0 { border-bottom-left-radius: 0 !important; }
            `}</style>

            <BottomNav />
        </div>
    );
}

export default function ChatPage() {
    return (
        <ProtectedRoute>
            <ChatContent />
        </ProtectedRoute>
    );
}
