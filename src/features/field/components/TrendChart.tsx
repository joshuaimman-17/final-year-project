import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendChartProps {
    data: any[];
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
    return (
        <div>
            <h3 className="h6 fw-bold text-dark d-flex align-items-center gap-2 mb-3 mt-4 pt-2">
                <Icon name="monitoring" className="text-secondary" />
                7-Day Trend
            </h3>
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 animate-fade-in">
                <div className="d-flex justify-content-between mb-3 px-2">
                    <span className="small fw-bold text-primary"><Icon name="water_drop" style={{ fontSize: 12 }}/> Moisture %</span>
                    <span className="small fw-bold text-warning"><Icon name="thermostat" style={{ fontSize: 12 }}/> Temp °C</span>
                </div>
                <div style={{ width: '100%', height: 180 }}>
                    <ResponsiveContainer>
                        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" style={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}/>
                            <Area type="monotone" dataKey="moisture" stroke="#0d6efd" fillOpacity={1} fill="url(#colorMoisture)" strokeWidth={3} isAnimationActive={false} />
                            <Area type="monotone" dataKey="temp" stroke="#ffc107" fill="none" strokeWidth={2} strokeDasharray="5 5" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default TrendChart;
