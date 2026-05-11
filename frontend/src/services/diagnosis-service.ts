import apiClient from "./api-client";
import { Diagnosis } from "../types/diagnosis";

export const diagnosisService = {
  async submitDiagnosis(payload: any): Promise<Diagnosis> {
    const response = await apiClient.post("/diagnostics/diagnose", payload);
    return response.data;
  },

  async getHistory(): Promise<Diagnosis[]> {
    // History is farm-based in backend
    // For now, let's just use a dummy farm_id or update backend to support user history
    const response = await apiClient.get("/diagnostics/diagnose/history"); 
    return response.data;
  },

  async getDetails(id: string): Promise<Diagnosis> {
    const response = await apiClient.get(`/diagnostics/diagnose/${id}`);
    return response.data;
  },

  async getExpertQueue(): Promise<Diagnosis[]> {
    const response = await apiClient.get("/diagnostics/expert/queue");
    return response.data;
  }
};
