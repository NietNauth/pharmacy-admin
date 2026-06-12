import axiosInstance from './axios';
import type { LoginPayload, LoginResponse, User, ApiResponse } from '../types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await axiosInstance.post<ApiResponse<LoginResponse>>('/auth/login', payload);
    return data.data;
  },
  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },
  logoutAll: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout-all');
  },
  getMe: async (): Promise<User> => {
    const { data } = await axiosInstance.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },
  changePassword: async (payload: any): Promise<ApiResponse<null>> => {
    const { data } = await axiosInstance.post<ApiResponse<null>>('/auth/change-password', payload);
    return data;
  },
};
