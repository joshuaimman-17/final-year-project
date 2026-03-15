import { WeatherData, ClimateData, SoilData, ElevationData, LocationSearchResult } from '@/types';
import logger from '@/lib/logger';

// In unified Next.js, API_BASE can be relative for client calls
const API_BASE = '/api';
// In Next.js, use NEXT_PUBLIC_ for client-side environment variables
const AGRO_API_KEY = process.env.NEXT_PUBLIC_AGRO_API_KEY || '';
const TREFLE_TOKEN = process.env.NEXT_PUBLIC_TREFLE_TOKEN || '';

// --- 1. Weather API (Open-Meteo) ---
export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    return logger.track(`fetchWeather(${lat}, ${lon})`, (async () => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,soil_moisture_0_to_1cm&hourly=temperature_2m,relative_humidity_2m,soil_moisture_0_to_1cm&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch weather data');
        const data = await res.json();

        return {
            current: {
                temperature: data.current.temperature_2m,
                humidity: data.current.relative_humidity_2m,
                soil_moisture: data.current.soil_moisture_0_to_1cm,
                time: data.current.time,
            },
            hourly: data.hourly,
            daily: data.daily
        };
    })());
};

// --- 2. Historical Climate API (NASA POWER) ---
export const fetchClimate = async (lat: number, lon: number): Promise<ClimateData> => {
    const end = new Date();
    end.setDate(end.getDate() - 2); // NASA POWER has a ~2-day lag
    const start = new Date();
    start.setDate(end.getDate() - 30);

    const formatDate = (d: Date) => d.toISOString().split('T')[0].replace(/-/g, '');
    const startStr = formatDate(start);
    const endStr = formatDate(end);

    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}&start=${startStr}&end=${endStr}&format=JSON`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Failed to fetch climate data');
        const data = await res.json();

        const properties = data.properties.parameter;
        const dates = Object.keys(properties.T2M);

        return {
            dates: dates.map(d => `${d.substring(4, 6)}/${d.substring(6, 8)}`),
            temperature: Object.values(properties.T2M),
            precipitation: Object.values(properties.PRECTOTCORR),
        };
    } catch (e) {
        console.error("NASA API Error:", e);
        return { dates: [], temperature: [], precipitation: [] };
    }
};

// --- 3. Soil Properties API (ISRIC SoilGrids) ---
export const fetchSoil = async (lat: number, lon: number): Promise<SoilData> => {
    const fetchProperty = async (prop: string) => {
        const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=${prop}&depth=0-5cm&value=mean`;
        const res = await fetch(url);
        if (!res.ok) return 0;
        const data = await res.json();
        return data.properties.layers[0].depths[0].values.mean;
    };

    try {
        const [ph, clay, sand, silt, nitrogen, organic_carbon] = await Promise.all([
            fetchProperty('phh2o'),
            fetchProperty('clay'),
            fetchProperty('sand'),
            fetchProperty('silt'),
            fetchProperty('nitrogen'),
            fetchProperty('soc')
        ]);

        return {
            ph: ph / 10,
            clay: clay / 10,
            sand: sand / 10,
            silt: silt / 10,
            nitrogen: nitrogen / 100,
            organic_carbon: organic_carbon / 10
        };
    } catch (e) {
        console.error("Soil API Error", e);
        return { ph: 6.5, clay: 20, sand: 40, silt: 40, nitrogen: 2, organic_carbon: 15 };
    }
};

// --- 4. Elevation API (Open-Elevation) ---
export const fetchElevation = async (lat: number, lon: number): Promise<ElevationData> => {
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!res.ok) throw new Error('Elevation fetch failed');
        const data = await res.json();
        return data.results[0];
    } catch (e) {
        return { latitude: lat, longitude: lon, elevation: 0 };
    }
};

// --- 5. Geocoding API (Nominatim) ---
export const searchLocation = async (query: string): Promise<LocationSearchResult[]> => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding failed');
    return await res.json();
};

