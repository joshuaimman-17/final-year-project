import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { FieldConfig } from './FieldSetupForm';

interface CropTimelineEvent {
    day: number;
    title: string;
    description: string;
    icon: string;
    category: 'fertilization' | 'irrigation' | 'harvest' | 'milestone';
}

const cropGuidelines: Record<string, CropTimelineEvent[]> = {
    'Cotton': [
        { day: 0, title: 'Sowing Day', description: 'Ensure soil moisture is adequate.', icon: 'agriculture', category: 'milestone' },
        { day: 15, title: 'First Irrigation', description: 'Critical for early growth.', icon: 'water_drop', category: 'irrigation' },
        { day: 30, title: 'NPK Fertilization', description: 'Apply first dose of nutrients.', icon: 'Science', category: 'fertilization' },
        { day: 50, title: 'Squaring Phase', description: 'Monitor for pests.', icon: 'visibility', category: 'milestone' },
        { day: 75, title: 'Flowering Booster', description: 'Apply flowering stimulants.', icon: 'auto_awesome', category: 'fertilization' },
        { day: 120, title: 'Boll Development', description: 'Uniform irrigation needed.', icon: 'water_drop', category: 'irrigation' },
        { day: 160, title: 'Harvest Milestone', description: 'Estimated time for first picking.', icon: 'shopping_basket', category: 'harvest' }
    ],
    'Tomato': [
        { day: 0, title: 'Transplantation', description: 'Sowing/Transplanting day.', icon: 'potted_plant', category: 'milestone' },
        { day: 7, title: 'Establishment Water', description: 'Light irrigation to settle roots.', icon: 'water_drop', category: 'irrigation' },
        { day: 20, title: 'Growth Phase', description: 'Apply Nitrogen base fertilizer.', icon: 'eco', category: 'fertilization' },
        { day: 45, title: 'First Bloom', description: 'Check for calcium levels.', icon: 'wb_sunny', category: 'milestone' },
        { day: 70, title: 'Fruiting Begin', description: 'Consistent watering is key.', icon: 'water_drop', category: 'irrigation' },
        { day: 90, title: 'Harvest Window', description: 'Pick when ripe red.', icon: 'restaurant', category: 'harvest' }
    ]
};

const defaultGuidelines: CropTimelineEvent[] = [
    { day: 0, title: 'Sowing Start', description: 'Begin your crop journey.', icon: 'grass', category: 'milestone' },
    { day: 14, title: 'Early Check', description: 'Monitor germination.', icon: 'search', category: 'milestone' },
    { day: 45, title: 'Mid-Season Care', description: 'Ensure proper nutrients.', icon: 'health_and_safety', category: 'fertilization' },
    { day: 100, title: 'Harvest Prep', description: 'Check maturity levels.', icon: 'event', category: 'harvest' }
];

export const CropLifecycleCalendar: React.FC<{ config: FieldConfig }> = ({ config }) => {
    const sowingDate = new Date(config.sowingDate);
    const timeline = cropGuidelines[config.cropType] || defaultGuidelines;

    const getMilestoneDate = (days: number) => {
        const d = new Date(sowingDate);
        d.setDate(d.getDate() + days);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const isPast = (days: number) => {
        const d = new Date(sowingDate);
        d.setDate(d.getDate() + days);
        return d < new Date();
    };

    return (
        <section className="bg-white rounded-4 p-4 shadow-sm border mb-4">
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h3 className="h6 fw-bold mb-0 text-dark">Crop Lifecycle Calendar</h3>
                <span className="badge bg-success-subtle text-success rounded-pill">{config.cropType}</span>
            </div>

            <div className="position-relative ps-4 border-start border-2 ms-2">
                {timeline.map((event, i) => (
                    <div key={i} className={`mb-4 position-relative ${isPast(event.day) ? 'opacity-50' : ''}`}>
                        {/* Dot */}
                        <div className={`position-absolute top-0 start-0 translate-middle-x rounded-circle border border-4 border-white shadow-sm d-flex align-items-center justify-content-center`}
                             style={{ 
                                 width: 32, 
                                 height: 32, 
                                 left: -18, 
                                 background: event.category === 'fertilization' ? '#6a1b9a' : 
                                            event.category === 'irrigation' ? '#1565c0' :
                                            event.category === 'harvest' ? '#c62828' : '#2e7d32',
                                 color: 'white'
                             }}>
                            <Icon name={event.icon} style={{ fontSize: 16 }} />
                        </div>
                        
                        <div className="ms-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <h4 className="fw-bold mb-0" style={{ fontSize: 14 }}>{event.title}</h4>
                                <span className="small text-muted fw-bold" style={{ fontSize: 10 }}>{getMilestoneDate(event.day)}</span>
                            </div>
                            <p className="text-muted small mb-0 mt-1" style={{ fontSize: 11 }}>{event.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="bg-light p-2 rounded-3 small text-center text-muted" style={{ fontSize: 10 }}>
                Disclaimer: Automated milestones are general guidelines. Adjust based on local weather.
            </div>
        </section>
    );
};
