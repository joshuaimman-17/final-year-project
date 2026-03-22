import React from 'react';
import { Icon } from '@/components/ui/Icon';

export const Recommendations: React.FC = () => {
    return (
        <div className="mb-4">
            <h3 className="h6 fw-bold text-dark d-flex align-items-center gap-2 mb-3 mt-4">
                <Icon name="lightbulb" className="text-secondary" />
                Recommended Actions
            </h3>
            <div className="d-flex overflow-auto pb-2 gap-3 pb-3" style={{ scrollSnapType: 'x mandatory', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                <div className="card rounded-4 border-0 shadow-sm flex-shrink-0" style={{ width: '260px', scrollSnapAlign: 'start' }}>
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Icon name="water" className="text-primary" />
                            <span className="fw-bold text-dark small text-uppercase">Irrigation</span>
                        </div>
                        <p className="small text-muted mb-3" style={{ fontSize: 12 }}>Soil moisture dropping. Apply 10mm water tonight to optimize pegging stage.</p>
                        <button className="btn btn-sm btn-outline-primary fw-bold w-100 rounded-pill hover-scale">Start Pump</button>
                    </div>
                </div>
                <div className="card rounded-4 border-0 shadow-sm flex-shrink-0 bg-light border-warning border border-opacity-25" style={{ width: '260px', scrollSnapAlign: 'start' }}>
                    <div className="card-body p-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Icon name="vaccines" className="text-warning" />
                            <span className="fw-bold text-dark small text-uppercase">Fertilizer</span>
                        </div>
                        <p className="small text-muted mb-3" style={{ fontSize: 12 }}>Nitrogen is slightly low for current stage. Consider NPK 20-20-20 spray.</p>
                        <button className="btn btn-sm btn-warning text-dark fw-bold w-100 rounded-pill hover-scale">View Details</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
