"use client";

import React, { useRef } from 'react';
import { Icon } from '@/components/ui/Icon';

interface ChatInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSend: (e: React.FormEvent) => void;
    sending: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChange,
    onSend,
    sending
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend(e as any);
        }
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #e8f0ea',
            padding: '16px 20px',
            flexShrink: 0,
        }}>
            <form onSubmit={onSend} style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
                    <button type="button" style={{
                        background: '#f0f5f1', border: 'none', borderRadius: '50%',
                        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#666', cursor: 'pointer', transition: 'all 0.2s'
                    }} className="input-action">
                        <Icon name="add" style={{ fontSize: 22 }} />
                    </button>
                    <button type="button" style={{
                        background: '#f0f5f1', border: 'none', borderRadius: '50%',
                        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#666', cursor: 'pointer', transition: 'all 0.2s'
                    }} className="input-action">
                        <Icon name="sentiment_satisfied" style={{ fontSize: 22 }} />
                    </button>
                </div>

                {/* Textarea Wrapper */}
                <div style={{
                    flex: 1, display: 'flex', alignItems: 'flex-end',
                    background: '#f4f9f5', borderRadius: '24px',
                    border: '1.5px solid #d4e8d9', padding: '10px 18px',
                    transition: 'all 0.2s ease',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }} className="input-wrapper">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={onChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Message your agricultural assistant..."
                        rows={1}
                        style={{
                            flex: 1, border: 'none', background: 'none', outline: 'none',
                            fontSize: 15, resize: 'none', maxHeight: 150,
                            color: '#1a2e1e', lineHeight: 1.5,
                            fontFamily: 'inherit',
                            fontWeight: 500,
                            padding: 0,
                            margin: 0
                        }}
                    />
                </div>

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={!value.trim() || sending}
                    style={{
                        width: 48, height: 48,
                        borderRadius: '16px',
                        border: 'none',
                        background: value.trim()
                            ? 'linear-gradient(135deg, #27ae60 0%, #1a6b3a 100%)'
                            : '#e0e0e0',
                        color: '#fff',
                        cursor: value.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        boxShadow: value.trim() ? '0 6px 16px rgba(39,174,96,0.3)' : 'none',
                        transform: value.trim() ? 'scale(1)' : 'scale(0.95)'
                    }}
                >
                    {sending
                        ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.5)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        : <Icon name="send" style={{ fontSize: 22, marginLeft: 2 }} />
                    }
                </button>
            </form>

            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .input-action:hover {
                    background: #e8f0ea !important;
                    color: #27ae60 !important;
                }
                .input-wrapper:focus-within {
                    border-color: #27ae60 !important;
                    background: #fff !important;
                    box-shadow: 0 4px 12px rgba(39,174,96,0.1) !important;
                }
            `}</style>
        </div>
    );
};
