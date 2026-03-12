"use client";

import React, { useState, useEffect, useRef } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { EncryptionService } from '@/lib/encryption';
import ProtectedRoute from '@/components/ProtectedRoute';
import { auth } from '@/lib/firebase';
import { io, Socket } from 'socket.io-client';

// ─── Key helpers ─────────────────────────────────────────────────────────────
/**
 * Returns the effective current user ID in the same format the server stores
 * sender_id (phone_number || uid). We primarily use uid here for comparison,
 * but we TRY BOTH payloads so a mismatch never causes a silent failure.
 */
function getCurrentUserId(): string | null {
    const u = auth.currentUser;
    if (!u) return null;
    // prefer phoneNumber (matches server logic: phone_number || uid)
    return u.phoneNumber || u.uid;
}

// ─── Decryption ───────────────────────────────────────────────────────────────
/**
 * Tries to decrypt a message by attempting BOTH forSender and forReceiver
 * payloads. This is intentionally tolerant because the stored sender_id may
 * differ from auth.currentUser.uid (e.g. phone-registered users).
 *
 * Priority: use isMe hint but always fall back to the other payload.
 */
async function decryptMessage(msg: any, currentUserId: string | null): Promise<string> {
    if (!msg.encrypted_content) return "[Empty message]";

    // ── Try structured {forSender, forReceiver} format first ─────────────────
    if (msg.encrypted_content.trim().startsWith('{')) {
        let parsed: any;
        try {
            parsed = JSON.parse(msg.encrypted_content);
        } catch {
            // Not valid JSON – fall through to raw decrypt below
            parsed = null;
        }

        if (parsed && (parsed.forSender || parsed.forReceiver)) {
            const senderId = String(msg.sender_id ?? '');
            const uid = String(currentUserId ?? '');
            const isMe = uid !== '' && senderId === uid;

            // Order the attempts: primary first, fallback second
            const attempts = isMe
                ? [parsed.forSender, parsed.forReceiver]
                : [parsed.forReceiver, parsed.forSender];

            for (const payload of attempts) {
                if (!payload) continue;
                try {
                    const text = await EncryptionService.decrypt(payload);
                    if (text) return text;
                } catch (e) {
                    console.warn('[Chat] Decrypt attempt failed, trying other payload…', e);
                }
            }

            // Last resort - try every available payload
            const allPayloads = [parsed.forSender, parsed.forReceiver].filter(Boolean);
            for (const payload of allPayloads) {
                try {
                    const text = await EncryptionService.decrypt(payload);
                    if (text) return text;
                } catch { }
            }

            console.error('[Chat] All structured decrypt attempts failed for message:', msg.id);
            return "[Message not available on this device]";
        }
    }

    // ── Raw/legacy base64 format ──────────────────────────────────────────────
    try {
        const text = await EncryptionService.decrypt(msg.encrypted_content);
        if (text) return text;
    } catch (e) {
        console.error('[Chat] Raw decrypt failed:', e);
    }

    return "[Unable to decrypt]";
}

