import apiClient from "./api-client";
import { AuthResponse, User } from "../types/user";

export const userService = {
  async register(payload: any): Promise<AuthResponse> {
    const response = await apiClient.post(`/users/register`, payload);
    return response.data;
  },

  async login(payload: any): Promise<AuthResponse> {
    const response = await apiClient.post(`/users/login`, payload);
    return response.data;
  },

  async forgotPassword(email: string): Promise<any> {
    const response = await apiClient.post(`/users/forgot-password`, { email });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get(`/users/me`);
    return response.data;
  },

  async updateProfile(payload: any): Promise<User> {
    const response = await apiClient.patch(`/users/profile`, payload);
    return response.data;
  }
};
