import api from './axios';

export type Slide = {
  id: number;
  image_url: string;
  title: string | null;
  description: string | null;
  link: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const slidesApi = {
  getList: (params?: { active_only?: boolean }) => 
    api.get('/slides', { params }).then(res => res.data),
    
  getById: (id: number) => 
    api.get(`/slides/${id}`).then(res => res.data),

  create: (data: Partial<Slide>) => 
    api.post('/admin/slides', data).then(res => res.data),

  update: (id: number, data: Partial<Slide>) => 
    api.put(`/admin/slides/${id}`, data).then(res => res.data),

  updateOrder: (ids: number[]) =>
    api.put('/admin/slides/order', { ids }).then(res => res.data),

  remove: (id: number) => 
    api.delete(`/admin/slides/${id}`).then(res => res.data),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/admin/slides/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
  }
};
