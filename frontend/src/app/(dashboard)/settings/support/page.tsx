export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Help & Support</h2>
        <div className="space-y-3">
           <button className="w-full text-left p-4 bg-gray-50 rounded-2xl font-bold text-sm">Contact Us</button>
           <button className="w-full text-left p-4 bg-gray-50 rounded-2xl font-bold text-sm">FAQs</button>
           <button className="w-full text-left p-4 bg-gray-50 rounded-2xl font-bold text-sm">Terms of Service</button>
        </div>
      </div>
    </div>
  );
}
