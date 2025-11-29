import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export function usePermission(resourceKey: string) {
  const [permission, setPermission] = useState<Permission>({
    view: false,
    create: false,
    edit: false,
    delete: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermission = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        const role = user.user_type;
        const userId = user.user_id || user.username || user.reference_id;

        // Call API to check permission dengan timestamp untuk prevent cache
        const response = await api.post(`/permission-overrides/check?t=${Date.now()}`, {
          role,
          resource_key: resourceKey,
          user_id: userId,
        });

        if (response.data.success) {
          if (response.data.data) {
            // Ada override dari database
            setPermission(response.data.data);
          } else {
            // No override - use default based on role
            const defaultPerms = getDefaultPermission(role, resourceKey);
            setPermission(defaultPerms);
          }
        }
      } catch (error) {
        console.error('Failed to load permission:', error);
        // ✅ Default to NO ACCESS on error for security
        setPermission({ view: false, create: false, edit: false, delete: false });
      } finally {
        setLoading(false);
      }
    };

    loadPermission();

    // Listen for permission updates
    const handlePermissionUpdate = () => {
      console.log('Permission updated, reloading...');
      loadPermission();
    };

    window.addEventListener('permission-overrides-saved', handlePermissionUpdate);

    return () => {
      window.removeEventListener('permission-overrides-saved', handlePermissionUpdate);
    };
  }, [resourceKey]);

  return {
    permission,
    loading,
    canView: permission.view,
    canCreate: permission.create,
    canEdit: permission.edit,
    canDelete: permission.delete,
  };
}

