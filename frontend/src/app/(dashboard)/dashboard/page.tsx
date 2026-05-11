"use client";

import { useState, useEffect } from "react";
import { farmService } from "@/services";
import { Farm } from "@/types";
import { DashboardMap } from "@/components/DashboardMap";
import { TrendCharts } from "@/components/TrendCharts";
import Link from "next/link";
import { 
  CloudRain, 
  Droplets, 
  Wind, 
  Activity, 
  Sprout, 
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const farmsData = await farmService.listFarms();
        setFarms(farmsData);

        if (farmsData.length > 0) {
          const insightsData = await farmService.getInsights(farmsData[0].id);
          setInsights(insightsData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-bold">Synchronizing satellite & field data...</p>
        </div>
      </div>
    );
  }

  const weather = insights?.weather?.current || {};
  const scores = insights?.scores || {};
  const recommendations = insights?.recommendations || [];

  if (farms.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-xl border border-gray-100 max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8">
            🚜
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">No Farms Added Yet</h2>
          <p className="text-gray-500 font-medium mb-10">
            Add your first farm to unlock satellite health monitoring, real-time weather alerts, and AI-driven crop diagnostics.
          </p>
          <Link
            href="/farms"
            className="inline-block bg-green-600 text-white font-bold px-10 py-4 rounded-2xl shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95"
          >
            Add Your Farm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6 pb-10">
      {/* A. Top Header with User Greeting */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 font-medium">Welcome back, {user?.full_name.split(' ')[0]}</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-2xl border border-gray-100 shadow-sm">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live System Healthy</span>
        </div>
      </div>

      {/* B. Top Summary Actionable Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          label="Crop Health" 
          value={scores.crop_health?.status || "GOOD"} 
          score={scores.crop_health?.score}
          icon={<Sprout className="w-6 h-6 text-green-600" />}
          trend="+2%"
          color="green"
        />
        <SummaryCard 
          label="Irrigation" 
          value={scores.irrigation_need?.status === "HIGH" ? "NEEDED" : "OPTIMAL"} 
          icon={<Droplets className="w-6 h-6 text-blue-600" />}
          color="blue"
        />
        <SummaryCard 
          label="Rain Alert" 
          value={weather.precipitation_probability > 50 ? "EXPECTED" : "NO"} 
          icon={<CloudRain className="w-6 h-6 text-indigo-600" />}
          color="indigo"
        />
        <SummaryCard 
          label="Soil Status" 
          value={scores.soil_fertility?.status || "HEALTHY"} 
          icon={<Activity className="w-6 h-6 text-amber-600" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left/Middle: Map & Recommendation */}
        <div className="xl:col-span-8 space-y-8">
          {/* Main Map */}
          <DashboardMap polygon={insights?.field?.polygon} healthScore={scores.crop_health?.score || 85} />

          {/* Recommendation Panel */}
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-xl tracking-tight">AI Agronomist Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start space-x-3 text-sm font-semibold bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-green-300 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Background design */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-green-400/10 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Right: Weather & Trends */}
        <div className="xl:col-span-4 space-y-8">
          {/* Real-time Weather Info */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-gray-900 text-lg">Local Weather</h3>
               <div className="flex items-center space-x-2">
                 {weather.heat_stress && (
                   <span className="text-[10px] font-black bg-red-100 text-red-600 px-2 py-1 rounded-lg animate-pulse">HEAT STRESS</span>
                 )}
                 {weather.fungal_risk && (
                   <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-2 py-1 rounded-lg">FUNGAL RISK</span>
                 )}
                 <div className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                   <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
                 </div>
               </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <div className="text-5xl font-black text-gray-900 tracking-tighter">{weather.temperature_c}°</div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">{weather.condition || "Clear Sky"}</div>
                  <div className="flex items-center text-[10px] font-bold text-gray-500">
                    <TrendingUp className="w-3 h-3 mr-1 text-green-500" /> H: 32° L: 24°
                  </div>
                </div>
              </div>
              <div className="text-5xl">🌤️</div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <WeatherMiniCard label="Humidity" value={`${weather.humidity}%`} icon={<Droplets className="w-4 h-4" />} />
               <WeatherMiniCard label="Rain Sum" value={`${weather.precipitation_mm}mm`} icon={<CloudRain className="w-4 h-4" />} />
               <WeatherMiniCard label="Max Wind" value={`${weather.wind_speed_kmh}k/h`} icon={<Wind className="w-4 h-4" />} />
            </div>

            {weather.irrigation_hint === "RECOMMENDED" && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Irrigation Advice</div>
                  <div className="text-sm font-bold text-amber-900">Highly Recommended Today</div>
                </div>
              </div>
            )}
          </div>

          {/* Trend Charts */}
          <TrendCharts 
             weatherHistory={insights?.weather?.forecast || []} 
             ndviHistory={[
               {date: '10 Apr', ndvi: 0.62},
               {date: '15 Apr', ndvi: 0.65},
               {date: '20 Apr', ndvi: 0.68},
               {date: '25 Apr', ndvi: 0.72},
               {date: 'Today', ndvi: 0.75},
             ]} 
          />

          {/* Quick Nav Links */}
          <div className="grid grid-cols-2 gap-4">
             <QuickNavLink label="Scan Leaf" href="/diagnose/new" color="green" />
             <QuickNavLink label="Community" href="/community" color="blue" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, score, icon, trend, color }: any) {
  const colorMap: any = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3">
      <div className={`w-10 h-10 ${colorMap[color]} rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
        <div className="flex items-baseline justify-between">
          <div className="font-bold text-gray-900">{value}</div>
          {trend && <span className="text-[10px] font-bold text-green-500">{trend}</span>}
        </div>
        {score && (
          <div className="mt-2 h-1 w-full bg-gray-50 rounded-full overflow-hidden">
            <div className={`h-full bg-green-500 rounded-full`} style={{ width: `${score}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function WeatherMiniCard({ label, value, icon }: any) {
  return (
    <div className="bg-gray-50 p-2 rounded-2xl space-y-1">
      <div className="flex items-center space-x-1 text-gray-400">
        {icon}
        <span className="text-[8px] font-bold uppercase">{label}</span>
      </div>
      <div className="text-xs font-bold text-gray-900">{value}</div>
    </div>
  );
}

function QuickNavLink({ label, href, color }: any) {
  const colorMap: any = {
    green: 'bg-green-600 text-white',
    blue: 'bg-blue-600 text-white'
  };

  return (
    <Link href={href} className={`${colorMap[color]} p-4 rounded-2xl shadow-md flex items-center justify-between w-full active:scale-95 transition-transform font-bold text-sm`}>
      <span>{label}</span>
      <ChevronRight className="w-5 h-5 opacity-50" />
    </Link>
  );
}
