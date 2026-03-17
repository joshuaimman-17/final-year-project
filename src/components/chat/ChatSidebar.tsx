"use client";

import React from 'react';
import { Icon } from '@/components/Icon';

interface ChatSidebarProps {
    users: any[];
    selectedUser: any;
    onSelectUser: (user: any) => void;
    search: string;
    onSearchChange: (value: string) => void;
    getCurrentUserId: () => string | null;
    onViewProfile: (userId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    users,
    selectedUser,
    onSelectUser,
    search,
    onSearchChange,
    getCurrentUserId,
    onViewProfile
}) => {
    const getAvatar = (u: any, size = 46) => {
        const onClickAvatar = (e: React.MouseEvent) => {
            e.stopPropagation();
            onViewProfile(u.id);
        };

        if (u?.avatar_url) {
            return (
                <div onClick={onClickAvatar} style={{ cursor: 'pointer' }}>
                    <img src={u.avatar_url} alt="" className="rounded-circle object-fit-cover" style={{ width: size, height: size }} />
                </div>
            );
        }
        const letter = u?.full_name?.charAt(0) || u?.username?.charAt(0) || '?';
        return (
            <div 
                onClick={onClickAvatar}
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white bg-success"
                style={{ width: size, height: size, fontSize: size * 0.4, cursor: 'pointer' }}>
                {letter.toUpperCase()}
            </div>
        );
    };

    return (
        <div style={{
            width: selectedUser ? 0 : '100%',
            maxWidth: 380,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRight: '1px solid #e8f0ea',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
        }} className="chat-sidebar">
            {/* Search bar */}
            <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f5f1' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#f0f5f1', borderRadius: '16px', padding: '10px 16px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                }}>
                    <Icon name="search" style={{ fontSize: 20, color: '#888' }} />
                    <input
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Search conversations..."
                        style={{
                            border: 'none', background: 'none', outline: 'none',
                            fontSize: 15, color: '#1a2e1e', flex: 1,
                            fontWeight: 500
                        }}
                    />
                </div>
            </div>

            {/* User list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%', background: '#f0f5f1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <Icon name="chat_bubble_outline" style={{ fontSize: 32, color: '#ccc' }} />
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 500 }}>{search ? 'No results found' : 'No contacts yet'}</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>Search for farmers or experts to start.</div>
                    </div>
                ) : (
                    <>
                        <div style={{ 
                            padding: '8px 20px 12px', fontSize: 11, color: '#888', 
                            fontWeight: 800, letterSpacing: '1.2px', textTransform: 'uppercase' 
                        }}>
                            {search ? 'Search Results' : 'Recent Chats'}
                        </div>
                        {users.map(u => (
                            <button key={u.id} onClick={() => onSelectUser(u)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 14,
                                    width: '100%', padding: '14px 20px',
                                    border: 'none', 
                                    background: selectedUser?.id === u.id ? 'rgba(46, 204, 113, 0.08)' : 'transparent',
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left',
                                    position: 'relative'
                                }}>
                                {selectedUser?.id === u.id && (
                                    <div style={{
                                        position: 'absolute', left: 0, top: '15%', bottom: '15%',
                                        width: 4, background: '#27ae60', borderRadius: '0 4px 4px 0'
                                    }} />
                                )}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    {getAvatar(u, 50)}
                                    <div style={{
                                        position: 'absolute', bottom: 2, right: 2,
                                        width: 12, height: 12, borderRadius: '50%',
                                        background: '#27ae60', border: '2.5px solid #fff',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }} />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ 
                                        display: 'flex', justifyContent: 'space-between', 
                                        alignItems: 'baseline', marginBottom: 2 
                                    }}>
                                        <div style={{ 
                                            fontWeight: 700, fontSize: 15, color: '#1a2e1e', 
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            display: 'flex', alignItems: 'center', gap: 6
                                        }}>
                                            {u.full_name || u.username}
                                            <div 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    console.log(`[DEBUG] Profile Clicked for: ${u.id}`);
                                                    window.alert(`TRIGGERING PROFILE FOR: ${u.full_name || u.username}`);
                                                    onViewProfile(u.id); 
                                                }}
                                                style={{ color: '#27ae60', opacity: 0.6, cursor: 'pointer', padding: '4px' }}
                                                title="View Profile"
                                            >
                                                <Icon name="info" style={{ fontSize: 16 }} />
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 11, color: '#aaa' }}>12:45 PM</span>
                                    </div>
                                    <div style={{ 
                                        fontSize: 13, color: '#666', marginTop: 1,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        display: 'flex', alignItems: 'center', gap: 4
                                    }}>
                                        {u.role && <span style={{
                                            fontSize: 10, background: '#e8f5e9', color: '#2e7d32',
                                            padding: '1px 6px', borderRadius: 6, fontWeight: 700,
                                            textTransform: 'uppercase'
                                        }}>{u.role}</span>}
                                        <span>Click to start chat...</span>
                                    </div>
                                </div>
                                {u.unreadCount > 0 && (
                                    <div style={{
                                        background: '#27ae60', color: '#fff', borderRadius: '50%',
                                        width: 18, height: 18, fontSize: 10, fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 2px 6px rgba(39,174,96,0.3)'
                                    }}>
                                        {u.unreadCount}
                                    </div>
                                )}
                            </button>
                        ))}
                    </>
                )}
            </div>
            
            <style jsx>{`
                .chat-sidebar::-webkit-scrollbar {
                    width: 5px;
                }
                .chat-sidebar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .chat-sidebar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
                .chat-sidebar button:hover {
                    background: rgba(0,0,0,0.02);
                }
            `}</style>
        </div>
    );
};
