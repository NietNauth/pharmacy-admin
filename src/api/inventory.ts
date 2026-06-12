import axiosInstance from './axios';
import type { PaginatedResponse, ApiResponse, Inventory, FilterParams } from '../types';

export const inventoryApi = {
  getList: async (params?: FilterParams & { branch_id?: string; is_low_stock?: boolean }): Promise<PaginatedResponse<Inventory>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Inventory>>('/inventory', { params });
    return data;
  },
  update: async (id: string, payload: { quantity_available?: number; quantity_minimum?: number; expiry_date?: string; note?: string }): Promise<ApiResponse<Inventory>> => {
    const { data } = await axiosInstance.put<ApiResponse<Inventory>>(`/inventory/${id}`, payload);
    return data;
  },
  getLowStock: async (params?: { branch_id?: string }): Promise<ApiResponse<Inventory[]>> => {
    const { data } = await axiosInstance.get<ApiResponse<Inventory[]>>('/inventory/low-stock', { params });
    return data;
  },
  getLogs: async (id: string, params?: { page?: number; start_date?: string; end_date?: string }): Promise<PaginatedResponse<any>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<any>>(`/inventory/${id}/logs`, { params });
    return data;
  },
  restock: async (id: string, payload: { quantity: number; note?: string }): Promise<ApiResponse<Inventory>> => {
    const { data } = await axiosInstance.post<ApiResponse<Inventory>>(`/inventory/${id}/restock`, payload);
    return data;
  },
};
