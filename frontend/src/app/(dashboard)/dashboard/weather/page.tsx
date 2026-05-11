"use client";
import { useState, useEffect } from "react";
import { farmService } from "@/services";
import { 
  CloudRain, 
  Thermometer, 
  Droplets, 
  Wind, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Zap
} from "lucide-react";

export default function WeatherPage() {
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const farms = await farmService.listFarms();
        if (farms.length > 0) {
          const insights = await farmService.getInsights(farms[0].id);
          setForecast(insights.weather.forecast);
        }
      } catch (error) {
        console.error("Failed to fetch weather:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">7-Day Agricultural Outlook</h2>
          <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">Live Satellite Sync</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {forecast.map((day, i) => (
            <div key={day.date} className="group bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 p-5 rounded-3xl transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Date & Condition */}
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform">
                    {day.precipitation_probability > 50 ? '🌧️' : day.temperature_c > 30 ? '☀️' : '⛅'}
                  </div>
                  <div>
                    <div className="font-black text-gray-900">{i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}</div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{day.date}</div>
                  </div>
                </div>

                {/* Middle: Key Metrics */}
                <div className="flex items-center space-x-6">
                   <Metric icon={<Thermometer className="w-4 h-4 text-orange-500" />} label="Temp" value={`${day.temperature_c}°`} />
                   <Metric icon={<Droplets className="w-4 h-4 text-blue-500" />} label="Rain" value={`${day.precipitation_mm}mm`} />
                   <Metric icon={<Wind className="w-4 h-4 text-gray-500" />} label="Wind" value={`${day.wind_speed_kmh}k/h`} />
                </div>

                {/* Right: Spraying Safety & Intelligence */}
                <div className="flex items-center space-x-3">
                   {day.heat_stress && <Badge icon={<Zap className="w-3 h-3" />} text="Heat" color="red" />}
                   {day.fungal_risk && <Badge icon={<AlertTriangle className="w-3 h-3" />} text="Fungi" color="purple" />}
                   
                   <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl font-bold text-xs ${
                     day.spraying_safe 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                   }`}>
                     {day.spraying_safe ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                     <span>{day.spraying_safe ? 'Safe to Spray' : day.alert || 'Unsafe'}</span>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advice Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdviceCard 
          title="Spraying Safety" 
          desc="Optimized for minimal drift and maximum leaf absorption. We monitor wind (<12km/h) and rain risk." 
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
        />
        <AdviceCard 
          title="Fungal Alerts" 
          desc="High humidity (>80%) combined with moderate temps creates ideal conditions for blight and rust." 
          icon={<AlertTriangle className="w-5 h-5 text-purple-600" />}
        />
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: any) {
  return (
    <div className="flex flex-col items-center min-w-[50px]">
      <div className="mb-1">{icon}</div>
      <div className="text-xs font-black text-gray-900">{value}</div>
      <div className="text-[8px] font-bold text-gray-400 uppercase">{label}</div>
    </div>
  );
}

function Badge({ icon, text, color }: any) {
  const colors: any = {
    red: 'bg-red-500 text-white',
    purple: 'bg-purple-500 text-white'
  };
  return (
    <div className={`${colors[color]} px-2 py-1 rounded-lg flex items-center space-x-1 shadow-sm`}>
      {icon}
      <span className="text-[9px] font-black uppercase">{text}</span>
    </div>
  );
}

function AdviceCard({ title, desc, icon }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-start space-x-4">
      <div className="bg-gray-50 p-3 rounded-2xl">{icon}</div>
      <div>
        <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
