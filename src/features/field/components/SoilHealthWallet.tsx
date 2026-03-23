"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';

interface SoilLog {
    id: string;
    date: string;
    n: number;
    p: number;
    k: number;
    ph: number;
    season: string;
}

export const SoilHealthWallet: React.FC = () => {
    const [logs, setLogs] = useState<SoilLog[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ n: 0, p: 0, k: 0, ph: 7.0, season: 'Kharif 2025' });

    useEffect(() => {
        const saved = localStorage.getItem('drplant_soil_logs');
        if (saved) setLogs(JSON.parse(saved));
    }, []);

    const saveLog = (e: React.FormEvent) => {
        e.preventDefault();
        const newLog: SoilLog = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            ...formData
        };
        const updated = [newLog, ...logs];
        setLogs(updated);
        localStorage.setItem('drplant_soil_logs', JSON.stringify(updated));
        setShowAdd(false);
    };

    return (
        <section className="bg-white rounded-4 p-4 shadow-sm border mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="h6 fw-bold mb-0 text-dark">Soil Health Wallet</h3>
                <button onClick={() => setShowAdd(!showAdd)} className="btn btn-sm btn-success rounded-pill px-3 fw-bold">
                    {showAdd ? 'Cancel' : '+ New Test'}
                </button>
            </div>

            {showAdd && (
                <form onSubmit={saveLog} className="bg-light p-3 rounded-4 mb-3 border animate-fade-in">
                    <div className="row g-2">
                        <div className="col-6 mb-2">
                            <label className="small fw-bold text-muted">Season</label>
                            <input type="text" className="form-control form-control-sm" value={formData.season} onChange={e => setFormData(p => ({ ...p, season: e.target.value }))} />
                        </div>
                        <div className="col-6 mb-2">
                            <label className="small fw-bold text-muted">pH Level</label>
                            <input type="number" step="0.1" className="form-control form-control-sm" value={formData.ph} onChange={e => setFormData(p => ({ ...p, ph: parseFloat(e.target.value) }))} />
                        </div>
                        <div className="col-4">
                            <label className="small fw-bold text-muted">N</label>
                            <input type="number" className="form-control form-control-sm" value={formData.n} onChange={e => setFormData(p => ({ ...p, n: parseInt(e.target.value) }))} />
                        </div>
                        <div className="col-4">
                            <label className="small fw-bold text-muted">P</label>
                            <input type="number" className="form-control form-control-sm" value={formData.p} onChange={e => setFormData(p => ({ ...p, p: parseInt(e.target.value) }))} />
                        </div>
                        <div className="col-4">
                            <label className="small fw-bold text-muted">K</label>
                            <input type="number" className="form-control form-control-sm" value={formData.k} onChange={e => setFormData(p => ({ ...p, k: parseInt(e.target.value) }))} />
                        </div>
                        <div className="col-12 mt-3">
                            <button type="submit" className="btn btn-success w-100 btn-sm rounded-pill fw-bold">Save Record</button>
                        </div>
                    </div>
                </form>
            )}

            <div className="d-flex flex-column gap-2">
                {logs.length > 0 ? logs.map(log => (
                    <div key={log.id} className="p-3 border rounded-4 bg-white hover-scale transition-all shadow-sm">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold small text-dark">{log.season}</span>
                            <span className="text-muted small" style={{ fontSize: 10 }}>{log.date}</span>
                        </div>
                        <div className="d-flex gap-3 text-center">
                            <div className="flex-grow-1">
                                <div className="text-muted" style={{ fontSize: 9 }}>NITROGEN</div>
                                <div className="fw-bold text-success">{log.n}</div>
                            </div>
                            <div className="flex-grow-1">
                                <div className="text-muted" style={{ fontSize: 9 }}>PHOSPHORUS</div>
                                <div className="fw-bold text-success">{log.p}</div>
                            </div>
                            <div className="flex-grow-1">
                                <div className="text-muted" style={{ fontSize: 9 }}>POTASSIUM</div>
                                <div className="fw-bold text-success">{log.k}</div>
                            </div>
                            <div className="flex-grow-1 border-start ps-2">
                                <div className="text-muted" style={{ fontSize: 9 }}>PH</div>
                                <div className={`fw-bold ${log.ph < 6 || log.ph > 8 ? 'text-danger' : 'text-primary'}`}>{log.ph}</div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-4 bg-light rounded-4 border border-dashed">
                        <Icon name="history_edu" className="text-muted opacity-50 display-6 mb-2" />
                        <p className="small text-muted mb-0">No soil test results logged yet.</p>
                    </div>
                )}
            </div>
            
            <div className="mt-3 small text-center text-muted border-top pt-2" style={{ fontSize: 10 }}>
                Disclaimer: Soil health records depend on accurate laboratory testing.
            </div>
        </section>
    );
};