// ─── Component ────────────────────────────────────────────────────────────────
function ChatContent() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [keysReady, setKeysReady] = useState(false);
    const [recipientKeyMissing, setRecipientKeyMissing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [mounted, setMounted] = useState(false);

    const getValidToken = async (): Promise<string | null> => {
        try {
            const u = auth.currentUser;
            if (!u) return null;
            return await u.getIdToken(true);
        } catch (e) {
            console.error("[Chat] Token error", e);
            return null;
        }
    };

    // ── 1. Init E2E keys ──────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            if (!EncryptionService.getLocalPublicKey()) {
                console.log("[Chat] Generating E2E key pair…");
                const { publicKeyBase64 } = await EncryptionService.generateKeyPair();
                const token = await getValidToken();
                if (token) {
                    await fetch('/api/chat/keys', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ publicKey: publicKeyBase64 }),
                    });
                }
            }
            setKeysReady(true);
        };
        init();
        fetchAllUsers();
        setMounted(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── 2. Fetch users ────────────────────────────────────────────────────────
    const fetchAllUsers = async () => {
        const token = await getValidToken();
        if (!token) return;
        try {
            const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.users && Array.isArray(data.users)) {
                const myId = getCurrentUserId() || user?.id;
                setAllUsers(data.users.filter((u: any) => u.id !== myId));
            }
        } catch (e) {
            console.error("[Chat] Failed to fetch users", e);
        }
    };

    // ── 3. Search filter ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!search.trim()) { setSearchResults([]); return; }
        const q = search.toLowerCase();
        setSearchResults(allUsers.filter(u =>
            u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q)
        ));
    }, [search, allUsers]);

    // ── 4. Load messages + socket when user selected ─────────────────────────
    useEffect(() => {
        let sock: Socket | null = null;
        if (!selectedUser) return;

        setRecipientKeyMissing(false);

        const setupChat = async () => {
            const token = await getValidToken();
            if (!token) return;
            const myId = getCurrentUserId();

            // Socket
            sock = io();
            setSocket(sock);
            sock.on('connect', () => sock?.emit('register', myId));
            sock.on('receive_message', async (msg: any) => {
                if (msg.sender_id === selectedUser.id || msg.receiver_id === selectedUser.id) {
                    const text = await decryptMessage(msg, myId);
                    setMessages(prev => [...prev, { ...msg, text }]);
                    scrollToBottom();
                }
            });

            // Fetch history
            try {
                const res = await fetch(`/api/chat/messages?otherUserId=${selectedUser.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data: any[] = await res.json();
                const decrypted = await Promise.all(
                    data.map(async (msg) => ({ ...msg, text: await decryptMessage(msg, myId) }))
                );
                setMessages(decrypted);
                scrollToBottom();
            } catch (e) {
                console.error("[Chat] Failed to load messages", e);
            }
        };

        setupChat();
        return () => { sock?.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUser]);

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    };

    // ── 5. Auto-resize textarea ───────────────────────────────────────────────
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
        }
    };

    // ── 6. Send message ───────────────────────────────────────────────────────
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || sending) return;

        setSending(true);
        setRecipientKeyMissing(false);

        try {
            // Fetch recipient's public key
            const keyRes = await fetch(`/api/chat/keys?userId=${selectedUser.id}`);
            if (!keyRes.ok) {
                setRecipientKeyMissing(true);
                setSending(false);
                return;
            }
            const { publicKey: recipientPublicKey } = await keyRes.json();
            if (!recipientPublicKey) {
                setRecipientKeyMissing(true);
                setSending(false);
                return;
            }

            const senderPublicKey = EncryptionService.getLocalPublicKey();
            if (!senderPublicKey) {
                alert("Your encryption keys are missing. Please refresh the page.");
                setSending(false);
                return;
            }

            const [forReceiver, forSender] = await Promise.all([
                EncryptionService.encrypt(newMessage, recipientPublicKey),
                EncryptionService.encrypt(newMessage, senderPublicKey),
            ]);
            const encryptedContent = JSON.stringify({ forSender, forReceiver });

            const token = await getValidToken();
            if (!token) { alert("Session expired. Please log in again."); setSending(false); return; }

            const res = await fetch('/api/chat/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ receiverId: selectedUser.id, encryptedContent }),
            });
            if (!res.ok) throw new Error("Server error saving message");

            const savedMessage = await res.json();

            if (socket?.connected) {
                socket.emit('send_message', { receiverId: selectedUser.id, messagePayload: savedMessage });
            }

            const myId = getCurrentUserId();
            setMessages(prev => [...prev, {
                id: savedMessage.id || Date.now().toString(),
                sender_id: myId,
                receiver_id: selectedUser.id,
                text: newMessage,
                created_at: new Date().toISOString(),
            }]);
            setNewMessage('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            scrollToBottom();
        } catch (e: any) {
            console.error("[Chat] Send failed:", e);
            alert("Failed to send: " + e.message);
        } finally {
            setSending(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const formatTime = (ts: any) => {
        try {
            const d = new Date(ts);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    };

    const getAvatar = (u: any, size = 40) => {
        if (u?.avatar_url) {
            return <img src={u.avatar_url} alt="" className="rounded-circle object-fit-cover" style={{ width: size, height: size }} />;
        }
        const letter = u?.full_name?.charAt(0) || u?.username?.charAt(0) || '?';
        return (
            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white bg-success"
                style={{ width: size, height: size, fontSize: size * 0.4 }}>
                {letter.toUpperCase()}
            </div>
        );
    };

    const myId = getCurrentUserId();

    // ─────────────────────────────────────────────────────────────────────────
    const displayList = search.trim() ? searchResults : allUsers;

    if (!mounted) return null;

    return (
        <div className={`chat-page-container ${selectedUser ? 'chat-active' : ''}`} style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
            backgroundColor: '#f0f5f1',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
            {/* ── HEADER ── */}
            <header style={{
                background: 'linear-gradient(135deg, #1a6b3a 0%, #27ae60 100%)',
                color: '#fff',
                padding: '0 16px',
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                boxShadow: '0 2px 12px rgba(26,107,58,0.25)',
                zIndex: 10,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {selectedUser ? (
                        <button onClick={() => setSelectedUser(null)}
                            style={{ background: 'none', border: 'none', color: '#fff', padding: 4, cursor: 'pointer', display: 'flex' }}>
                            <Icon name="arrow_back" style={{ fontSize: 22 }} />
                        </button>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.2)', borderRadius: 10,
                                width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Icon name="psychiatry" style={{ fontSize: 20 }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>Dr. Plant</div>
                                <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: 1 }}>MESSAGES</div>
                            </div>
                        </div>
                    )}

                    {selectedUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {getAvatar(selectedUser, 36)}
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedUser.full_name || selectedUser.username}</div>
                                <div style={{ fontSize: 11, opacity: 0.75, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a8ffce' }} />
                                    Active
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    {!selectedUser && (
                        <div style={{
                            background: 'rgba(255,255,255,0.15)', borderRadius: 20,
                            padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5
                        }}>
                            <Icon name="lock" style={{ fontSize: 13 }} />
                            E2E Encrypted
                        </div>
                    )}
                </div>
            </header>

            {/* ── BODY ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── LEFT: Contact List (always visible on md+, hidden when chat open on mobile) ── */}
                <div style={{
                    width: selectedUser ? 0 : '100%',
                    maxWidth: 380,
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#fff',
                    borderRight: '1px solid #e8f0ea',
                    overflow: 'hidden',
                    transition: 'width 0.2s',
                    flexShrink: 0,
                }} className="chat-sidebar">

                    {/* Search bar */}
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f5f1' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: '#f0f5f1', borderRadius: 12, padding: '8px 14px'
                        }}>
                            <Icon name="search" style={{ fontSize: 18, color: '#888' }} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search farmers, experts…"
                                style={{
                                    border: 'none', background: 'none', outline: 'none',
                                    fontSize: 14, color: '#333', flex: 1
                                }}
                            />
                        </div>
                    </div>

                    {/* User list */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {displayList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa' }}>
                                <Icon name="people" style={{ fontSize: 40, marginBottom: 8, display: 'block' }} />
                                <div style={{ fontSize: 14 }}>{search ? 'No results found' : 'No contacts yet'}</div>
                            </div>
                        ) : (
                            <>
                                <div style={{ padding: '8px 16px 4px', fontSize: 11, color: '#888', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                                    {search ? 'Search Results' : 'Contacts'}
                                </div>
                                {displayList.map(u => (
                                    <button key={u.id} onClick={() => setSelectedUser(u)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            width: '100%', padding: '12px 16px',
                                            border: 'none', background: selectedUser?.id === u.id ? '#f0faf3' : 'transparent',
                                            cursor: 'pointer', borderLeft: selectedUser?.id === u.id ? '3px solid #27ae60' : '3px solid transparent',
                                            transition: 'all 0.15s',
                                            textAlign: 'left',
                                        }}>
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            {getAvatar(u, 46)}
                                            <div style={{
                                                position: 'absolute', bottom: 2, right: 2,
                                                width: 10, height: 10, borderRadius: '50%',
                                                background: '#27ae60', border: '2px solid #fff'
                                            }} />
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, color: '#1a2e1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {u.full_name || u.username}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>
                                                @{u.username} · {u.role || 'User'}
                                            </div>
                                        </div>
                                        <Icon name="chevron_right" style={{ fontSize: 18, color: '#ccc' }} />
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Chat Panel ── */}
                {!selectedUser ? (
                    /* Empty state on desktop */
                    <div className="d-none d-md-flex" style={{
                        flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: '#f8fdf9', color: '#888', gap: 12
                    }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Icon name="forum" style={{ fontSize: 40, color: '#4caf50' }} />
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#2d5a3d' }}>Select a conversation</div>
                        <div style={{ fontSize: 14, maxWidth: 280, textAlign: 'center', lineHeight: 1.6 }}>
                            Connect with farmers and agricultural experts. All chats are end-to-end encrypted.
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: '#e8f5e9', borderRadius: 20, padding: '6px 14px',
                            fontSize: 12, color: '#2e7d32'
                        }}>
                            <Icon name="verified_user" style={{ fontSize: 14 }} />
                            Dr. Plant E2E Encryption Active
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                        {/* ── Recipient key warning ── */}
                        {recipientKeyMissing && (
                            <div style={{
                                background: '#fff3e0', padding: '8px 16px', fontSize: 13,
                                color: '#e65100', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
                            }}>
                                <Icon name="warning" style={{ fontSize: 16 }} />
                                Recipient hasn&apos;t set up encryption keys yet. Ask them to open the chat page first.
                            </div>
                        )}

                        {/* ── Messages area ── */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            background: '#f4f9f5',
                            backgroundImage: `
                                radial-gradient(circle at 20% 80%, rgba(39,174,96,0.04) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, rgba(39,174,96,0.04) 0%, transparent 50%)
                            `,
                        }}>
                            {/* E2E badge */}
                            <div style={{
                                textAlign: 'center', padding: '8px 0 16px',
                                fontSize: 12, color: '#888',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                            }}>
                                <Icon name="lock" style={{ fontSize: 14, color: '#4caf50' }} />
                                End-to-end encrypted · Dr. Plant
                            </div>

                            {messages.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                                    <Icon name="chat_bubble_outline" style={{ fontSize: 40, color: '#ccc' }} />
                                    <div style={{ fontSize: 14, color: '#aaa' }}>
                                        Start a conversation with {selectedUser.full_name || selectedUser.username}
                                    </div>
                                </div>
                            ) : (
                                messages.map((m, i) => {
                                    const isMe = String(m.sender_id) === String(myId);
                                    const showAvatar = !isMe && (i === 0 || messages[i - 1]?.sender_id !== m.sender_id);
                                    const keyId = m.id ? `${m.id}-${i}` : `msg-${i}`;

                                    return (
                                        <div key={keyId} style={{
                                            display: 'flex',
                                            flexDirection: isMe ? 'row-reverse' : 'row',
                                            alignItems: 'flex-end',
                                            gap: 8,
                                            marginBottom: 4,
                                        }}>
                                            {/* Avatar for receiver */}
                                            {!isMe && (
                                                <div style={{ width: 28, flexShrink: 0, marginBottom: 2 }}>
                                                    {showAvatar ? getAvatar(selectedUser, 28) : null}
                                                </div>
                                            )}

                                            <div style={{ maxWidth: '72%' }}>
                                                {/* Bubble */}
                                                <div style={{
                                                    padding: '10px 14px',
                                                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    background: isMe
                                                        ? 'linear-gradient(135deg, #2ecc71, #27ae60)'
                                                        : '#ffffff',
                                                    color: isMe ? '#fff' : '#1a2e1e',
                                                    fontSize: 14,
                                                    lineHeight: 1.5,
                                                    wordBreak: 'break-word',
                                                    whiteSpace: 'pre-wrap',
                                                    boxShadow: isMe
                                                        ? '0 2px 8px rgba(39,174,96,0.25)'
                                                        : '0 1px 6px rgba(0,0,0,0.07)',
                                                    border: isMe ? 'none' : '1px solid #e8f0ea',
                                                }}>
                                                    {m.text}
                                                </div>
                                                {/* Timestamp */}
                                                <div style={{
                                                    fontSize: 11, color: '#999', marginTop: 3,
                                                    display: 'flex', alignItems: 'center', gap: 3,
                                                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                                                }}>
                                                    {formatTime(m.created_at)}
                                                    {isMe && <Icon name="done_all" style={{ fontSize: 13, color: '#4caf50' }} />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Input bar ── */}
                        <div style={{
                            background: '#fff',
                            borderTop: '1px solid #e8f0ea',
                            padding: '10px 12px',
                            flexShrink: 0,
                        }}>
                            <form onSubmit={sendMessage} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                                <div style={{
                                    flex: 1, display: 'flex', alignItems: 'flex-end',
                                    background: '#f4f9f5', borderRadius: 20,
                                    border: '1.5px solid #d4e8d9', padding: '8px 14px',
                                    gap: 8,
                                }}>
                                    <textarea
                                        ref={textareaRef}
                                        value={newMessage}
                                        onChange={handleTextareaChange}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage(e as any);
                                            }
                                        }}
                                        placeholder="Type a message…"
                                        rows={1}
                                        style={{
                                            flex: 1, border: 'none', background: 'none', outline: 'none',
                                            fontSize: 14, resize: 'none', maxHeight: 120,
                                            color: '#1a2e1e', lineHeight: 1.5,
                                            fontFamily: 'inherit',
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    style={{
                                        width: 46, height: 46,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: newMessage.trim()
                                            ? 'linear-gradient(135deg, #2ecc71, #27ae60)'
                                            : '#e0e0e0',
                                        color: '#fff',
                                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.2s',
                                        boxShadow: newMessage.trim() ? '0 3px 12px rgba(39,174,96,0.4)' : 'none',
                                    }}
                                >
                                    {sending
                                        ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        : <Icon name="send" style={{ fontSize: 20, marginLeft: 2 }} />
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom nav — hide it when a chat is open on mobile */}
            <div className={selectedUser ? 'd-none d-md-block' : 'd-block'}>
                <BottomNav />
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                * { box-sizing: border-box; }

                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .chat-sidebar { transition: width 0.25s ease; }
                
                .chat-page-container {
                    padding-bottom: 64px; /* space for bottom nav */
                }
                @media (max-width: 767px) {
                    .chat-page-container.chat-active {
                        padding-bottom: 0px; /* bottom nav hidden on mobile when chat active */
                    }
                }

                /* On md+, sidebar is fixed-width and chat always visible */
                @media (min-width: 768px) {
                    .chat-sidebar {
                        width: 340px !important;
                        display: flex !important;
                    }
                }

                /* Scrollbar */
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(39,174,96,0.25); border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(39,174,96,0.5); }
            `}</style>
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
