import React from 'react';
import { Icon } from '@/components/ui/Icon';

interface DiagnosisData {
    disease: string;
    confidence: number;
    severity: string;
    timestamp: string | Date;
}

interface AIDiagnosisProps {
    data?: DiagnosisData | null;
    loading?: boolean;
}

export const AIDiagnosis: React.FC<AIDiagnosisProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="mb-4">
                <h3 className="h6 fw-bold text-dark d-flex align-items-center gap-2 mb-3 mt-4 pt-2">
                    <Icon name="document_scanner" className="text-secondary" />
                    Latest Pathology Scan
                </h3>
                <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white skeleton-pulse">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-light rounded" style={{ width: 60, height: 60 }} />
                        <div className="flex-grow-1">
                            <div className="bg-light rounded mb-2" style={{ width: '40%', height: 16 }} />
                            <div className="bg-light rounded" style={{ width: '70%', height: 12 }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const timeStr = typeof data.timestamp === 'string' ? data.timestamp : data.timestamp.toLocaleDateString();

    return (
        <div className="mb-4">
            <h3 className="h6 fw-bold text-dark d-flex align-items-center gap-2 mb-3 mt-4 pt-2">
                <Icon name="document_scanner" className="text-secondary" />
                Latest Pathology Scan
            </h3>
            <div className="card border-0 shadow-sm rounded-4 p-0 mb-3 overflow-hidden bg-white mt-2 transition-all hover-scale" style={{ cursor: 'pointer' }}>
                <div className="d-flex">
                    <div className="bg-light p-3 d-flex align-items-center justify-content-center" style={{ width: '80px', borderRight: '1px solid #f0f0f0' }}>
                        <Icon name="psychology" className="text-primary-green" style={{ fontSize: 32 }}/>
                    </div>
                    <div className="p-3 flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                            <h4 className="fw-bold mb-1" style={{ fontSize: 13 }}>{data.disease}</h4>
                            <span className={`badge rounded-pill ${data.severity === 'CRITICAL' || data.severity === 'HIGH' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'}`} style={{ fontSize: 9 }}>
                                {data.severity}
                            </span>
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-1">
                            <div className="flex-grow-1 bg-light rounded-pill overflow-hidden" style={{ height: 6 }}>
                                <div className="bg-success h-100" style={{ width: `${Math.round(data.confidence * 100)}%` }} />
                            </div>
                            <span className="fw-bold text-dark" style={{ fontSize: 10 }}>{Math.round(data.confidence * 100)}%</span>
                        </div>
                        <p className="text-muted mb-0 mt-1" style={{ fontSize: 9 }}>
                            Detected on {timeStr}
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-light p-2 rounded-3 small text-center text-muted" style={{ fontSize: 9 }}>
                Disclaimer: AI diagnosis is for advisory purposes. Consult an expert for critical decisions.
            </div>
        </div>
    );
};
