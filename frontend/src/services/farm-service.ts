import apiClient from "./api-client";
import { Farm, Field, SprayingWindow } from "../types/farm";

export const farmService = {
  async listFarms(): Promise<Farm[]> {
    const response = await apiClient.get("/farms/farms");
    return response.data;
  },

  async createFarm(payload: any): Promise<Farm> {
    const response = await apiClient.post("/farms/farms", payload);
    return response.data;
  },

  async getSprayingWindow(farmId: string): Promise<SprayingWindow> {
    const response = await apiClient.get(`/farms/farms/${farmId}/spraying-window`);
    return response.data;
  },

  async createField(payload: any): Promise<Field> {
    const { farm_id, ...data } = payload;
    const response = await apiClient.post(`/farms/fields?farm_id=${farm_id}`, data);
    return response.data;
  },

  async getInsights(farmId: string): Promise<any> {
    const response = await apiClient.get(`/farms/farms/${farmId}/insights`);
    return response.data;
  }
};
