import axiosInstance from './axios';
import type { PaginatedResponse, ApiResponse, Product, ProductDetail, ProductStatus, FilterParams } from '../types';

export const productsApi = {
  getList: async (params: FilterParams & { category_id?: string; brand_id?: string; requires_prescription?: boolean; min_price?: number; max_price?: number; status?: ProductStatus }): Promise<PaginatedResponse<Product>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Product>>('/products', { params });
    return data;
  },
  getBySlug: async (slug: string): Promise<ApiResponse<ProductDetail>> => {
    const { data } = await axiosInstance.get<ApiResponse<ProductDetail>>(`/products/${slug}`);
    return data;
  },
  create: async (payload: FormData | object): Promise<ApiResponse<ProductDetail>> => {
    const { data } = await axiosInstance.post<ApiResponse<ProductDetail>>('/admin/products', payload);
    return data;
  },
  update: async (id: string, payload: object): Promise<ApiResponse<ProductDetail>> => {
    const { data } = await axiosInstance.put<ApiResponse<ProductDetail>>(`/admin/products/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<ApiResponse<null>> => {
    const { data } = await axiosInstance.delete<ApiResponse<null>>(`/admin/products/${id}`);
    return data;
  },
  uploadImage: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await axiosInstance.post<ApiResponse<{ url: string }>>('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
};
