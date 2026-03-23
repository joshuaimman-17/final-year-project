import React from 'react';
import { Icon } from '@/components/ui/Icon';

interface AlertsPanelProps {
    sm: number;
    loading: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ sm, loading }) => {
    if (loading) return null;

    // Critical Alert check
    const isCritical = sm < 30;
    
    // Predictive/Pre-emptive Alert logic
    const isPredictive = sm >= 30 && sm <= 35;

    return (
        <>
            {isCritical && (
                <div className="alert alert-danger border-danger border-2 rounded-4 shadow-sm d-flex align-items-start gap-3 p-3 mb-4 animate-fade-in">
                    <Icon name="warning" className="text-danger mt-1 flex-shrink-0" style={{ fontSize: 24 }} />
                    <div>
                        <div className="d-flex align-items-center justify-content-between">
                            <h4 className="h6 fw-bold mb-1 lh-sm">Low Moisture Alert</h4>
                            <span className="badge bg-white text-danger border border-danger border-opacity-25 rounded-pill d-flex align-items-center gap-1" style={{ fontSize: 8 }}>
                                <Icon name="verified" style={{ fontSize: 10 }} /> Expert Verified
                            </span>
                        </div>
                        <p className="small mb-0 opacity-75 lh-sm">Soil moisture is critically low at {sm.toFixed(1)}%. Immediate irrigation needed.</p>
                        <div className="mt-2 text-danger-emphasis fw-bold" style={{ fontSize: 8 }}>
                            * Disclaimer: Local sensor calibration may vary.
                        </div>
                    </div>
                </div>
            )}

            {isPredictive && (
                <div className="alert alert-warning border-warning border border-opacity-50 rounded-4 shadow-sm d-flex align-items-start gap-3 p-3 mb-4 animate-fade-in" style={{ backgroundColor: '#fff8e1' }}>
                    <Icon name="insights" className="text-warning mt-1 flex-shrink-0" style={{ fontSize: 24 }} />
                    <div>
                        <h4 className="h6 fw-bold mb-1 text-dark lh-sm">Predictive Warning</h4>
                        <p className="small mb-0 text-dark opacity-75 lh-sm">Moisture trending downwards ({sm.toFixed(1)}%). Prepare irrigation within 48h to maintain optimal pegging efficiency.</p>
                    </div>
                </div>
            )}
        </>
    );
};
