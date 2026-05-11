"use client";

import React from "react";

export default function SensorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">IoT Sensors</h2>
        <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
          <div className="text-5xl mb-6">📡</div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Sensor Connectivity</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Connect and monitor your field sensors (Soil Moisture, NPK, Weather Station) for real-time local data.
          </p>
        </div>
      </div>
    </div>
  );
}
