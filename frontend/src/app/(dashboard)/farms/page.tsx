"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { farmService } from "@/services";
import { Farm } from "@/types";

// Dynamic import for MapPicker because Leaflet requires window object (no SSR)
const MapPicker = dynamic(() => import("@/components/MapPicker"), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 rounded-3xl animate-pulse flex items-center justify-center text-gray-400 font-medium">Loading Map...</div>
});

export default function FarmListPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Farm State
  const [newName, setNewName] = useState("");
  const [newVillage, setNewVillage] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newSoilType, setNewSoilType] = useState("LOAMY");
  const [newIrrigationType, setNewIrrigationType] = useState("RAINFED");
  const [selectedPoints, setSelectedPoints] = useState<[number, number][]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const data = await farmService.listFarms();
      setFarms(data);
    } catch (error) {
      console.error("Failed to fetch farms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleAddFarm = async () => {
    if (!newName || selectedPoints.length < 3) {
      alert("Please provide a name and mark at least 3 points on the map.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create the farm
      const farm = await farmService.createFarm({
        name: newName,
        village: newVillage,
        district: newDistrict,
        state: "Default State" // Can be added to form if needed
      });

      // 2. Create the field with the polygon points
      // Note: GeoJSON polygon expects first and last point to be the same
      const polygonCoords = [...selectedPoints, selectedPoints[0]];
      
      await farmService.createField({
        farm_id: farm.id,
        polygon: {
          type: "Polygon",
          coordinates: [polygonCoords.map(p => [p[1], p[0]])] // GeoJSON is [lng, lat]
        },
        area_hectares: 0, // Backend calculates this
        soil_type_baseline: newSoilType,
        irrigation_type: newIrrigationType
      });

      setShowAddModal(false);
      resetForm();
      fetchFarms();
    } catch (error) {
      console.error("Failed to add farm:", error);
      alert("Failed to add farm. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewVillage("");
    setNewDistrict("");
    setNewSoilType("LOAMY");
    setNewIrrigationType("RAINFED");
    setSelectedPoints([]);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-2xl font-bold text-gray-900">My Farms</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg transition-all active:scale-95"
        >
          +
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500 font-bold animate-pulse">Loading farms...</div>
        ) : farms.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <div className="text-5xl mb-4">🚜</div>
            <p className="text-lg font-medium">No farms registered yet.</p>
          </div>
        ) : (
          farms.map((farm) => (
            <div key={farm.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group active:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{farm.name}</h3>
                  <p className="text-sm text-gray-500">{[farm.village, farm.district].filter(Boolean).join(', ') || 'Unknown Location'}</p>
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {farm.fields?.reduce((acc, f) => acc + f.area_hectares, 0) || 0} ha
                </div>
              </div>
              <div className="flex space-x-2 pt-4 border-t border-gray-50">
                <Link href={`/farms/${farm.id}/field`} className="flex-1 py-2 text-center text-sm font-bold text-green-700 bg-green-50 rounded-xl">View Map</Link>
                <button className="flex-1 py-2 text-center text-sm font-bold text-blue-700 bg-blue-50 rounded-xl">Edit</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Farm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-[30px] sm:rounded-[40px] p-5 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900">Add New Farm</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-3xl">&times;</button>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Farm Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sunshine Valley"
                  className="w-full px-5 py-3.5 sm:px-6 sm:py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Village</label>
                  <input 
                    type="text" 
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    placeholder="Village name"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">District</label>
                  <input 
                    type="text" 
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    placeholder="District name"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Soil Type</label>
                  <select 
                    value={newSoilType}
                    onChange={(e) => setNewSoilType(e.target.value)}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all appearance-none text-sm font-medium"
                  >
                    <option value="LOAMY">Loamy</option>
                    <option value="CLAY">Clay</option>
                    <option value="SANDY">Sandy</option>
                    <option value="BLACK">Black Soil</option>
                    <option value="RED">Red Soil</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Irrigation</label>
                  <select 
                    value={newIrrigationType}
                    onChange={(e) => setNewIrrigationType(e.target.value)}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-all appearance-none text-sm font-medium"
                  >
                    <option value="RAINFED">Rainfed</option>
                    <option value="DRIP">Drip Irrigation</option>
                    <option value="SPRINKLER">Sprinkler</option>
                    <option value="CANAL">Canal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Mark Farm Area</label>
                <MapPicker onPointsSelected={(points) => setSelectedPoints(points)} />
              </div>

              <button 
                onClick={handleAddFarm}
                disabled={isSubmitting || !newName || selectedPoints.length < 3}
                className={`w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-black text-base sm:text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 ${
                  isSubmitting || !newName || selectedPoints.length < 3
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-green-100'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Register Farm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
