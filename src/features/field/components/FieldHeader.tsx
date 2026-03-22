import React from 'react';
import { Icon } from '@/components/ui/Icon';

interface FieldHeaderProps {
    farmName: string;
    loading: boolean;
    lastSynced: string;
    statusIcon: string;
    statusText: string;
    statusBg: string;
    isOffline: boolean;
}

export const FieldHeader: React.FC<FieldHeaderProps> = ({ farmName, loading, lastSynced, statusIcon, statusText, statusBg, isOffline }) => {
    return (
        <header className={`${statusBg} text-white px-3 py-4 shadow-sm position-relative sticky-top transition-all`} style={{ zIndex: 10 }}>
            <div className="mx-auto w-100" style={{ maxWidth: '448px' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="flex-grow-1 pe-2">
                        <h1 className="h5 fw-bold mb-0 text-truncate">{farmName} - Sector A</h1>
                        <p className="small text-white-50 mb-0 d-flex align-items-center gap-1">
                            <Icon name="eco" style={{ fontSize: 14 }}/>
                            Peanut • Vegetative Growth
                        </p>
                    </div>
                    <div className="text-end flex-shrink-0">
                        <span className={`badge ${isOffline ? 'bg-danger' : 'bg-white bg-opacity-25'} rounded-pill small fw-medium d-flex align-items-center gap-1`}>
                            <Icon name={isOffline ? "cloud_off" : "sync"} style={{ fontSize: 12 }} /> 
                            {loading ? 'Syncing...' : isOffline ? 'Offline' : lastSynced}
                        </span>
                    </div>
                </div>
                
                <div className="d-flex align-items-center gap-2 mt-3 bg-white bg-opacity-10 rounded-3 p-2 border border-white border-opacity-25 w-max transition-all">
                    {loading ? (
                        <div className="spinner-border spinner-border-sm text-white" />
                    ) : (
                        <Icon name={statusIcon} style={{ fontSize: 16 }} />
                    )}
                    <span className="small fw-bold text-uppercase" style={{ letterSpacing: 0.5 }}>
                        {loading ? 'Analyzing...' : statusText}
                    </span>
                </div>
            </div>
        </header>
    );
};
