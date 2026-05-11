"use client";
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface TrendChartsProps {
  weatherHistory: any[];
  ndviHistory: any[];
}

export const TrendCharts: React.FC<TrendChartsProps> = ({ weatherHistory, ndviHistory }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="space-y-6 h-[460px]" />; // Placeholder to maintain layout
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Temperature & Rainfall Trend</h4>
        <div className="h-[200px] w-full relative" style={{ minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weatherHistory}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="temperature_c" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorTemp)" 
                strokeWidth={3}
              />
              <Area 
                type="monotone" 
                dataKey="precipitation_mm" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Crop Health (NDVI)</h4>
        <div className="h-[200px] w-full relative" style={{ minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ndviHistory}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="ndvi" 
                stroke="#22c55e" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
