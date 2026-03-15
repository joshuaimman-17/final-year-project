"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from '@/components/Icon';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="position-fixed bottom-0 start-50 translate-middle-x pb-4 z-3 d-flex flex-column gap-2" style={{ width: '400px', maxWidth: '90vw' }}>
                {toasts.map(toast => (
                    <div 
                        key={toast.id} 
                        className={`animate-slide-up bg-white rounded-4 shadow-lg border p-3 d-flex align-items-center gap-3 transition-all`}
                        style={{ 
                            backdropFilter: 'blur(10px)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderLeft: `4px solid ${
                                toast.type === 'success' ? '#27ae60' : 
                                toast.type === 'error' ? '#e74c3c' : 
                                toast.type === 'warning' ? '#f1c40f' : '#3498db'
                            }`
                        }}
                    >
                        <div className={`rounded-circle p-2 bg-opacity-10 d-flex ${
                            toast.type === 'success' ? 'bg-success text-success' : 
                            toast.type === 'error' ? 'bg-danger text-danger' : 
                            toast.type === 'warning' ? 'bg-warning text-warning' : 'bg-primary text-primary'
                        }`}>
                            <Icon 
                                name={
                                    toast.type === 'success' ? 'check_circle' : 
                                    toast.type === 'error' ? 'error' : 
                                    toast.type === 'warning' ? 'warning' : 'info'
                                } 
                                style={{ fontSize: '20px' }} 
                            />
                        </div>
                        <p className="mb-0 small fw-bold text-dark flex-grow-1">{toast.message}</p>
                        <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="btn btn-link p-1 text-muted">
                            <Icon name="close" style={{ fontSize: '18px' }} />
                        </button>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slideUp 0.3s ease-out forwards;
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};
