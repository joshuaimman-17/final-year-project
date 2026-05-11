"use client";
import React, { useState } from 'react';
import { Map as MapIcon, Layers, Maximize2 } from 'lucide-react';

interface DashboardMapProps {
  polygon: any;
  healthScore: number;
}

export const DashboardMap: React.FC<DashboardMapProps> = ({ polygon, healthScore }) => {
  const [activeLayer, setActiveLayer] = useState<'health' | 'weather' | 'soil'>('health');

  // Helper to determine color based on health score
  const getHealthColor = (score: number) => {
    if (score > 70) return '#22c55e'; // Green
    if (score > 40) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 flex justify-between items-center border-b border-gray-50">
        <div className="flex items-center space-x-2">
          <MapIcon className="w-5 h-5 text-green-600" />
          <span className="font-bold text-gray-900">Field Map</span>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {(['health', 'weather', 'soil'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeLayer === layer ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {layer.charAt(0).toUpperCase() + layer.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 bg-gray-50 flex items-center justify-center p-8">
        {/* Simulated Satellite View Background */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        {/* Field Polygon Visualization */}
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full max-w-[280px] drop-shadow-2xl transition-all duration-700">
            {/* Base Field Shape */}
            <path
              d="M 20,30 L 80,20 L 90,70 L 30,85 Z"
              fill={activeLayer === 'health' ? getHealthColor(healthScore) : activeLayer === 'weather' ? '#3b82f6' : '#92400e'}
              fillOpacity={0.6}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-500"
            />
            {/* Heatmap overlay dots */}
            <circle cx="40" cy="45" r="5" fill="#ef4444" fillOpacity={activeLayer === 'health' && healthScore < 80 ? 0.4 : 0} />
            <circle cx="60" cy="35" r="8" fill="#22c55e" fillOpacity={activeLayer === 'health' ? 0.3 : 0} />
          </svg>
          
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white shadow-lg">
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Current Layer</div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getHealthColor(healthScore) }} />
              <span className="text-sm font-bold text-gray-900">
                {activeLayer === 'health' ? `Health: ${healthScore}/100` : activeLayer === 'weather' ? 'Rain Risk: Low' : 'Moisture: Good'}
              </span>
            </div>
          </div>
          
          <button className="absolute top-4 right-4 bg-white p-2 rounded-xl shadow-md active:scale-95 transition-transform">
            <Maximize2 className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-50/50 flex items-center space-x-4">
        <div className="flex -space-x-2">
           {[1,2,3].map(i => (
             <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">
               P{i}
             </div>
           ))}
        </div>
        <span className="text-xs text-gray-500 font-medium">3 detection points active in this field</span>
      </div>
    </div>
  );
};
