"use client";

import React from 'react';
import { Icon } from '@/components/ui/Icon';

interface MessageBubbleProps {
    message: any;
    isMe: boolean;
    showAvatar: boolean;
    getAvatar: (u: any, size: number) => React.ReactNode;
    selectedUser: any;
    formatTime: (ts: any) => string;
    onRestoreRequest?: () => void;
    onViewProfile: (userId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isMe,
    showAvatar,
    getAvatar,
    selectedUser,
    formatTime,
    onRestoreRequest,
    onViewProfile
}) => {
    const isUndecryptable = message.text?.includes("Unable to decrypt");

    return (
        <div style={{
            display: 'flex',
            flexDirection: isMe ? 'row-reverse' : 'row',
            alignItems: 'flex-end',
            gap: 10,
            marginBottom: showAvatar ? 12 : 4,
            animation: 'fadeUp 0.3s ease-out'
        }}>
            {/* Avatar for receiver */}
            {!isMe && (
                <div 
                    style={{ width: 32, flexShrink: 0, marginBottom: 2, cursor: 'pointer' }}
                    onClick={() => onViewProfile(selectedUser.id)}
                >
                    {showAvatar ? getAvatar(selectedUser, 32) : null}
                </div>
            )}

            <div style={{ maxWidth: '75%', position: 'relative' }}>
                {/* Bubble */}
                <div style={{
                    padding: '12px 16px',
                    borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
                    background: isMe
                        ? 'linear-gradient(135deg, #27ae60 0%, #1a6b3a 100%)'
                        : '#ffffff',
                    color: isMe ? '#fff' : '#1a2e1e',
                    fontSize: 14.5,
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    boxShadow: isMe
                        ? '0 4px 12px rgba(39,174,96,0.2)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                    border: isMe ? 'none' : '1px solid #e8f0ea',
                    transition: 'transform 0.2s ease',
                    position: 'relative',
                    ...(isUndecryptable ? {
                        background: '#fff5f5',
                        border: '1px dashed #feb2b2',
                        color: '#c53030',
                        fontStyle: 'italic'
                    } : {})
                }} className="message-bubble-body">
                    {isUndecryptable && (
                        <Icon name="lock" style={{ fontSize: 16, marginRight: 8, verticalAlign: 'middle' }} />
                    )}
                    {message.text}
                    {isUndecryptable && onRestoreRequest && (
                        <div style={{ marginTop: 8, fontSize: 11, fontStyle: 'normal' }}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRestoreRequest(); }}
                                style={{ 
                                    background: '#c53030', color: '#fff', border: 'none', 
                                    padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                Restore session to view
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Status Bar (Timestamp + Ticks) */}
                <div style={{
                    fontSize: 10, 
                    color: '#999', 
                    marginTop: 4,
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4,
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    padding: '0 4px'
                }}>
                    <span>{formatTime(message.created_at)}</span>
                    {isMe && (
                        <Icon 
                            name={message.is_read ? "done_all" : "done"} 
                            style={{ 
                                fontSize: 13, 
                                color: message.is_read ? '#2ecc71' : '#ccc',
                                fontWeight: 700
                            }} 
                        />
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .message-bubble-body:hover {
                    transform: scale(1.01);
                }
            `}</style>
        </div>
    );
};
