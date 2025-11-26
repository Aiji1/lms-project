import { 
  LayoutDashboard, 
  Users, 
  BookOpen,
  Bell,
  MessageSquare,
  Calendar, 
  FileText, 
  Settings,
  GraduationCap,
  DollarSign,
  UserCheck,
  ClipboardList,
  Award,
  TrendingUp,
  School,
  Database,
  MapPin,
  Clock,
  Target,
  AlertTriangle,
  PieChart,
  Camera,
  BarChart3,
  QrCode
} from 'lucide-react';

import { MenuItem } from '@/types/permissions';
import { PERMISSION_PRESETS, mergePermissions, createPermissionForRoles } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, VIEW_EDIT_PERMISSIONS } from '@/types/permissions';

/**
 * Universal Menu Configuration dengan Role-Based Access Control
 * 
 * Prinsip:
 * 1. Admin dapat melihat SEMUA menu (dengan full access)
 * 2. Role lain mendapat akses sesuai dengan tanggung jawab mereka
 * 3. Permission granular: view, create, edit, delete
 */
export const universalMenuConfig: MenuItem[] = [
  // DASHBOARD - Universal Access
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={20} />,
    resourceKey: 'dashboard',
    permissions: mergePermissions(
      createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
      createPermissionForRoles(['Kepala_Sekolah', 'Guru', 'Siswa', 'Petugas_Keuangan', 'Orang_Tua'], READ_ONLY_PERMISSIONS)
    ),
    description: 'Halaman utama dashboard sistem'
  },

  // MANAJEMEN DATA - Admin & Management
  {
    label: 'Manajemen Data',
    icon: <Database size={20} />,
    resourceKey: 'manajemen_data',
    permissions: mergePermissions(
      createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
      createPermissionForRoles(['Kepala_Sekolah', 'Guru'], READ_ONLY_PERMISSIONS)
    ),
    description: 'Pengelolaan data master pengguna',
    children: [
      {
        label: 'Data Siswa',
        href: '/admin/siswa',
        icon: <GraduationCap size={18} />,
        resourceKey: 'manajemen_data.data_siswa',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah', 'Guru'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola data siswa dan informasi akademik'
      },
      {
        label: 'Data Guru',
        href: '/admin/guru',
        icon: <UserCheck size={18} />,
        resourceKey: 'manajemen_data.data_guru',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah', 'Guru'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola data guru dan staff pengajar'
      },
      {
        label: 'Data User',
        href: '/admin/users',
        icon: <Users size={18} />,
        resourceKey: 'manajemen_data.data_user',
        permissions: PERMISSION_PRESETS.ADMIN_ONLY,
        description: 'Kelola akun pengguna sistem'
      },
      {
        label: 'Data Orang Tua',
        href: '/admin/orang-tua',
        icon: <Users size={18} />,
        resourceKey: 'manajemen_data.data_orang_tua',
        permissions: PERMISSION_PRESETS.ADMIN_ONLY,
        description: 'Kelola data orang tua siswa'
      }
    ]
  },

  // DATA MASTER - Admin & Management Only
  {
    label: 'Data Master',
    icon: <School size={20} />,
    resourceKey: 'data_master',
    permissions: mergePermissions(
      createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
      createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
    ),
    description: 'Pengaturan data master sistem',
    children: [
      {
        label: 'Tahun Ajaran',
        href: '/admin/tahun-ajaran',
        icon: <Calendar size={18} />,
        resourceKey: 'data_master.tahun_ajaran',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola tahun ajaran aktif'
      },
      {
        label: 'Jurusan',
        href: '/admin/jurusan',
        icon: <MapPin size={18} />,
        resourceKey: 'data_master.jurusan',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola data jurusan sekolah'
      },
      {
        label: 'Kelas',
        href: '/admin/kelas',
        icon: <School size={18} />,
        resourceKey: 'data_master.kelas',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola data kelas dan rombel'
      },
      {
        label: 'Mata Pelajaran',
        href: '/admin/mata-pelajaran',
        icon: <BookOpen size={18} />,
        resourceKey: 'data_master.mata_pelajaran',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola mata pelajaran kurikulum'
      },
      {
        label: 'Kurikulum',
        href: '/admin/kurikulum',
        icon: <FileText size={18} />,
        resourceKey: 'data_master.kurikulum',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola struktur kurikulum'
      }
    ]
  },

  // PEMBELAJARAN - Teachers & Students
  {
    label: 'Pembelajaran',
    icon: <BookOpen size={20} />,
    resourceKey: 'pembelajaran',
    permissions: PERMISSION_PRESETS.LEARNING,
    description: 'Aktivitas belajar mengajar',
    children: [
      {
        label: 'Jadwal Pelajaran',
        href: '/admin/jadwal-pelajaran',
        icon: <Calendar size={18} />,
        resourceKey: 'pembelajaran.jadwal_pelajaran',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin', 'Guru'], FULL_PERMISSIONS),
          createPermissionForRoles(['Siswa', 'Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola jadwal pelajaran'
      },
      {
        label: 'Jurnal Mengajar',
        href: '/pembelajaran/jurnal-mengajar',
        icon: <ClipboardList size={18} />,
        resourceKey: 'pembelajaran.jurnal_mengajar',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola jurnal mengajar harian'
      },
      {
        label: 'Presensi Mapel',
        href: '/presensi/mapel',
        icon: <Clock size={18} />,
        resourceKey: 'pembelajaran.presensi_mapel',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola presensi per mata pelajaran'
      },
      {
        label: 'Nilai Siswa',
        href: '/pembelajaran/nilai-siswa',
        icon: <Award size={18} />,
        resourceKey: 'pembelajaran.nilai_siswa',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
          createPermissionForRoles(['Siswa', 'Orang_Tua', 'Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola dan lihat nilai siswa'
      },
      {
        label: 'Tugas',
        href: '/pembelajaran/tugas',
        icon: <FileText size={18} />,
        resourceKey: 'pembelajaran.tugas',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
          createPermissionForRoles(['Siswa'], READ_ONLY_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola tugas dan pengumpulan'
      },
      {
        label: 'Modul Ajar',
        href: '/pembelajaran/modul-ajar',
        icon: <FileText size={18} />,
        resourceKey: 'pembelajaran.modul_ajar',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin', 'Guru'], FULL_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Upload dan download modul ajar per guru mapel'
      }
    ]
  },

  // ========================================
  // PRESENSI - Attendance System (NEW SEPARATED MENU)
  // ========================================
  {
    label: 'Presensi',
    icon: <UserCheck size={20} />,
    resourceKey: 'presensi',
    permissions: mergePermissions(
      createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
      createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
      createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
    ),
    description: 'Sistem presensi harian siswa',
    children: [
      {
        label: 'Dashboard',
        href: '/presensi/dashboard',
        icon: <BarChart3 size={18} />,
        resourceKey: 'presensi.dashboard',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru', 'Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Dashboard statistik presensi real-time'
      },
      {
        label: 'Scanner',
        href: '/presensi/scanner',
        icon: <Camera size={18} />,
        resourceKey: 'presensi.scanner',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin', 'Guru'], FULL_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Scanner QR Code untuk presensi'
      },
      {
        label: 'Data Presensi',
        href: '/presensi/harian',
        icon: <ClipboardList size={18} />,
        resourceKey: 'presensi.data_presensi',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola data presensi harian siswa'
      }
    ]
  },

  // KEAGAMAAN - Islamic Activities
  {
    label: 'Keagamaan',
    icon: <Target size={20} />,
    resourceKey: 'keagamaan',
    permissions: PERMISSION_PRESETS.LEARNING,
    description: 'Aktivitas keagamaan dan tahfidz',
    children: [
      {
        label: 'Monitoring Adab',
        href: '/keagamaan/monitoring-adab',
        icon: <UserCheck size={18} />,
        resourceKey: 'keagamaan.monitoring_adab',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
          createPermissionForRoles(['Siswa', 'Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Monitor pelaksanaan adab siswa'
      },
      {
        label: 'Monitoring Sholat',
        href: '/keagamaan/monitoring-sholat',
        icon: <Clock size={18} />,
        resourceKey: 'keagamaan.monitoring_sholat',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
          createPermissionForRoles(['Siswa', 'Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Monitor pelaksanaan sholat siswa'
      },
      {
        label: 'Hafalan',
        href: '/keagamaan/hafalan',
        icon: <BookOpen size={18} />,
        resourceKey: 'keagamaan.hafalan',
        permissions: PERMISSION_PRESETS.LEARNING,
        description: 'Kelola program tahfidz dan hafalan'
      }
    ]
  },

  // KEDISIPLINAN - Discipline Management
  {
    label: 'Kedisiplinan',
    icon: <AlertTriangle size={20} />,
    resourceKey: 'kedisiplinan',
    permissions: mergePermissions(
      createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
      createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
      createPermissionForRoles(['Siswa', 'Orang_Tua', 'Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
    ),
    description: 'Kelola pelanggaran dan kedisiplinan',
    children: [
      {
        label: 'Pelanggaran',
        href: '/kedisiplinan/pelanggaran',
        icon: <AlertTriangle size={18} />,
        resourceKey: 'kedisiplinan.pelanggaran',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Daftar pelanggaran siswa'
      }
    ]
  },

  // KEUANGAN - Financial Management
  {
    label: 'Keuangan',
    icon: <DollarSign size={20} />,
    resourceKey: 'keuangan',
    permissions: PERMISSION_PRESETS.FINANCIAL,
    description: 'Pengelolaan keuangan sekolah',
    children: [
      {
        label: 'Jenis Pembayaran',
        href: '/keuangan/jenis-pembayaran',
        icon: <Settings size={18} />,
        resourceKey: 'keuangan.jenis_pembayaran',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin', 'Petugas_Keuangan'], FULL_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola jenis pembayaran sekolah'
      },
      {
        label: 'Tagihan',
        href: '/keuangan/tagihan',
        icon: <FileText size={18} />,
        resourceKey: 'tagihan',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin', 'Petugas_Keuangan'], FULL_PERMISSIONS),
          createPermissionForRoles(['Siswa', 'Orang_Tua'], READ_ONLY_PERMISSIONS),
          createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola tagihan siswa'
      },
      {
        label: 'Pembayaran',
        href: '/keuangan/pembayaran',
        icon: <DollarSign size={18} />,
        resourceKey: 'keuangan.pembayaran',
        permissions: PERMISSION_PRESETS.FINANCIAL,
        description: 'Kelola pembayaran dan transaksi'
      }
    ]
  },

  // KOMUNIKASI - Communication
  {
    label: 'Komunikasi',
    icon: <MessageSquare size={20} />,
    resourceKey: 'komunikasi',
    permissions: mergePermissions(
      createPermissionForRoles(['Admin', 'Kepala_Sekolah', 'Guru', 'Petugas_Keuangan'], FULL_PERMISSIONS),
      createPermissionForRoles(['Siswa', 'Orang_Tua'], READ_ONLY_PERMISSIONS)
    ),
    description: 'Komunikasi dan pengumuman sekolah',
    children: [
      {
        label: 'Pengumuman',
        href: '/komunikasi/pengumuman',
        icon: <Bell size={18} />,
        resourceKey: 'pengumuman',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin', 'Kepala_Sekolah', 'Guru', 'Petugas_Keuangan'], FULL_PERMISSIONS),
          createPermissionForRoles(['Siswa', 'Orang_Tua'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Kelola pengumuman sekolah'
      }
    ]
  },

  // RAPOT - Report Cards
  {
    label: 'Rapot',
    icon: <Award size={20} />,
    resourceKey: 'rapot',
    permissions: PERMISSION_PRESETS.LEARNING,
    description: 'Rapot dan penilaian',
    children: [
      {
        label: 'Rapot Akademik',
        href: '/rapot/akademik',
        icon: <Award size={18} />,
        resourceKey: 'rapot.rapot_akademik',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
          createPermissionForRoles(['Siswa', 'Orang_Tua', 'Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Rapot nilai akademik siswa'
      },
      {
        label: 'Rapot ATT',
        href: '/rapot/att',
        icon: <Target size={18} />,
        resourceKey: 'rapot.att',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], VIEW_EDIT_PERMISSIONS),
          createPermissionForRoles(['Siswa', 'Orang_Tua', 'Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Rapot Akhlak, Tahfidz, dan Tilawah'
      }
    ]
  },

  // LAPORAN - Reports
  {
    label: 'Laporan',
    icon: <PieChart size={20} />,
    resourceKey: 'laporan',
    permissions: PERMISSION_PRESETS.REPORTS,
    description: 'Laporan dan statistik',
    children: [
      {
        label: 'Laporan Presensi',
        href: '/laporan/presensi',
        icon: <TrendingUp size={18} />,
        resourceKey: 'laporan.presensi',
        permissions: PERMISSION_PRESETS.REPORTS,
        description: 'Laporan kehadiran siswa'
      },
      {
        label: 'Laporan Tahfidz',
        href: '/laporan/tahfidz',
        icon: <BookOpen size={18} />,
        resourceKey: 'laporan.tahfidz',
        permissions: PERMISSION_PRESETS.REPORTS,
        description: 'Laporan progress tahfidz'
      },
      {
        label: 'Statistik',
        href: '/laporan/statistik',
        icon: <PieChart size={18} />,
        resourceKey: 'laporan.statistik',
        permissions: mergePermissions(
          createPermissionForRoles(['Admin', 'Kepala_Sekolah'], FULL_PERMISSIONS),
          createPermissionForRoles(['Guru'], READ_ONLY_PERMISSIONS)
        ),
        description: 'Statistik dan analisis data'
      }
    ]
  },

  // SETTINGS - System Settings
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings size={20} />,
    resourceKey: 'settings',
    permissions: mergePermissions(
      createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
      createPermissionForRoles(['Kepala_Sekolah'], READ_ONLY_PERMISSIONS)
    ),
    description: 'Pengaturan sistem',
    children: [
      {
        label: 'Permission Overrides',
        href: '/settings/permissions',
        icon: <Settings size={18} />,
        resourceKey: 'settings.permissions',
        permissions: PERMISSION_PRESETS.ADMIN_ONLY,
        description: 'Kelola override permissions per role/user'
      }
    ]
  }
];