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
            <div className="card border-0 shadow-sm rounded-4 p-0 mb-4 overflow-hidden bg-white mt-2 transition-all hover-scale" style={{ cursor: 'pointer' }}>
                <div className="d-flex">
                    <div className="bg-light p-3 d-flex align-items-center justify-content-center" style={{ width: '100px', borderRight: '1px solid #ebebeb' }}>
                        <Icon name="psychology" className="text-primary-green" style={{ fontSize: 40 }}/>
                    </div>
                    <div className="p-3 flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                            <h4 className="fw-bold mb-1" style={{ fontSize: 14 }}>{data.disease}</h4>
                            <span className={`badge rounded-pill ${data.severity === 'CRITICAL' || data.severity === 'HIGH' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'}`} style={{ fontSize: 10 }}>
                                {data.severity}
                            </span>
                        </div>
                        <p className="small text-muted mb-0" style={{ fontSize: 11 }}>
                            Confidence: <span className="fw-bold text-dark">{Math.round(data.confidence * 100)}%</span> • {timeStr}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
