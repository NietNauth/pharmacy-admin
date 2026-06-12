import axiosInstance from './axios';
import type { ApiResponse, Brand } from '../types';

export const brandsApi = {
  getList: async (): Promise<ApiResponse<Brand[]>> => {
    const { data } = await axiosInstance.get<ApiResponse<Brand[]>>('/brands');
    return data;
  },
  create: async (payload: object): Promise<ApiResponse<Brand>> => {
    const { data } = await axiosInstance.post<ApiResponse<Brand>>('/admin/brands', payload);
    return data;
  },
  update: async (id: string, payload: object): Promise<ApiResponse<Brand>> => {
    const { data } = await axiosInstance.put<ApiResponse<Brand>>(`/admin/brands/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await axiosInstance.delete<ApiResponse<null>>(`/admin/brands/${id}`);
    return data;
  },
};
