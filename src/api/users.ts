import axiosInstance from './axios';
import type { PaginatedResponse, ApiResponse, User, UserRole, FilterParams } from '../types';

export const usersApi = {
  getList: async (params: FilterParams & { role?: UserRole; is_active?: boolean }): Promise<PaginatedResponse<User>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<User>>('/admin/users', { params });
    return data;
  },
  create: async (payload: any): Promise<ApiResponse<User>> => {
    const { data } = await axiosInstance.post<ApiResponse<User>>('/admin/users', payload);
    return data;
  },
  toggleActive: async (id: string): Promise<ApiResponse<{ is_active: boolean }>> => {
    const { data } = await axiosInstance.put<ApiResponse<{ is_active: boolean }>>(`/admin/users/${id}/toggle-active`);
    return data;
  },
  update: async (id: string, payload: { 
    full_name?: string; 
    phone?: string | null; 
    branch_id?: string | null;
    is_active?: boolean;
  }): Promise<ApiResponse<User>> => {
    const { data } = await axiosInstance.put<ApiResponse<User>>(`/admin/users/${id}`, payload);
    return data;
  },
};
