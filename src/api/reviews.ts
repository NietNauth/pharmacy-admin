import axios from './axios';
import type { ApiResponse, PaginatedResponse, ProductQa } from '../types';

export const reviewsApi = {
  getList: (params?: any) => 
    axios.get<PaginatedResponse<ProductQa>>('/admin/qas', { params }),
    
  reply: (id: string, reply: string) => 
    axios.post<ApiResponse<ProductQa>>(`/admin/qas/${id}/reply`, { reply }),
    
  update: (id: string, data: any) =>
    axios.put<ApiResponse<ProductQa>>(`/admin/qas/${id}/toggle-visibility`, data),

  remove: (id: string) =>
    axios.delete<ApiResponse<any>>(`/admin/qas/${id}`),
};
