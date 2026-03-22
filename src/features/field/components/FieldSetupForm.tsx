import React, { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

export interface FieldConfig {
    id?: string;
    fieldName: string;
    area: number;
    areaUnit: 'acres' | 'm2';
    soilType: string;
    cropType: string;
    sowingDate: string; // YYYY-MM-DD
    budget: 'Low' | 'Medium' | 'High';
    water: 'Low' | 'Medium' | 'High';
    fertilizerPref: 'Organic' | 'Chemical' | 'Both';
    sensorsAvailable: 'Yes' | 'No';
}

interface FieldSetupFormProps {
    initialConfigs?: FieldConfig[] | null;
    onSave: (configs: FieldConfig[]) => void;
    onCancel: () => void;
}

const createEmptyField = (): FieldConfig => ({
    id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
    fieldName: '',
    area: 1,
    areaUnit: 'acres',
    soilType: 'Loam',
    cropType: 'Cotton',
    sowingDate: new Date().toISOString().split('T')[0],
    budget: 'Medium',
    water: 'Medium',
    fertilizerPref: 'Both',
    sensorsAvailable: 'Yes'
});

export const FieldSetupForm: React.FC<FieldSetupFormProps> = ({ initialConfigs, onSave, onCancel }) => {
    // Manage an array of fields
    const [fields, setFields] = useState<FieldConfig[]>(
        (initialConfigs && initialConfigs.length > 0) ? initialConfigs : [createEmptyField()]
    );

    const handleChange = (index: number, fieldName: keyof FieldConfig, value: string | number) => {
        setFields(prev => {
            const newFields = [...prev];
            newFields[index] = { ...newFields[index], [fieldName]: value };
            return newFields;
        });
    };

    const addField = () => {
        setFields(prev => [...prev, createEmptyField()]);
    };

    const removeField = (index: number) => {
        if (fields.length > 1) {
            setFields(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(fields);
    };

    return (
        <div className="fixed-top vh-100 bg-light z-max overflow-auto animate-fade-in" style={{ zIndex: 1050 }}>
            {/* Header */}
            <header className="bg-primary-green text-white px-3 py-3 sticky-top shadow-sm d-flex align-items-center gap-3">
                <button type="button" onClick={onCancel} className="btn btn-link text-white p-0 text-decoration-none">
                    <Icon name="close" style={{ fontSize: 24 }} />
                </button>
                <h1 className="h5 fw-bold mb-0 flex-grow-1">Field Setup</h1>
            </header>

            <main className="p-3 mx-auto w-100" style={{ maxWidth: '448px' }}>
                <form onSubmit={handleSubmit}>
                    
                    {/* Plot Selection Toggle */}
                    <div className="card shadow-sm border-0 rounded-4 p-3 mb-4 bg-white">
                        <label className="small fw-bold text-muted text-uppercase mb-3 d-block">Number of Plots to Configure</label>
                        <div className="btn-group w-100 p-1 bg-light rounded-pill" role="group">
                            {[1, 2, 3].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    className={`btn rounded-pill fw-bold py-2 ${fields.length === num ? 'btn-primary-green shadow-sm' : 'btn-light text-muted border-0'}`}
                                    onClick={() => {
                                        if (num > fields.length) {
                                            const toAdd = num - fields.length;
                                            setFields(prev => [...prev, ...Array(toAdd).fill(null).map(() => createEmptyField())]);
                                        } else if (num < fields.length) {
                                            setFields(prev => prev.slice(0, num));
                                        }
                                    }}
                                >
                                    {num} {num === 1 ? 'Plot' : 'Plots'}
                                </button>
                            ))}
                        </div>
                        <p className="small text-muted mt-2 mb-0" style={{ fontSize: '11px' }}>
                            <Icon name="info" style={{ fontSize: 13 }} /> Each plot will have its own independent crops and resources.
                        </p>
                    </div>
                    {fields.map((form, index) => (
                        <div key={form.id || index} className="mb-4 position-relative animate-fade-in">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <span className="badge bg-primary-green rounded-circle d-flex align-items-center justify-content-center" style={{ width: 24, height: 24 }}>{index + 1}</span>
                                <h4 className="h6 fw-bold mb-0 text-dark">Configuration for {form.fieldName || `Plot ${index + 1}`}</h4>
                            </div>

                            {/* Basic Info */}
                            <div className="card shadow-sm border-0 rounded-4 p-3 mb-3">
                                <h2 className="h6 fw-bold text-primary-green mb-3 d-flex align-items-center gap-2">
                                    <Icon name="landscape" /> Field Information
                                </h2>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted mb-1">Field Name (Optional)</label>
                                    <input type="text" className="form-control" placeholder="e.g. North Plot" value={form.fieldName} onChange={(e) => handleChange(index, 'fieldName', e.target.value)} />
                                </div>
                                <div className="row g-2 mb-3">
                                    <div className="col-8">
                                        <label className="form-label small fw-bold text-muted mb-1">Area Size</label>
                                        <input type="number" step="0.1" required className="form-control" value={form.area} onChange={(e) => handleChange(index, 'area', parseFloat(e.target.value))} />
                                    </div>
                                    <div className="col-4">
                                        <label className="form-label small fw-bold text-muted mb-1">Unit</label>
                                        <select className="form-select" value={form.areaUnit} onChange={(e) => handleChange(index, 'areaUnit', e.target.value)}>
                                            <option value="acres">Acres</option>
                                            <option value="m2">Sq. Meters</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label small fw-bold text-muted mb-1">Primary Soil Type</label>
                                    <select className="form-select" value={form.soilType} onChange={(e) => handleChange(index, 'soilType', e.target.value)}>
                                        <option value="Loam">Loam (Balanced)</option>
                                        <option value="Clay">Clay (Heavy)</option>
                                        <option value="Sandy">Sandy (Light)</option>
                                        <option value="Silt">Silt</option>
                                    </select>
                                </div>
                            </div>

                            {/* Crop Profile */}
                            <div className="card shadow-sm border-0 rounded-4 p-3 mb-3">
                                <h2 className="h6 fw-bold text-primary-green mb-3 d-flex align-items-center gap-2">
                                    <Icon name="eco" /> Crop Profile
                                </h2>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted mb-1">Target Crop</label>
                                    <select className="form-select" value={form.cropType} onChange={(e) => handleChange(index, 'cropType', e.target.value)}>
                                        <option value="Peanut">Peanut</option>
                                        <option value="Cotton">Cotton</option>
                                        <option value="Wheat">Wheat</option>
                                        <option value="Rice">Rice</option>
                                        <option value="Tomato">Tomato</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label small fw-bold text-muted mb-1">Sowing Date</label>
                                    <input type="date" required className="form-control" value={form.sowingDate} onChange={(e) => handleChange(index, 'sowingDate', e.target.value)} />
                                </div>
                            </div>

                            {/* Resources & Logic */}
                            <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
                                <h2 className="h6 fw-bold text-primary-green mb-3 d-flex align-items-center gap-2">
                                    <Icon name="settings_suggest" /> Operational Resources
                                </h2>
                                
                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted mb-1">Available Budget</label>
                                    <select className="form-select" value={form.budget} onChange={(e) => handleChange(index, 'budget', e.target.value as any)}>
                                        <option value="Low">Low (Cost-effective solutions)</option>
                                        <option value="Medium">Medium (Balanced)</option>
                                        <option value="High">High (Automated/Premium)</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted mb-1">Water Reliability</label>
                                    <select className="form-select" value={form.water} onChange={(e) => handleChange(index, 'water', e.target.value as any)}>
                                        <option value="Low">Low (Rain-fed / Scarce)</option>
                                        <option value="Medium">Medium (Scheduled availability)</option>
                                        <option value="High">High (Own pump/Abundant)</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted mb-1">Fertilizer Preference</label>
                                    <select className="form-select" value={form.fertilizerPref} onChange={(e) => handleChange(index, 'fertilizerPref', e.target.value as any)}>
                                        <option value="Both">Both (Hybrid plan)</option>
                                        <option value="Chemical">Chemical (NPK priority)</option>
                                        <option value="Organic">Organic (Compost/Manure)</option>
                                    </select>
                                </div>

                                <div className="pt-2 border-top mt-3">
                                    <label className="form-label fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                                        <Icon name="sensors" className="text-secondary" />
                                        Hardware Sensors Connected?
                                    </label>
                                    <div className="d-flex gap-3">
                                        <div className="form-check">
                                            <input className="form-check-input" type="radio" name={`sensors-${index}`} id={`sensorYes-${index}`} checked={form.sensorsAvailable === 'Yes'} onChange={() => handleChange(index, 'sensorsAvailable', 'Yes')} />
                                            <label className="form-check-label small" htmlFor={`sensorYes-${index}`}>Yes (Sync data)</label>
                                        </div>
                                        <div className="form-check">
                                            <input className="form-check-input" type="radio" name={`sensors-${index}`} id={`sensorNo-${index}`} checked={form.sensorsAvailable === 'No'} onChange={() => handleChange(index, 'sensorsAvailable', 'No')} />
                                            <label className="form-check-label small" htmlFor={`sensorNo-${index}`}>No (Predictive mode)</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ))}


                    <div className="p-3 bg-white border-top mt-4 rounded-4 shadow-sm">
                        <div className="mx-auto" style={{ maxWidth: '448px' }}>
                            <div className="w-100">
                                <button type="submit" className="btn btn-primary-green w-100 rounded-pill py-3 shadow-sm fw-bold d-flex align-items-center justify-content-center gap-2">
                                    <Icon name="save" /> Save Field Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
};