export const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Reverse geocoding failed');
        const data = await res.json();
        
        const address = data.address;
        if (!address) return "Unknown Location";

        const city = address.city || address.town || address.village || address.suburb;
        const state = address.state || address.county;
        
        if (city && state) return `${city}, ${state}`;
        if (city) return city;
        if (state) return state;
        
        return data.display_name.split(',')[0] || "Unknown Location";
    } catch (e) {
        console.error("Reverse Geocode error", e);
        return "Unknown Location";
    }
};

// --- 6. Diagnosis API ---
const diagnosis = {
    upload: async (formData: FormData): Promise<{ success: boolean }> => {
        logger.info("Uploading plant image for diagnosis...");
        const res = await fetch(`${API_BASE}/diagnosis/upload`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            logger.error("Diagnosis upload failed", { status: res.status });
            throw new Error('Diagnosis upload failed');
        }
        logger.info("Diagnosis upload successful");
        return { success: true };
    }
};

// --- 7. Posts API ---
const posts = {
    list: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/posts`);
        if (!res.ok) throw new Error('Failed to fetch posts');
        return await res.json();
    }
};

// --- 8. Products API ---
const products = {
    list: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return await res.json();
    }
};

// --- 9. AgroMonitoring API ---
const agro = {
    createPolygon: async (name: string, geojson: any) => {
        const url = `https://api.agromonitoring.com/agro/1.0/polygons?appid=${AGRO_API_KEY}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, geojson })
        });
        if (!res.ok) throw new Error('AgroMonitoring polygon creation failed');
        return await res.json();
    },
    getNDVI: async (polyId: string, start: number, end: number) => {
        const url = `https://api.agromonitoring.com/agro/1.0/ndvi/history?polyid=${polyId}&start=${start}&end=${end}&appid=${AGRO_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('AgroMonitoring NDVI fetch failed');
        return await res.json();
    }
};

// --- 9. Trefle API ---
const trefle = {
    searchPlants: async (query: string) => {
        const url = `https://trefle.io/api/v1/plants/search?token=${TREFLE_TOKEN}&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Trefle search failed');
        return await res.json();
    }
};

// --- 9. Marketplace APIs ---
const marketListings = {
    list: async (limit?: number, lastId?: string) => {
        const query = new URLSearchParams();
        if (limit) query.append('limit', limit.toString());
        if (lastId) query.append('lastId', lastId);
        const res = await fetch(`/api/market_listings?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch market listings');
        return await res.json();
    },
    create: async (data: any) => {
        const { auth } = await import('@/lib/firebase');
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/market_listings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create market listing');
        return await res.json();
    },
    delete: async (id: string) => {
        const { auth } = await import('@/lib/firebase');
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/market_listings/${id}`, {
            method: 'DELETE',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` })
            }
        });
        if (!res.ok) throw new Error('Failed to delete market listing');
        return await res.json();
    }
};

const buyerRequests = {
    list: async (limit?: number, lastId?: string) => {
        const query = new URLSearchParams();
        if (limit) query.append('limit', limit.toString());
        if (lastId) query.append('lastId', lastId);
        const res = await fetch(`/api/buyer_requests?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch buyer requests');
        return await res.json();
    },
    create: async (data: any) => {
        const { auth } = await import('@/lib/firebase');
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/buyer_requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create buyer request');
        return await res.json();
    },
    delete: async (id: string) => {
        const { auth } = await import('@/lib/firebase');
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`/api/buyer_requests/${id}`, {
            method: 'DELETE',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` })
            }
        });
        if (!res.ok) throw new Error('Failed to delete buyer request');
        return await res.json();
    }
};

const marketPrices = {
    list: async () => {
        const res = await fetch('/api/mandi_prices');
        if (!res.ok) throw new Error('Failed to fetch mandi prices');
        return await res.json();
    }
};

export const api = {
    fetchWeather,
    fetchClimate,
    fetchSoil,
    fetchElevation,
    searchLocation,
    reverseGeocode,
    diagnosis,
    posts,
    products,
    agro,
    trefle,
    marketListings,
    buyerRequests,
    marketPrices
};
