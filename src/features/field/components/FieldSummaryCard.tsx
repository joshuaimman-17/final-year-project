import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { FieldConfig } from './FieldSetupForm';

interface FieldSummaryCardProps {
    config: FieldConfig;
    onEdit: () => void;
}

export const FieldSummaryCard: React.FC<FieldSummaryCardProps> = ({ config, onEdit }) => {
    return (
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 animate-fade-in bg-white position-relative">
            <button 
                onClick={onEdit}
                className="btn btn-sm btn-light border position-absolute rounded-pill px-3 py-1 fw-bold text-primary-green shadow-sm"
                style={{ top: '12px', right: '12px', fontSize: 11 }}
            >
                Edit
            </button>
            
            <h3 className="h6 fw-bold text-dark mb-1">
                {config.fieldName || "Main Field"} 
                <span className="small text-muted fw-normal ms-2">({config.area} {config.areaUnit})</span>
            </h3>
            
            <div className="d-flex flex-wrap gap-2 mt-3">
                <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                    <Icon name="eco" style={{ fontSize: 12 }} /> {config.cropType}
                </span>
                <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                    <Icon name="landscape" style={{ fontSize: 12 }} /> {config.soilType} Soil
                </span>
                <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                    <Icon name="payments" style={{ fontSize: 12 }} /> {config.budget} Budget
                </span>
                <span className="badge bg-light text-dark border d-flex align-items-center gap-1">
                    <Icon name="water_drop" style={{ fontSize: 12 }} /> {config.water} Water
                </span>
                {config.sensorsAvailable === 'No' && (
                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 d-flex align-items-center gap-1">
                        <Icon name="sensors_off" style={{ fontSize: 12 }} /> No Sensors
                    </span>
                )}
            </div>
        </div>
    );
};
