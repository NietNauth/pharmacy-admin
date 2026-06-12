import axiosInstance from './axios';

export const notificationApi = {
  getNotifications: (page: number = 1) => axiosInstance.get(`/notifications?page=${page}`),
  markAsRead: (id: string) => axiosInstance.post(`/notifications/${id}/read`),
  markAllAsRead: () => axiosInstance.post('/notifications/read-all'),
};
