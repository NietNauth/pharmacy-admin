import axiosInstance from './axios';
import type { ApiResponse, Branch } from '../types';

export const branchesApi = {
  getList: async (): Promise<ApiResponse<Branch[]>> => {
    const { data } = await axiosInstance.get<ApiResponse<Branch[]>>('/branches');
    return data;
  },
  create: async (payload: object): Promise<ApiResponse<Branch>> => {
    const { data } = await axiosInstance.post<ApiResponse<Branch>>('/admin/branches', payload);
    return data;
  },
  update: async (id: string, payload: object): Promise<ApiResponse<Branch>> => {
    const { data } = await axiosInstance.put<ApiResponse<Branch>>(`/admin/branches/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<ApiResponse<void>> => {
    const { data } = await axiosInstance.delete<ApiResponse<void>>(`/admin/branches/${id}`);
    return data;
  },
};
