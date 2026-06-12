import axiosInstance from './axios';
import type { PaginatedResponse, ApiResponse, Prescription, PrescriptionStatus, FilterParams } from '../types';

export const prescriptionsApi = {
  // Admin/Pharmacist: get pending prescriptions
  getPending: async (params?: FilterParams): Promise<PaginatedResponse<Prescription>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Prescription>>('/prescriptions/pending', { params });
    return data;
  },
  // Admin/Pharmacist: review a prescription
  review: async (id: string, payload: { status: 'approved' | 'rejected'; reject_reason?: string }): Promise<ApiResponse<Prescription>> => {
    const { data } = await axiosInstance.post<ApiResponse<Prescription>>(`/prescriptions/${id}/review`, payload);
    return data;
  },
  // Customer: own prescriptions
  getList: async (params?: FilterParams & { status?: PrescriptionStatus }): Promise<PaginatedResponse<Prescription>> => {
    const { data } = await axiosInstance.get<PaginatedResponse<Prescription>>('/prescriptions', { params });
    return data;
  },
  getById: async (id: string): Promise<ApiResponse<Prescription>> => {
    const { data } = await axiosInstance.get<ApiResponse<Prescription>>(`/prescriptions/${id}`);
    return data;
  },
  // Admin: assign to branch
  assign: async (id: string, branchId: string): Promise<ApiResponse<Prescription>> => {
    const { data } = await axiosInstance.post<ApiResponse<Prescription>>(`/prescriptions/${id}/assign`, { branch_id: branchId });
    return data;
  },
};
