import axiosInstance from './axios';
import type { ApiResponse, Category } from '../types';

export const categoriesApi = {
  getList: async (params?: object): Promise<ApiResponse<any>> => {
    const { data } = await axiosInstance.get<ApiResponse<any>>('/categories', { params });
    return data;
  },
  create: async (payload: object): Promise<ApiResponse<Category>> => {
    const { data } = await axiosInstance.post<ApiResponse<Category>>('/admin/categories', payload);
    return data;
  },
  update: async (id: string, payload: object): Promise<ApiResponse<Category>> => {
    const { data } = await axiosInstance.put<ApiResponse<Category>>(`/admin/categories/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await axiosInstance.delete<ApiResponse<null>>(`/admin/categories/${id}`);
    return data;
  },
};
