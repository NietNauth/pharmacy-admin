import axios from './axios';
import type { ApiResponse, Coupon } from '../types';

export const couponApi = {
  getList: async (): Promise<ApiResponse<Coupon[]>> => {
    const { data } = await axios.get<ApiResponse<Coupon[]>>('/admin/coupons');
    return data;
  },
  create: async (payload: any): Promise<ApiResponse<Coupon>> => {
    const { data } = await axios.post<ApiResponse<Coupon>>('/admin/coupons', payload);
    return data;
  },
  update: async (id: string, payload: any): Promise<ApiResponse<Coupon>> => {
    const { data } = await axios.put<ApiResponse<Coupon>>(`/admin/coupons/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await axios.delete<ApiResponse<any>>(`/admin/coupons/${id}`);
    return data;
  },
};
