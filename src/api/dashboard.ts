import axiosInstance from './axios';
import type { ApiResponse, DashboardStats, AnalyticsStats } from '../types';

export const dashboardApi = {
  getStats: async (branchId?: string): Promise<ApiResponse<DashboardStats>> => {
    const { data } = await axiosInstance.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats', {
      params: { branch_id: branchId }
    });
    return data;
  },
  getAnalytics: async (type: string, date: string, branchId?: string): Promise<ApiResponse<AnalyticsStats>> => {
    const { data } = await axiosInstance.get<ApiResponse<AnalyticsStats>>('/admin/dashboard/analytics', {
      params: { type, date, branch_id: branchId }
    });
    return data;
  },
};
