import apiClient from './api-client';
import { PlatformStat } from '@/types';

export const adminService = {
  getPlatformStats: async (): Promise<PlatformStat[]> => {
    // Note: Assuming this endpoint exists based on backend specs or will be created
    const response = await apiClient.get('/admin/stats');
    return response.data;
  }
};