// Helper: Default permissions berdasarkan role
function getDefaultPermission(role: string, resourceKey: string): Permission {
  // ========================================
  // ADMIN - FULL ACCESS TO EVERYTHING
  // ========================================
  if (role === 'Admin') {
    return { view: true, create: true, edit: true, delete: true };
  }

  // ========================================
  // KEPALA SEKOLAH
  // ========================================
  if (role === 'Kepala_Sekolah') {
    // Full access
    if (
      resourceKey === 'pengumuman' ||
      resourceKey === 'dashboard'
    ) {
      return { view: true, create: true, edit: true, delete: true };
    }
    
    // Read-only access to most data
    if (
      resourceKey === 'manajemen_data.data_siswa' ||
      resourceKey === 'manajemen_data.data_guru' ||
      resourceKey === 'data_master.tahun_ajaran' ||
      resourceKey === 'data_master.jurusan' ||
      resourceKey === 'data_master.kelas' ||
      resourceKey === 'data_master.mata_pelajaran' ||
      resourceKey === 'data_master.kurikulum' ||
      resourceKey === 'pembelajaran.jadwal_pelajaran' ||
      resourceKey === 'pembelajaran.jurnal_mengajar' ||
      resourceKey === 'pembelajaran.presensi_harian' ||
      resourceKey === 'pembelajaran.presensi_mapel' ||
      resourceKey === 'pembelajaran.nilai_siswa' ||
      resourceKey === 'pembelajaran.tugas' ||
      resourceKey === 'pembelajaran.modul_ajar' ||
      resourceKey === 'keagamaan.monitoring_adab' ||
      resourceKey === 'keagamaan.monitoring_sholat' ||
      resourceKey === 'keagamaan.hafalan' ||
      resourceKey === 'kedisiplinan.pelanggaran' ||
      resourceKey === 'tagihan' ||
      resourceKey === 'keuangan.pembayaran' ||
      resourceKey === 'keuangan.jenis_pembayaran' ||
      resourceKey === 'rapot.rapot_akademik' ||
      resourceKey === 'rapot.att' ||
      resourceKey === 'laporan.presensi' ||
      resourceKey === 'laporan.tahfidz' ||
      resourceKey === 'laporan.statistik'
    ) {
      return { view: true, create: false, edit: false, delete: false };
    }
    
    // No access
    if (
      resourceKey === 'manajemen_data.data_user' ||
      resourceKey === 'manajemen_data.data_orang_tua' ||
      resourceKey === 'settings.permissions'
    ) {
      return { view: false, create: false, edit: false, delete: false };
    }
    
    // Default: read-only
    return { view: true, create: false, edit: false, delete: false };
  }

  // ========================================
  // GURU
  // ========================================
  if (role === 'Guru') {
    // Full access - can create, edit, delete
    if (
      resourceKey === 'pengumuman' ||
      resourceKey === 'pembelajaran.jurnal_mengajar' ||
      resourceKey === 'pembelajaran.presensi_harian' ||
      resourceKey === 'pembelajaran.presensi_mapel' ||
      resourceKey === 'pembelajaran.tugas' ||
      resourceKey === 'pembelajaran.modul_ajar' ||
      resourceKey === 'keagamaan.monitoring_adab' ||
      resourceKey === 'keagamaan.monitoring_sholat' ||
      resourceKey === 'keagamaan.hafalan'
    ) {
      return { view: true, create: true, edit: true, delete: true };
    }
    
    // View + Edit only (can't create new or delete)
    if (
      resourceKey === 'pembelajaran.nilai_siswa' ||
      resourceKey === 'kedisiplinan.pelanggaran' ||
      resourceKey === 'rapot.rapot_akademik' ||
      resourceKey === 'rapot.att'
    ) {
      return { view: true, create: false, edit: true, delete: false };
    }
    
    // Read-only access
    if (
      resourceKey === 'dashboard' ||
      resourceKey === 'manajemen_data.data_siswa' ||
      resourceKey === 'manajemen_data.data_guru' ||
      resourceKey === 'pembelajaran.jadwal_pelajaran' ||
      resourceKey === 'laporan.presensi' ||
      resourceKey === 'laporan.tahfidz' ||
      resourceKey === 'laporan.statistik'
    ) {
      return { view: true, create: false, edit: false, delete: false };
    }
    
    // NO ACCESS - Financial, User Management, Master Data
    if (
      resourceKey === 'manajemen_data.data_user' ||
      resourceKey === 'manajemen_data.data_orang_tua' ||
      resourceKey === 'data_master.tahun_ajaran' ||
      resourceKey === 'data_master.jurusan' ||
      resourceKey === 'data_master.kelas' ||
      resourceKey === 'data_master.mata_pelajaran' ||
      resourceKey === 'data_master.kurikulum' ||
      resourceKey === 'tagihan' ||
      resourceKey === 'keuangan.pembayaran' ||
      resourceKey === 'keuangan.jenis_pembayaran' ||
      resourceKey === 'settings.permissions'
    ) {
      return { view: false, create: false, edit: false, delete: false };
    }
    
    // Default for Guru: read-only for learning materials
    return { view: true, create: false, edit: false, delete: false };
  }

  // ========================================
  // PETUGAS KEUANGAN
  // ========================================
  if (role === 'Petugas_Keuangan') {
    // Full access to financial resources
    if (
      resourceKey === 'tagihan' ||
      resourceKey === 'keuangan.pembayaran' ||
      resourceKey === 'keuangan.jenis_pembayaran'
    ) {
      return { view: true, create: true, edit: true, delete: true };
    }
    
    // Can create announcements
    if (resourceKey === 'pengumuman') {
      return { view: true, create: true, edit: true, delete: true };
    }
    
    // Read-only to student data (for billing purposes)
    if (
      resourceKey === 'dashboard' ||
      resourceKey === 'manajemen_data.data_siswa' ||
      resourceKey === 'data_master.kelas' ||
      resourceKey === 'laporan.statistik'
    ) {
      return { view: true, create: false, edit: false, delete: false };
    }
    
    // NO ACCESS - Teacher data, User management, Learning
    if (
      resourceKey === 'manajemen_data.data_user' ||
      resourceKey === 'manajemen_data.data_guru' ||
      resourceKey === 'manajemen_data.data_orang_tua' ||
      resourceKey === 'settings.permissions' ||
      resourceKey.startsWith('pembelajaran.') ||
      resourceKey.startsWith('keagamaan.') ||
      resourceKey.startsWith('kedisiplinan.') ||
      resourceKey.startsWith('rapot.') ||
      resourceKey === 'data_master.tahun_ajaran' ||
      resourceKey === 'data_master.jurusan' ||
      resourceKey === 'data_master.mata_pelajaran' ||
      resourceKey === 'data_master.kurikulum'
    ) {
      return { view: false, create: false, edit: false, delete: false };
    }
    
    // Default: no access
    return { view: false, create: false, edit: false, delete: false };
  }

  // ========================================
  // SISWA
  // ========================================
  if (role === 'Siswa') {
    // Can view own data
    if (
      resourceKey === 'dashboard' ||
      resourceKey === 'pengumuman' ||
      resourceKey === 'pembelajaran.jadwal_pelajaran' ||
      resourceKey === 'pembelajaran.nilai_siswa' ||
      resourceKey === 'pembelajaran.tugas' ||
      resourceKey === 'pembelajaran.modul_ajar' ||
      resourceKey === 'keagamaan.hafalan' ||
      resourceKey === 'tagihan' ||
      resourceKey === 'keuangan.pembayaran' ||
      resourceKey === 'rapot.rapot_akademik' ||
      resourceKey === 'rapot.att'
    ) {
      return { view: true, create: false, edit: false, delete: false };
    }
    
    // NO ACCESS to management, admin, other students' data
    if (
      resourceKey.startsWith('manajemen_data.') ||
      resourceKey.startsWith('data_master.') ||
      resourceKey.startsWith('settings.') ||
      resourceKey === 'keuangan.jenis_pembayaran' ||
      resourceKey === 'pembelajaran.jurnal_mengajar' ||
      resourceKey === 'pembelajaran.presensi_harian' ||
      resourceKey === 'pembelajaran.presensi_mapel' ||
      resourceKey === 'keagamaan.monitoring_adab' ||
      resourceKey === 'keagamaan.monitoring_sholat' ||
      resourceKey === 'kedisiplinan.pelanggaran' ||
      resourceKey.startsWith('laporan.')
    ) {
      return { view: false, create: false, edit: false, delete: false };
    }
    
    // Default: no access
    return { view: false, create: false, edit: false, delete: false };
  }

  // ========================================
  // ORANG TUA
  // ========================================
  if (role === 'Orang_Tua') {
    // Can view child's data
    if (
      resourceKey === 'dashboard' ||
      resourceKey === 'pengumuman' ||
      resourceKey === 'pembelajaran.jadwal_pelajaran' ||
      resourceKey === 'pembelajaran.nilai_siswa' ||
      resourceKey === 'pembelajaran.tugas' ||
      resourceKey === 'keagamaan.hafalan' ||
      resourceKey === 'tagihan' ||
      resourceKey === 'keuangan.pembayaran' ||
      resourceKey === 'rapot.rapot_akademik' ||
      resourceKey === 'rapot.att' ||
      resourceKey === 'laporan.presensi' ||
      resourceKey === 'laporan.tahfidz'
    ) {
      return { view: true, create: false, edit: false, delete: false };
    }
    
    // NO ACCESS to management, admin, teacher functions
    if (
      resourceKey.startsWith('manajemen_data.') ||
      resourceKey.startsWith('data_master.') ||
      resourceKey.startsWith('settings.') ||
      resourceKey === 'keuangan.jenis_pembayaran' ||
      resourceKey === 'pembelajaran.jurnal_mengajar' ||
      resourceKey === 'pembelajaran.presensi_harian' ||
      resourceKey === 'pembelajaran.presensi_mapel' ||
      resourceKey === 'pembelajaran.modul_ajar' ||
      resourceKey === 'keagamaan.monitoring_adab' ||
      resourceKey === 'keagamaan.monitoring_sholat' ||
      resourceKey === 'kedisiplinan.pelanggaran' ||
      resourceKey === 'laporan.statistik'
    ) {
      return { view: false, create: false, edit: false, delete: false };
    }
    
    // Default: no access
    return { view: false, create: false, edit: false, delete: false };
  }

  // ========================================
  // DEFAULT - NO ACCESS (for safety)
  // ========================================
  return { view: false, create: false, edit: false, delete: false };
}