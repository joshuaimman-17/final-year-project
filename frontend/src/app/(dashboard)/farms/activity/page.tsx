export default function FarmActivityPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Farm Activity</h2>
        <div className="space-y-4">
           {[1, 2, 3].map((i) => (
             <div key={i} className="flex items-start space-x-4 p-4 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-xl">🚜</div>
                <div>
                   <div className="font-bold text-sm text-gray-900">Activity #{i} logged</div>
                   <div className="text-xs text-gray-500">2 hours ago • Field A</div>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
