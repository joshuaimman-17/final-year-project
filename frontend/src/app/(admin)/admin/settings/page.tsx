"use client";

import React, { useState } from "react";

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireExpertVerification: true,
    enableMarketplace: true,
    systemNotifications: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Platform Settings</h1>
        <p className="text-gray-500 font-medium">Configure global platform behavior and governance rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Governance Settings */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            🛡️ Governance & Security
          </h2>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center group">
              <div>
                <p className="text-sm font-black text-gray-900 mb-1">Maintenance Mode</p>
                <p className="text-xs text-gray-400 font-medium">Restrict access to the platform for all non-admin users.</p>
              </div>
              <button 
                onClick={() => toggleSetting('maintenanceMode')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.maintenanceMode ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>

            <div className="flex justify-between items-center group">
              <div>
                <p className="text-sm font-black text-gray-900 mb-1">Expert Verification</p>
                <p className="text-xs text-gray-400 font-medium">Require manual admin approval for all expert applications.</p>
              </div>
              <button 
                onClick={() => toggleSetting('requireExpertVerification')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.requireExpertVerification ? 'bg-green-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.requireExpertVerification ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>

            <div className="flex justify-between items-center group">
              <div>
                <p className="text-sm font-black text-gray-900 mb-1">New Registrations</p>
                <p className="text-xs text-gray-400 font-medium">Allow new users to sign up for the platform.</p>
              </div>
              <button 
                onClick={() => toggleSetting('allowNewRegistrations')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.allowNewRegistrations ? 'bg-green-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.allowNewRegistrations ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            🚀 Feature Management
          </h2>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center group">
              <div>
                <p className="text-sm font-black text-gray-900 mb-1">Marketplace Module</p>
                <p className="text-xs text-gray-400 font-medium">Enable or disable the marketplace features for all users.</p>
              </div>
              <button 
                onClick={() => toggleSetting('enableMarketplace')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.enableMarketplace ? 'bg-green-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enableMarketplace ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>

            <div className="flex justify-between items-center group">
              <div>
                <p className="text-sm font-black text-gray-900 mb-1">System Notifications</p>
                <p className="text-xs text-gray-400 font-medium">Allow the system to send automated email notifications.</p>
              </div>
              <button 
                onClick={() => toggleSetting('systemNotifications')}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.systemNotifications ? 'bg-green-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.systemNotifications ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-50">
             <button className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-gray-200 transition-all active:scale-95">
                Save Global Configuration
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
