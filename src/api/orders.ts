import axiosInstance from './axios';
import type { PaginatedResponse, ApiResponse, Order, OrderDetail, OrderStatus, FilterParams } from '../types';

export const ordersApi = {
  // Admin: get all orders
  getAdminList: async (params: FilterParams & { status?: OrderStatus; branch_id?: string; date_from?: string; date_to?: string }): Promise<PaginatedResponse<Order>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Order>>('/admin/orders', { params });
    return data;
  },
  // Admin: update order status
  updateStatus: async (id: string, status: OrderStatus): Promise<ApiResponse<Order>> => {
    const { data } = await axiosInstance.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status });
    return data;
  },
  // Admin: update payment status
  updatePaymentStatus: async (id: string, status: string, transactionId?: string): Promise<ApiResponse<OrderDetail>> => {
    const { data } = await axiosInstance.put<ApiResponse<OrderDetail>>(`/admin/orders/${id}/payment-status`, { 
      status, 
      transaction_id: transactionId 
    });
    return data;
  },
  // Admin: get order detail
  getAdminDetail: async (id: string): Promise<ApiResponse<OrderDetail>> => {
    const { data } = await axiosInstance.get<ApiResponse<OrderDetail>>(`/admin/orders/${id}`);
    return data;
  },
  // Customer: own orders
  getList: async (params: FilterParams & { status?: OrderStatus }): Promise<PaginatedResponse<Order>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Order>>('/orders', { params });
    return data;
  },
  getByCode: async (orderCode: string): Promise<ApiResponse<OrderDetail>> => {
    const { data } = await axiosInstance.get<ApiResponse<OrderDetail>>(`/orders/${orderCode}`);
    return data;
  },
  cancel: async (id: string): Promise<ApiResponse<OrderDetail>> => {
    const { data } = await axiosInstance.post<ApiResponse<OrderDetail>>(`/orders/${id}/cancel`);
    return data;
  },
};
