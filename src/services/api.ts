import { SoilData, WeatherData, ClimateData } from '@/types';

/**
 * Dr.Plant Central API Service
 * Handles data fetching for weather, soil, and other agricultural telemetry.
 */

export const api = {
    /**
     * Fetch soil data for a given location
     */
    fetchSoil: async (lat: number, lon: number): Promise<SoilData> => {
        // Mocking soil data since real API access for this specific schema might be limited
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    ph: 6.2 + Math.random() * 0.6,
                    organic_carbon: 15 + Math.random() * 5,
                    nitrogen: 120 + Math.random() * 20,
                    clay: 25 + Math.random() * 5,
                    sand: 40 + Math.random() * 10,
                    silt: 35 + Math.random() * 5
                });
            }, 500);
        });
    },

    /**
     * Fetch live weather data using Open-Meteo
     */
    fetchWeather: async (lat: number, lon: number): Promise<WeatherData> => {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&hourly=temperature_2m,relative_humidity_2m,soil_moisture_0_to_1cm&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Weather API failed");
            
            const data = await res.json();
            
            return {
                current: {
                    temperature: data.current.temperature_2m,
                    humidity: data.current.relative_humidity_2m,
                    soil_moisture: data.hourly.soil_moisture_0_to_1cm[0] || 45,
                    time: data.current.time
                },
                hourly: {
                    time: data.hourly.time,
                    temperature_2m: data.hourly.temperature_2m,
                    relative_humidity_2m: data.hourly.relative_humidity_2m,
                    soil_moisture_0_to_1cm: data.hourly.soil_moisture_0_to_1cm
                },
                daily: {
                    time: data.daily.time,
                    temperature_2m_max: data.daily.temperature_2m_max,
                    temperature_2m_min: data.daily.temperature_2m_min,
                    precipitation_sum: data.daily.precipitation_sum
                }
            };
        } catch (error) {
            console.error("API Error: fetchWeather", error);
            // Fallback mock data matching the new interface
            const now = new Date();
            const times = Array(24).fill(0).map((_, i) => new Date(now.getTime() + i * 3600000).toISOString());
            const dailyTimes = Array(7).fill(0).map((_, i) => new Date(now.getTime() + i * 86400000).toISOString());
            
            return {
                current: { temperature: 29.5, humidity: 65, soil_moisture: 45.2, time: now.toISOString() },
                hourly: {
                    time: times,
                    temperature_2m: Array(24).fill(28),
                    relative_humidity_2m: Array(24).fill(60),
                    soil_moisture_0_to_1cm: Array(24).fill(45)
                },
                daily: {
                    time: dailyTimes,
                    temperature_2m_max: Array(7).fill(32),
                    temperature_2m_min: Array(7).fill(24),
                    precipitation_sum: Array(7).fill(0)
                }
            };
        }
    },

    /**
     * Fetch historical climate data (e.g., from NASA POWER or similar)
     */
    fetchClimate: async (lat: number, lon: number): Promise<ClimateData> => {
        // NASA POWER API is complex, so we simulate historical data with realistic distributions
        return new Promise((resolve) => {
            const now = new Date();
            const dates = Array(14).fill(0).map((_, i) => {
                const d = new Date(now);
                d.setDate(d.getDate() - (14 - i));
                return d.toISOString().split('T')[0];
            });

            setTimeout(() => {
                resolve({
                    dates: dates,
                    temperature: dates.map(() => 25 + Math.random() * 10),
                    precipitation: dates.map(() => Math.random() > 0.7 ? Math.random() * 15 : 0)
                });
            }, 600);
        });
    },

    /**
     * Fetch products for the marketplace
     */
    fetchProducts: async () => {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
    },

    /**
     * Reverse geocode a location using OpenStreetMap Nominatim
     */
    reverseGeocode: async (lat: number, lon: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
            if (!res.ok) throw new Error("Geocoding failed");
            
            const data = await res.json();
            const addr = data.address;
            
            return {
                street: addr.road || addr.suburb || addr.neighbourhood || '',
                city: addr.city || addr.town || addr.village || '',
                state: addr.state || '',
                pincode: addr.postcode || ''
            };
        } catch (e) {
            console.error("Geocoding Error:", e);
            return null;
        }
    }
};
