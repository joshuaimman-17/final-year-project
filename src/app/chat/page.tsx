"use client";

import React, { useState, useEffect, useRef } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { EncryptionService } from '@/lib/encryption';
import ProtectedRoute from '@/components/ProtectedRoute';
import { auth } from '@/lib/firebase';
import { io, Socket } from 'socket.io-client';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';

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

    // ── 1. Structured JSON check ─────────────────────────────────────────────
    if (msg.encrypted_content.trim().startsWith('{')) {
        let parsed: any;
        try {
            parsed = JSON.parse(msg.encrypted_content);
        } catch {
            return "[Invalid message format]";
        }

        // ── Unencrypted Fallback (v3) ──
        if (parsed.v === 3 && parsed.unencrypted) {
            return parsed.content;
        }

        const senderId = String(msg.sender_id ?? '');
        const receiverId = String(msg.receiver_id ?? '');
        const uid = String(currentUserId ?? '');
        
        // Robust isMe check: if current user is either the recorded sender or recorded receiver
        const isMeSender = uid !== '' && senderId === uid;
        const isMeReceiver = uid !== '' && receiverId === uid;

        // Try both slots: forSender and forReceiver
        // We prioritize the slot that "should" be ours, but ALWAYS fall back.
        const primarySlot = isMeSender ? parsed.forSender : (isMeReceiver ? parsed.forReceiver : parsed.forReceiver);
        const secondarySlot = isMeSender ? parsed.forReceiver : (isMeReceiver ? parsed.forSender : parsed.forSender);

        const slots = [primarySlot, secondarySlot].filter(Boolean);

        for (const slot of slots) {
            // v2 Hybrid payload format: { v: 2, iv, ct, forSender, forReceiver }
            try {
                const decryptArg = (parsed.v === 2) 
                    ? { v: 2, iv: parsed.iv, ct: parsed.ct, encryptedKey: slot }
                    : slot; // Legacy RSA string payload

                const text = await EncryptionService.decrypt(decryptArg, uid || undefined);
                if (text !== null) return text;
            } catch (e) {
                // Continue to next slot
            }
        }

        return "[Unable to decrypt on this device]";
    }

    // ── Raw/legacy base64 format ──────────────────────────────────────────────
    try {
        const text = await EncryptionService.decrypt(msg.encrypted_content, currentUserId || undefined);
        if (text !== null) return text;
    } catch (e) {
        console.error('[Chat] Raw decrypt failed:', e);
    }

    return "[Undecryptable metadata]";
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
    
    // Recovery related state
    const [showRecoverySetup, setShowRecoverySetup] = useState(false);
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [recoveryPassphrase, setRecoveryPassphrase] = useState('');
    const [recoveryError, setRecoveryError] = useState('');
    const [restoring, setRestoring] = useState(false);
    const [serverHasBackup, setServerHasBackup] = useState(false);
    const [pendingKeyGeneration, setPendingKeyGeneration] = useState<any>(null);
    const { showToast } = useToast();

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
            const myId = getCurrentUserId();
            if (!myId) return;

            // 1. Check if keys exist locally
            const localPublicKey = EncryptionService.getLocalPublicKey(myId);
            
            // 2. Fetch server key info
            try {
                const token = await getValidToken();
                if (!token) return;

                const params = new URLSearchParams({ userId: myId });
                const res = await fetch(`/api/chat/keys?${params.toString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.publicKey) {
                    if (localPublicKey) {
                        if (localPublicKey !== data.publicKey) {
                            console.warn("[Chat] Local and server keys mismatch!");
                            showToast("Encryption key mismatch. Old messages might be undecryptable until you Restore.", "warning");
                        }
                    } else {
                        // Keys missing locally but exist on server -> Trigger Restore flow
                        setShowRestoreModal(true);
                    }
                    setServerHasBackup(!!data.encryptedPrivateKey);

                    // Check if we need to backup locally existing keys
                    if (localPublicKey === data.publicKey && !data.encryptedPrivateKey) {
                        // We have the keys, but server doesn't have a backup.
                        // We need to get the actual private key Base64 to set as pending
                        const priv = localStorage.getItem(`drplant_chat_priv_${myId}`);
                        if (priv) {
                            setPendingKeyGeneration({
                                publicKeyBase64: localPublicKey,
                                privateKeyBase64: priv
                            });
                            setShowRecoverySetup(true);
                        }
                    }
                }
            } catch (e) {
                console.error("[Chat] Init failed", e);
            }
            
            setKeysReady(true);
        };

        const generateNewKeysFlow = async () => {
            console.log("[Chat] Preparing new key pair…");
            const keys = await EncryptionService.generateKeyPair();
            setPendingKeyGeneration(keys);
            setShowRecoverySetup(true);
        };

        init();
        fetchAllUsers();
        setMounted(true);
    }, []);

    const handleRestore = async () => {
        if (!recoveryPassphrase.trim()) return;
        setRestoring(true);
        setRecoveryError('');
        try {
            const myId = getCurrentUserId();
            const token = await getValidToken();
            const params = new URLSearchParams({ userId: myId || '' });
            const res = await fetch(`/api/chat/keys?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { publicKey, encryptedPrivateKey } = await res.json();
            
            const privateKey = await EncryptionService.decryptPrivateKey(encryptedPrivateKey, recoveryPassphrase);
            EncryptionService.storeKeys(publicKey, privateKey, myId || undefined);
            setShowRestoreModal(false);
            window.location.reload(); // Refresh to re-load messages with new keys
        } catch (e: any) {
            setRecoveryError(e.message || "Failed to restore keys");
        } finally {
            setRestoring(false);
        }
    };

    const handleSetupRecovery = async () => {
        if (!recoveryPassphrase.trim() || !pendingKeyGeneration) return;
        setRestoring(true);
        try {
            const encryptedPriv = await EncryptionService.encryptPrivateKey(
                pendingKeyGeneration.privateKeyBase64, 
                recoveryPassphrase
            );
            const token = await getValidToken();
            await fetch('/api/chat/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    publicKey: pendingKeyGeneration.publicKeyBase64,
                    encryptedPrivateKey: encryptedPriv
                }),
            });
            setShowRecoverySetup(false);
            setRecoveryPassphrase('');
        } catch (e) {
            console.error("[Chat] Setup recovery failed", e);
            alert("Failed to set up recovery. Keys stored locally only.");
            setShowRecoverySetup(false);
        } finally {
            setRestoring(false);
        }
    };

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
            const myId = getCurrentUserId();
            const token = await getValidToken();

            // Proactive check for recipient encryption status (Encoded)
            try {
                const params = new URLSearchParams({ userId: selectedUser.id });
                const keyRes = await fetch(`/api/chat/keys?${params.toString()}`);
                if (!keyRes.ok) {
                    setRecipientKeyMissing(true);
                } else {
                    const kd = await keyRes.json();
                    if (!kd.publicKey) setRecipientKeyMissing(true);
                }
            } catch (e) {
                console.error("[Chat] Recipient key check failed", e);
            }

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

                // Check if we should nudge for recovery (Encoded)
                if (decrypted.some(m => m.text === "[Unable to decrypt on this device]")) {
                    const myId = getCurrentUserId();
                    const params = new URLSearchParams({ userId: myId || '' });
                    const res = await fetch(`/api/chat/keys?${params.toString()}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.encryptedPrivateKey && EncryptionService.getLocalPublicKey() !== data.publicKey) {
                        showToast("You have encrypted messages you can't read. Click the Lock icon in header to Restore your history.", "info");
                    }
                }
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
            // Helper to handle unencrypted fallback
            const createUnencryptedPayload = (message: string) => {
                return JSON.stringify({ v: 3, unencrypted: true, content: message });
            };

            let encryptedContent = '';
            
            // Try fetching recipient's public key (Encoded)
            const params = new URLSearchParams({ userId: selectedUser.id });
            const keyRes = await fetch(`/api/chat/keys?${params.toString()}`);
            let recipientPublicKey = null;

            if (keyRes.ok) {
                const keyData = await keyRes.json();
                recipientPublicKey = keyData.publicKey;
            }

            if (!recipientPublicKey) {
                setRecipientKeyMissing(true);
            }

            const myId = getCurrentUserId();
            const senderPublicKey = EncryptionService.getLocalPublicKey(myId || undefined);
            
            if (recipientPublicKey && senderPublicKey) {
                // Version 2: Hybrid Encryption (Handles both recipient and sender keys in one JSON)
                encryptedContent = await EncryptionService.encrypt(
                    newMessage, 
                    recipientPublicKey, 
                    senderPublicKey
                );
            } else {
                // Fallback Version 3: Unencrypted Payload format
                encryptedContent = createUnencryptedPayload(newMessage);
            }

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
            background: 'linear-gradient(135deg, #f0f7f2 0%, #e8f0ea 100%)',
            fontFamily: "'Inter', -apple-system, sans-serif",
            overflow: 'hidden'
        }}>
            {/* ── HEADER ── */}
            <header style={{
                background: 'rgba(26, 107, 58, 0.95)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                padding: '0 24px',
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                zIndex: 100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {selectedUser ? (
                        <button onClick={() => setSelectedUser(null)}
                            style={{ 
                                background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', 
                                padding: 8, borderRadius: 12, cursor: 'pointer', display: 'flex',
                                transition: 'all 0.2s'
                            }} className="back-btn">
                            <Icon name="arrow_back" style={{ fontSize: 22 }} />
                        </button>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.2)', borderRadius: 14,
                                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <Icon name="psychiatry" style={{ fontSize: 24 }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1, letterSpacing: '-0.5px' }}>Dr. Plant</div>
                                <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: 1.5, fontWeight: 700 }}>SECURE CHAT</div>
                            </div>
                        </div>
                    )}

                    {selectedUser && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 6 }}>
                            {getAvatar(selectedUser, 40)}
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser.full_name || selectedUser.username}</div>
                                <div style={{ fontSize: 11, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 8px #2ecc71' }} />
                                    Online
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    {!selectedUser && (
                        <div style={{
                            background: 'rgba(255,255,255,0.12)', borderRadius: 24,
                            padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                            fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Icon name="verified_user" style={{ fontSize: 15, color: '#a8ffce' }} />
                            E2E Protected
                        </div>
                    )}
                    {keysReady && (
                        <button 
                            onClick={() => setShowRestoreModal(true)}
                            title="Encryption Settings / Restore"
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: 8, borderRadius: 12, cursor: 'pointer' }}
                        >
                            <Icon name="lock_reset" style={{ fontSize: 22 }} />
                        </button>
                    )}
                    <button style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.8, cursor: 'pointer' }}>
                        <Icon name="more_vert" style={{ fontSize: 24 }} />
                    </button>
                </div>
            </header>

            {/* ── BODY ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                
                <ChatSidebar 
                    users={displayList}
                    selectedUser={selectedUser}
                    onSelectUser={setSelectedUser}
                    search={search}
                    onSearchChange={setSearch}
                    getCurrentUserId={getCurrentUserId}
                />

                {/* ── MAIN CHAT AREA ── */}
                {!selectedUser ? (
                    <div className="d-none d-md-flex" style={{
                        flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', color: '#666', gap: 16,
                        animation: 'fadeIn 0.5s ease-out'
                    }}>
                        <div style={{
                            width: 100, height: 100, borderRadius: '32px',
                            background: 'rgba(255,255,255,0.6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.05)',
                            transform: 'rotate(-5deg)'
                        }}>
                            <Icon name="forum" style={{ fontSize: 48, color: '#27ae60' }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#1a2e1e', marginBottom: 8 }}>Your Greenhouse Chat</div>
                            <div style={{ fontSize: 15, maxWidth: 320, padding: '0 20px', color: '#555', lineHeight: 1.7, fontWeight: 500 }}>
                                Consult with experts, trade with farmers, and grow your network. All conversations are private and encrypted.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f4f9f5' }}>
                        {recipientKeyMissing && (
                            <div style={{
                                background: 'rgba(255, 248, 225, 0.9)',
                                backdropFilter: 'blur(8px)',
                                padding: '12px 24px',
                                fontSize: 13,
                                color: '#856404',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                borderBottom: '2px solid rgba(255, 193, 7, 0.3)',
                                fontWeight: 600,
                                animation: 'slideDown 0.4s ease-out'
                            }}>
                                <div style={{ 
                                    background: '#ffc107', color: '#fff', borderRadius: '50%', 
                                    width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' 
                                }}>
                                    <Icon name="priority_high" style={{ fontSize: 16 }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <b>Security Notice:</b> The recipient hasn&apos;t enabled encryption on their device yet. Messages sent will not be E2E encrypted.
                                </div>
                                <button 
                                    onClick={() => setRecipientKeyMissing(false)}
                                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.5 }}
                                >
                                    <Icon name="close" style={{ fontSize: 18 }} />
                                </button>
                            </div>
                        )}

                        {/* Messages Box */}
                        <div style={{
                            flex: 1, overflowY: 'auto', padding: '24px',
                            display: 'flex', flexDirection: 'column', gap: 4,
                            background: '#f4f9f5',
                            backgroundImage: `
                                radial-gradient(circle at 15% 15%, rgba(46, 204, 113, 0.05) 0%, transparent 40%),
                                radial-gradient(circle at 85% 85%, rgba(26, 107, 58, 0.05) 0%, transparent 40%)
                            `,
                        }} className="messages-container">
                            
                            <div style={{
                                textAlign: 'center', padding: '10px 0 30px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}>
                                <div style={{ height: 1, flex: 1, background: 'linear-gradient(to right, transparent, #d4e8d9)' }} />
                                <div style={{ 
                                    fontSize: 11, color: '#777', fontWeight: 700, letterSpacing: 1, 
                                    background: '#e8f0ea', padding: '4px 12px', borderRadius: 12,
                                    display: 'flex', alignItems: 'center', gap: 5
                                }}>
                                    <Icon name="lock" style={{ fontSize: 12, color: '#27ae60' }} />
                                    END-TO-END ENCRYPTED
                                </div>
                                <div style={{ height: 1, flex: 1, background: 'linear-gradient(to left, transparent, #d4e8d9)' }} />
                            </div>

                            {messages.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, opacity: 0.6 }}>
                                    <Icon name="auto_awesome" style={{ fontSize: 48, color: '#27ae60' }} />
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#2d5a3d' }}>
                                        Start your safe journey with {selectedUser.full_name || selectedUser.username}
                                    </div>
                                </div>
                            ) : (
                                messages.map((m, i) => {
                                    const isMe = String(m.sender_id) === String(myId);
                                    const showAvatar = !isMe && (i === 0 || messages[i - 1]?.sender_id !== m.sender_id);
                                    return (
                                        <MessageBubble 
                                            key={m.id || i}
                                            message={m}
                                            isMe={isMe}
                                            showAvatar={showAvatar}
                                            getAvatar={getAvatar}
                                            selectedUser={selectedUser}
                                            formatTime={formatTime}
                                            onRestoreRequest={() => setShowRestoreModal(true)}
                                        />
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <ChatInput 
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                if (textareaRef.current) {
                                    textareaRef.current.style.height = 'auto';
                                    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
                                }
                            }}
                            onSend={sendMessage}
                            sending={sending}
                        />
                    </div>
                )}
            </div>

            {/* Spacer for bottom nav - ensures content isn't covered by fixed BottomNav */}
            <div style={{ height: (selectedUser ? 0 : 70) }} className="d-md-none" />
            <div style={{ height: 70 }} className="d-none d-md-block" />

            {/* Bottom nav integration */}
            <div className={selectedUser ? 'd-none d-md-block' : 'd-block'}>
                <BottomNav />
            </div>

            {/* Recovery Modals */}
            {(showRecoverySetup || showRestoreModal) && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(26,46,30,0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
                }}>
                    <div style={{
                        background: '#fff', borderRadius: '32px', padding: '40px 32px', width: '100%', maxWidth: 420,
                        boxShadow: '0 24px 60px rgba(0,0,0,0.3)', textAlign: 'center',
                        animation: 'fadeUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <div style={{
                            width: 80, height: 80, background: '#e8f5e9', borderRadius: '24px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px', color: '#27ae60', transform: 'rotate(10deg)',
                            boxShadow: '0 8px 16px rgba(39,174,96,0.15)'
                        }}>
                            <Icon name={showRestoreModal ? "history" : "shield"} style={{ fontSize: 40 }} />
                        </div>
                        
                        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1a2e1e', marginBottom: 16, letterSpacing: '-0.5px' }}>
                            {showRestoreModal ? "Restore Chat History" : "Secure Your Greenhouse"}
                        </h3>
                        
                        <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 30, fontWeight: 500 }}>
                            {showRestoreModal 
                                ? (serverHasBackup 
                                    ? "Welcome back! Enter your recovery passphrase to sync your encrypted messages to this device."
                                    : "We found your encryption profile, but no backup exists. You'll need to Reset your keys to continue messaging.")
                                : "Protect your conversations. Create a recovery passphrase to access your messages if you switch phones or clear data."
                            }
                        </p>

                        <div style={{ textAlign: 'left', marginBottom: 24 }}>
                            <label style={{ fontSize: 12, fontWeight: 800, color: '#27ae60', display: 'block', marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 }}>
                                RECOVERY PASSPHRASE
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    value={recoveryPassphrase}
                                    onChange={e => setRecoveryPassphrase(e.target.value)}
                                    placeholder="Secret phrase..."
                                    style={{
                                        width: '100%', padding: '16px 20px', borderRadius: '16px',
                                        border: '2px solid #e8f0ea', outline: 'none', transition: 'all 0.2s',
                                        fontSize: 16, background: '#f9fbf9', fontWeight: 600
                                    }}
                                    onFocus={e => {
                                        e.currentTarget.style.borderColor = '#27ae60';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(39,174,96,0.1)';
                                    }}
                                    onBlur={e => {
                                        e.currentTarget.style.borderColor = '#e8f0ea';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            {recoveryError && (
                                <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 10, marginLeft: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <Icon name="error" style={{ fontSize: 16 }} />
                                    {recoveryError}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={showRestoreModal ? handleRestore : handleSetupRecovery}
                            disabled={!recoveryPassphrase.trim() || restoring || (showRestoreModal && !serverHasBackup)}
                            style={{
                                width: '100%', padding: '18px', borderRadius: '16px', border: 'none',
                                background: (showRestoreModal && !serverHasBackup) 
                                    ? '#eee' 
                                    : 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                                color: (showRestoreModal && !serverHasBackup) ? '#999' : '#fff', 
                                fontWeight: 800, cursor: (showRestoreModal && !serverHasBackup) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                                transition: 'all 0.3s', fontSize: 16,
                                opacity: (!recoveryPassphrase.trim() || restoring) ? 0.7 : 1,
                                boxShadow: (showRestoreModal && !serverHasBackup) ? 'none' : '0 8px 20px rgba(39,174,96,0.3)'
                            }}
                        >
                            {restoring ? (
                                <div style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            ) : (
                                <>
                                    <Icon name={showRestoreModal ? (serverHasBackup ? "sync" : "block") : "verified"} style={{ fontSize: 24 }} />
                                    {showRestoreModal ? (serverHasBackup ? "Restore Now" : "Backup Not Found") : "Enable Secure Recovery"}
                                </>
                            )}
                        </button>
                        {showRestoreModal && (
                            <button
                                onClick={() => {
                                    if(confirm("Are you sure? Without restoring, your previous messages will stay undecryptable. You will start a fresh session with new keys.")) {
                                        setShowRestoreModal(false);
                                        // Logic to discard server keys and generate new could go here, 
                                        // but usually we just let them try later.
                                    }
                                }}
                                style={{
                                    background: 'none', border: 'none', color: '#888', fontSize: 13,
                                    marginTop: 16, cursor: 'pointer', fontWeight: 500
                                }}
                            >
                                Skip and lose history
                            </button>
                        )}
                        
                        <button
                            onClick={async () => {
                                if(confirm("WARNING: This will permanently delete your existing encryption keys on the server. You will lose access to ALL previous messages, but you will be able to start fresh. Proceed?")) {
                                    setRestoring(true);
                                    try {
                                        const token = await getValidToken();
                                        // Clear server keys
                                        await fetch('/api/chat/keys', { 
                                            method: 'DELETE', 
                                            headers: { 'Authorization': `Bearer ${token}` } 
                                        });
                                        localStorage.removeItem('drplant_chat_priv');
                                        localStorage.removeItem('drplant_chat_pub');
                                        window.location.reload();
                                    } catch (e) {
                                        showToast("Failed to reset keys", "error");
                                    } finally {
                                        setRestoring(false);
                                    }
                                }
                            }}
                            style={{
                                background: 'none', border: 'none', color: '#ff4d4d', fontSize: 11,
                                marginTop: 8, cursor: 'pointer', fontWeight: 600, opacity: 0.8
                            }}
                        >
                            Reset Encryption Keys (Emergency Only)
                        </button>
                    </div>
                </div>
            )}
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
