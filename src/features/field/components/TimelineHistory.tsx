import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { FieldConfig } from './FieldSetupForm';

interface TimelineHistoryProps {
    config: FieldConfig;
}

export const TimelineHistory: React.FC<TimelineHistoryProps> = ({ config }) => {
    
    // Auto calculate lifecycle based on Sowing Date
    const sowingDate = new Date(config.sowingDate);
    const today = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    
    const daysSinceSowing = Math.floor((today.getTime() - sowingDate.getTime()) / msPerDay);
    
    // Assume typical crop lifecycle is 120 days for simplicity
    const totalLifecycleDays = 120;
    
    // Calculate Harvest Date
    const harvestDate = new Date(sowingDate.getTime() + (totalLifecycleDays * msPerDay));
    
    let progress = (daysSinceSowing / totalLifecycleDays) * 100;
    if (progress < 0) progress = 0;
    if (progress > 100) progress = 100;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    let fakeActivities = [];
    if (progress > 0) {
        fakeActivities.push({ id: 1, action: `Sowed ${config.cropType} manually`, time: formatDate(sowingDate), type: 'success', icon: 'eco' });
    }
    if (progress > 20) {
        fakeActivities.push({ id: 2, action: `Irrigation applied for establishment`, time: formatDate(new Date(sowingDate.getTime() + (14 * msPerDay))), type: 'info', icon: 'water_drop' });
    }
    if (progress > 50) {
        fakeActivities.push({ id: 3, action: `Mid-season ${config.fertilizerPref} application`, time: formatDate(new Date(sowingDate.getTime() + (45 * msPerDay))), type: 'warning', icon: 'vaccines' });
    }

    return (
        <div className="animate-fade-in">
            {/* Crop Timeline */}
            <h3 className="h6 fw-bold text-dark d-flex align-items-center gap-2 mb-3 mt-4 pt-2">
                <Icon name="linear_scale" className="text-secondary" />
                {config.cropType} Lifecycle Tracker
            </h3>
            <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
                <div className="position-relative">
                    <div className="progress overflow-visible bg-light" style={{ height: 6 }}>
                        <div className="progress-bar bg-success rounded-pill" role="progressbar" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="d-flex justify-content-between mt-3">
                        <div className="text-start">
                            <div className="fw-bold text-dark" style={{ fontSize: 12 }}>Sowing</div>
                            <div className="text-muted" style={{ fontSize: 10 }}>{formatDate(sowingDate)}</div>
                        </div>
                        <div className="text-center">
                            <div className="fw-bold text-primary-green" style={{ fontSize: 12 }}>Day {Math.max(0, daysSinceSowing)}</div>
                        </div>
                        <div className="text-end">
                            <div className="fw-bold text-dark" style={{ fontSize: 12 }}>Est. Harvest</div>
                            <div className="text-muted" style={{ fontSize: 10 }}>{formatDate(harvestDate)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity History */}
            {fakeActivities.length > 0 && (
                <>
                    <h3 className="h6 fw-bold text-dark d-flex align-items-center gap-2 mb-3 mt-4 pt-2">
                        <Icon name="history" className="text-secondary" />
                        Log History
                    </h3>
                    <div className="d-grid gap-3 ps-3 border-start border-2 border-primary border-opacity-25 pb-4">
                        {fakeActivities.reverse().map((act) => (
                            <div key={act.id} className="position-relative d-flex gap-3">
                                <div className={`rounded-circle bg-${act.type} d-flex align-items-center justify-content-center text-white position-absolute`} 
                                     style={{ width: 24, height: 24, left: -29, top: 0, border: '4px solid #fff' }}>
                                    <Icon name={act.icon} style={{ fontSize: 12 }} />
                                </div>
                                <div className="bg-white rounded-3 p-2 shadow-sm border w-100">
                                    <div className="fw-bold text-dark" style={{ fontSize: 13 }}>{act.action}</div>
                                    <div className="text-muted" style={{ fontSize: 10 }}>{act.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
