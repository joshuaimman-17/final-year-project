
import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { WeatherData } from '@/types';

export const useWeatherData = (lat: number, lon: number) => {
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.fetchWeather(lat, lon);
                setData(res);
            } catch (e) {
                setError('Could not fetch weather data.');
            } finally {
                setLoading(false);
            }
        };

        load();
        const interval = setInterval(load, 15 * 60 * 1000); // Poll every 15 minutes

        return () => clearInterval(interval);
    }, [lat, lon]);

    return { data, loading, error };
};
