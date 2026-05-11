export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h2>
        <div className="space-y-3">
           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                 <div className="font-bold text-sm">Two-Factor Auth</div>
                 <div className="text-[10px] text-gray-400 font-bold uppercase">Disabled</div>
              </div>
              <button className="text-xs font-black text-green-600">ENABLE</button>
           </div>
           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                 <div className="font-bold text-sm">Password</div>
                 <div className="text-[10px] text-gray-400 font-bold uppercase">Last changed 2mo ago</div>
              </div>
              <button className="text-xs font-black text-green-600">CHANGE</button>
           </div>
        </div>
      </div>
    </div>
  );
}
