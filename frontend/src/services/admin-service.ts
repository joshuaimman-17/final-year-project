import apiClient from './api-client';
import { PlatformStat } from '@/types';

export const adminService = {
  getPlatformStats: async (): Promise<PlatformStat[]> => {
    const response = await apiClient.get('/users/admin/users/stats');
    return response.data;
  },

  getUsers: async (): Promise<any[]> => {
    const response = await apiClient.get('/users/admin/users/');
    return response.data;
  },

  getPendingExperts: async (): Promise<any[]> => {
    const response = await apiClient.get('/users/admin/users/pending-experts');
    return response.data;
  },

  verifyExpert: async (userId: string, status: 'APPROVED' | 'REJECTED', reason?: string): Promise<any> => {
    const response = await apiClient.patch(`/users/admin/users/${userId}/verify`, { status, reason });
    return response.data;
  },

  toggleUserStatus: async (userId: string): Promise<any> => {
    const response = await apiClient.patch(`/users/admin/users/${userId}/status`);
    return response.data;
  },

  getSystemHealth: async (): Promise<any[]> => {
    const services = ["users", "farms", "diagnostics", "marketplace", "community", "chat"];
    const healthStatus = await Promise.all(
      services.map(async (s) => {
        try {
          const start = Date.now();
          await apiClient.get(`/${s}/health`);
          const latency = Date.now() - start;
          return { name: s, status: "UP", latency: `${latency}ms`, icon: "🟢" };
        } catch (error) {
          return { name: s, status: "DOWN", latency: "N/A", icon: "🔴" };
        }
      })
    );
    
    // Also check gateway itself
    try {
      const start = Date.now();
      await apiClient.get("/health");
      const latency = Date.now() - start;
      healthStatus.unshift({ name: "gateway", status: "UP", latency: `${latency}ms`, icon: "🛡️" });
    } catch (error) {
      healthStatus.unshift({ name: "gateway", status: "DOWN", latency: "N/A", icon: "🔴" });
    }

    return healthStatus;
  }
};
