import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AgriDB extends DBSchema {
    polygons: {
        key: string;
        value: {
            id: string;
            geojson: any;
            center: { lat: number; lng: number };
            polygon_id: string; // from AgroMonitoring
            timestamp: number;
        };
    };
    weather_cache: {
        key: string;
        value: {
            location_key: string;
            data: any;
            timestamp: number;
        };
    };
}

const DATABASE_NAME = 'agri-dashboard-db';
const DATABASE_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AgriDB>> | null = null;

export const initDB = () => {
    if (typeof window === 'undefined') return null;
    if (!dbPromise) {
        dbPromise = openDB<AgriDB>(DATABASE_NAME, DATABASE_VERSION, {
            upgrade(db) {
                db.createObjectStore('polygons', { keyPath: 'id' });
                db.createObjectStore('weather_cache', { keyPath: 'location_key' });
            },
        });
    }
    return dbPromise;
};

export const storage = {
    savePolygon: async (polygon: AgriDB['polygons']['value']) => {
        const db = await initDB();
        if (!db) return;
        await db.put('polygons', polygon);
    },
    getPolygons: async () => {
        const db = await initDB();
        if (!db) return [];
        return await db.getAll('polygons');
    },
    deletePolygon: async (id: string) => {
        const db = await initDB();
        if (!db) return;
        await db.delete('polygons', id);
    },
    cacheWeather: async (location_key: string, data: any) => {
        const db = await initDB();
        if (!db) return;
        await db.put('weather_cache', {
            location_key,
            data,
            timestamp: Date.now()
        });
    },
    getCachedWeather: async (location_key: string) => {
        const db = await initDB();
        if (!db) return null;
        const entry = await db.get('weather_cache', location_key);
        if (!entry) return null;
        return entry.data;
    }
};
