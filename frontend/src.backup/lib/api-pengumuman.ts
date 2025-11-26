import { api } from './api';

export interface Pengumuman {
  id_pengumuman: number;
  judul: string;
  konten: string;
  kategori: 'Umum' | 'Akademik' | 'Kegiatan' | 'Keuangan' | 'Keagamaan';
  prioritas: 'Normal' | 'Penting' | 'Sangat Penting';
  file_lampiran?: string;
  file_original_name?: string;
  tanggal_mulai: string;
  tanggal_selesai?: string;
  is_pinned: boolean;
  pin_order: number;
  status: 'Draft' | 'Published' | 'Archived';
  target_roles?: string[];
  target_tingkat?: string[];
  target_kelas?: number[];
  target_siswa?: string[];
  target_type: 'all' | 'roles' | 'tingkat' | 'kelas' | 'siswa_spesifik';
  dibuat_oleh: number;
  dibuat_oleh_nama: string;
  dibuat_oleh_role: string;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
}

export interface PengumumanFormData {
  kategori: string[];
  prioritas: string[];
  status: string[];
  target_type: string[];
  roles: string[];
  tingkat: string[];
  kelas: Array<{ id_kelas: number; nama_kelas: string; tingkat: string }>;
}

export interface UnreadCount {
  total: number;
  unread: number;
  read: number;
}

export const pengumumanApi = {
  // Get list pengumuman
  getAll: async (params?: {
    kategori?: string;
    prioritas?: string;
    status?: string;
    search?: string;
    for_user?: string;
    user_type?: string;
    user_kelas?: number;
    user_tingkat?: string;
    aktif_only?: boolean;
    per_page?: number;
    page?: number;
  }) => {
    const response = await api.get('/v1/pengumuman', { params });
    return response.data;
  },

  // Get detail pengumuman
  getById: async (id: number) => {
    const response = await api.get(`/v1/pengumuman/${id}`);
    return response.data;
  },

  // Create pengumuman
  create: async (data: FormData) => {
    // Log untuk debug
    for (let [key, value] of data.entries()) {
      console.log(key, value);
    }
    
    const response = await api.post('/v1/pengumuman', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update pengumuman
  update: async (id: number, data: FormData) => {
    const response = await api.post(`/v1/pengumuman/${id}?_method=PUT`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete pengumuman
  delete: async (id: number) => {
    const response = await api.delete(`/v1/pengumuman/${id}`);
    return response.data;
  },

  // Mark as read
  markAsRead: async (id: number, userIdentifier: string, userType: string) => {
    const response = await api.post(`/v1/pengumuman/${id}/mark-read`, {
      user_identifier: userIdentifier,
      user_type: userType,
    });
    return response.data;
  },

  // Toggle pin
  togglePin: async (id: number) => {
    const response = await api.post(`/v1/pengumuman/${id}/toggle-pin`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (params: {
    user_identifier: string;
    user_type: string;
    user_kelas?: number;
    user_tingkat?: string;
  }) => {
    const response = await api.get('/v1/pengumuman/unread-count', { params });
    return response.data;
  },

  // Get form data
  getFormData: async () => {
    const response = await api.get('/v1/pengumuman/form-data');
    return response.data;
  },
};