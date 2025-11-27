import { useState, useEffect } from 'react';
import { fetchMergedOverrides } from '@/lib/permissionOverrides';

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

        // Use cached fetchMergedOverrides instead of direct API call
        const overrideMap = await fetchMergedOverrides({ role, user_id: userId });
        
        // Check if there's an override for this resource
        const override = overrideMap[resourceKey];
        
        if (override) {
          // Use override from database
          setPermission(override);
        } else {
          // No override - use default based on role
          const defaultPerms = getDefaultPermission(role, resourceKey);
          setPermission(defaultPerms);
        }
      } catch (error) {
        console.error('Failed to load permission:', error);
        // Default to NO ACCESS on error for security
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
  // ADMIN - FULL ACCESS TO EVERYTHING
  if (role === 'Admin') {
    return { view: true, create: true, edit: true, delete: true };
  }

  // KEPALA SEKOLAH
  if (role === 'Kepala_Sekolah') {
    if (resourceKey === 'pengumuman' || resourceKey === 'dashboard') {
      return { view: true, create: true, edit: true, delete: true };
    }
    
    if (
      resourceKey === 'manajemen_data.data_siswa' ||
      resourceKey === 'manajemen_data.data_guru' ||
      resourceKey.startsWith('data_master.') ||
      resourceKey.startsWith('pembelajaran.') ||
      resourceKey.startsWith('keagamaan.') ||
      resourceKey.startsWith('kedisiplinan.') ||
      resourceKey.startsWith('keuangan.') ||
      resourceKey.startsWith('rapot.') ||
      resourceKey.startsWith('laporan.') ||
      resourceKey === 'tagihan'
    ) {
      return { view: true, create: false, edit: false, delete: false };
    }
    
    if (resourceKey === 'manajemen_data.data_user' || resourceKey === 'settings.permissions') {
      return { view: false, create: false, edit: false, delete: false };
    }
    
    return { view: true, create: false, edit: false, delete: false };
  }

  // GURU
  if (role === 'Guru') {
    if (
      resourceKey === 'pengumuman' ||
      resourceKey === 'pembelajaran.jurnal_mengajar' ||
      resourceKey === 'pembelajaran.presensi_harian' ||
      resourceKey === 'pembelajaran.presensi_mapel' ||
      resourceKey === 'pembelajaran.tugas' ||
      resourceKey === 'pembelajaran.modul_ajar' ||
      resourceKey.startsWith('keagamaan.')
    ) {
      return { view: true, create: true, edit: true, delete: true };
    }
    
    if (
      resourceKey === 'pembelajaran.nilai_siswa' ||
      resourceKey === 'kedisiplinan.pelanggaran' ||
      resourceKey.startsWith('rapot.')
    ) {
      return { view: true, create: false, edit: true, delete: false };
    }
    
    if (
      resourceKey === 'dashboard' ||
      resourceKey === 'manajemen_data.data_siswa' ||
      resourceKey === 'manajemen_data.data_guru' ||
      resourceKey === 'pembelajaran.jadwal_pelajaran' ||
      resourceKey.startsWith('laporan.')
    ) {
      return { view: true, create: false, edit: false, delete: false };
    }
    
    if (
      resourceKey.startsWith('manajemen_data.data_user') ||
      resourceKey.startsWith('data_master.') ||
      resourceKey.startsWith('keuangan.') ||
      resourceKey === 'tagihan' ||
      resourceKey === 'settings.permissions'
    ) {
      return { view: false, create: false, edit: false, delete: false };
    }
    
    return { view: true, create: false, edit: false, delete: false };
  }

  // PETUGAS KEUANGAN
  if (role === 'Petugas_Keuangan') {
    if (
      resourceKey === 'tagihan' ||
      resourceKey.startsWith('keuangan.') ||
      resourceKey === 'pengumuman'
    ) {
      return { view: true, create: true, edit: true, delete: true };
    }
    
    if (
      resourceKey === 'dashboard' ||
      resourceKey === 'manajemen_data.data_siswa' ||
      resourceKey === 'data_master.kelas' ||
      resourceKey === 'laporan.statistik'
    ) {
      return { view: true, create: false, edit: false, delete: false };
    }
    
    return { view: false, create: false, edit: false, delete: false };
  }

  // SISWA
  if (role === 'Siswa') {
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
      resourceKey.startsWith('rapot.')
    ) {
      return { view: true, create: false, edit: false, delete: false };
    }
    
    return { view: false, create: false, edit: false, delete: false };
  }

  // ORANG TUA
  if (role === 'Orang_Tua') {
    if (
      resourceKey === 'dashboard' ||
      resourceKey === 'pengumuman' ||
      resourceKey === 'pembelajaran.jadwal_pelajaran' ||
      resourceKey === 'pembelajaran.nilai_siswa' ||
      resourceKey === 'pembelajaran.tugas' ||
      resourceKey === 'keagamaan.hafalan' ||
      resourceKey === 'tagihan' ||
      resourceKey === 'keuangan.pembayaran' ||
      resourceKey.startsWith('rapot.') ||
      resourceKey === 'laporan.presensi' ||
      resourceKey === 'laporan.tahfidz'
    ) {
      return { view: true, create: false, edit: false, delete: false };
    }
    
    return { view: false, create: false, edit: false, delete: false };
  }

  // DEFAULT - NO ACCESS
  return { view: false, create: false, edit: false, delete: false };
}
