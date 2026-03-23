export type UserRole = 'FARMER' | 'EXPERT' | 'ADMIN' | 'BUYER';

export interface User {
    _id?: string;
    id: string;
    username: string;
    full_name: string;
    role: UserRole;
    farm_name: string;
    latitude: number;
    longitude: number;
    avatarUrl?: string;
    email?: string;
    location?: string;
    phoneNumber?: string;
    about?: string;
    skills?: string;
    experience?: string;
    projects?: string;
    achievements?: string;
    portfolio_link?: string;
    last_login?: string;
    follower_count?: number;
    following_count?: number;
    like_count?: number;
    expert_status?: 'none' | 'pending' | 'approved' | 'denied';
}

export interface TelemetryData {
    moisture: number;
    temp: number;
    humidity: number;
    npk: { n: number; p: number; k: number };
}

export interface WeatherData {
    current: {
        temperature: number;
        humidity: number;
        soil_moisture: number;
        time: string;
    };
    hourly: {
        time: string[];
        temperature_2m: number[];
        relative_humidity_2m: number[];
        soil_moisture_0_to_1cm: number[];
    };
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_sum: number[];
    };
}

export interface ClimateData {
    dates: string[];
    temperature: number[];
    precipitation: number[];
}

export interface SoilData {
    ph: number; // pH
    organic_carbon: number; // g/kg
    nitrogen: number; // g/kg
    clay: number; // %
    sand: number; // %
    silt: number; // %
}

export interface ElevationData {
    latitude: number;
    longitude: number;
    elevation: number;
}

export interface LocationSearchResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

export interface Product {
    _id: string;
    id?: string;
    name: string;
    price: number;
    category: string;
    image_url: string;
    unit: string;
    rating?: number;
    reviews?: number;
    on_sale?: boolean;
}

export interface Post {
    _id: string;
    id?: string;
    author_name: string;
    author_role?: string;
    author_avatar?: string;
    content: string;
    likes: number;
    timestamp: string;
    image_url?: string;
    comments?: number;
    tags?: string[];
}

export interface LogEntry {
    id: string;
    time: string;
    event: string;
    details: string;
    status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface ReviewCase {
    id: string;
    farmerName: string;
    crop: string;
    issue: string;
    severity: 'High' | 'Medium' | 'Low';
    imageUrl: string;
    timestamp: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

