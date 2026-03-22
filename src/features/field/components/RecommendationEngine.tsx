import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { FieldConfig } from './FieldSetupForm';

interface RecommendationEngineProps {
    config: FieldConfig;
    sm: number; // Current moisture
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({ config, sm }) => {
    // Logic 1: Irrigation Recommendations based on budget & moisture
    let irrigationRec = {
        title: 'Irrigation',
        icon: 'water',
        desc: '',
        color: 'primary',
        action: ''
    };

    if (config.budget === 'Low') {
        irrigationRec.desc = `Moisture currently ${sm.toFixed(1)}%. Since budget is low, prioritize manual targeted watering at root zones during evening hours.`;
        irrigationRec.action = 'View Schedule';
    } else if (config.budget === 'High') {
        irrigationRec.desc = `Moisture is ${sm.toFixed(1)}%. We recommend deploying automated Drip Irrigation sensors to maximize your premium budget yield.`;
        irrigationRec.action = 'Deploy Drip';
    } else {
        irrigationRec.desc = `Maintain moisture above 30%. Consider scheduling 10mm sprinkler rotation tonight for your ${config.cropType}.`;
        irrigationRec.action = 'Start Pump';
    }

    // Logic 2: Fertilizer Recommendations based on preferences
    let fertRec = {
        title: 'Fertilizer',
        icon: 'vaccines',
        desc: '',
        color: 'warning',
        action: ''
    };

    if (config.fertilizerPref === 'Organic') {
        fertRec.desc = `Organic Preference noted! Your ${config.cropType} requires rich NPK. Prepare compost and manure spread this week.`;
        fertRec.action = 'Prepare Compost';
    } else if (config.fertilizerPref === 'Chemical') {
        fertRec.desc = `Apply NPK 20-20-20 foliar spray to rapidly boost the ${config.soilType} soil nitrogen levels for your ${config.cropType}.`;
        fertRec.action = 'View Details';
    } else {
        fertRec.desc = `Use vermicompost for long-term health, and supplement with mild NPK chemical sprays to accelerate the growth cycle.`;
        fertRec.action = 'Hybrid Guide';
    }

    return (
        <div className="mb-4 animate-fade-in">
            <h3 className="h6 fw-bold text-dark d-flex align-items-center gap-2 mb-3 mt-4">
                <Icon name="lightbulb" className="text-secondary" />
                Smart Recommendations
            </h3>
            <div className="d-flex overflow-auto pb-2 gap-3 pb-3" style={{ scrollSnapType: 'x mandatory', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                
                {/* Irrigation Card */}
                <div className="card rounded-4 border-0 shadow-sm flex-shrink-0" style={{ width: '260px', scrollSnapAlign: 'start' }}>
                    <div className="card-body p-3 d-flex flex-column">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Icon name={irrigationRec.icon} className={`text-${irrigationRec.color}`} />
                            <span className="fw-bold text-dark small text-uppercase">{irrigationRec.title}</span>
                        </div>
                        <p className="small text-muted mb-3 flex-grow-1" style={{ fontSize: 12 }}>{irrigationRec.desc}</p>
                        <button className={`btn btn-sm btn-outline-${irrigationRec.color} fw-bold w-100 rounded-pill hover-scale mt-auto`}>
                            {irrigationRec.action}
                        </button>
                    </div>
                </div>

                {/* Fertilizer Card */}
                <div className={`card rounded-4 shadow-sm flex-shrink-0 bg-light border-${fertRec.color} border border-opacity-25`} style={{ width: '260px', scrollSnapAlign: 'start' }}>
                    <div className="card-body p-3 d-flex flex-column">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Icon name={fertRec.icon} className={`text-${fertRec.color}`} />
                            <span className="fw-bold text-dark small text-uppercase">{fertRec.title}</span>
                        </div>
                        <p className="small text-muted mb-3 flex-grow-1" style={{ fontSize: 12 }}>{fertRec.desc}</p>
                        <button className={`btn btn-sm btn-${fertRec.color} text-dark fw-bold w-100 rounded-pill hover-scale mt-auto`}>
                            {fertRec.action}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
