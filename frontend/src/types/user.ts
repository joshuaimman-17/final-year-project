export type UserRole = "FARMER" | "EXPERT" | "BUYER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ExpertProfile {
  specialization: string;
  bio: string;
  experience_years: number;
  rating?: number;
}
