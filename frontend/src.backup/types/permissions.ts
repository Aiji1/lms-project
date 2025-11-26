// Permission types for role-based access control
export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  [role: string]: Permission;
}

export interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  permissions: RolePermissions;
  children?: MenuItem[];
  description?: string; // Deskripsi untuk tooltip
  // Optional key to identify resource for permission overrides
  resourceKey?: string;
}

export type UserRole = 
  | 'Admin' 
  | 'Kepala_Sekolah' 
  | 'Guru' 
  | 'Siswa' 
  | 'Petugas_Keuangan' 
  | 'Orang_Tua';

export const DEFAULT_PERMISSIONS: Permission = {
  view: false,
  create: false,
  edit: false,
  delete: false
};

export const FULL_PERMISSIONS: Permission = {
  view: true,
  create: true,
  edit: true,
  delete: true
};

export const READ_ONLY_PERMISSIONS: Permission = {
  view: true,
  create: false,
  edit: false,
  delete: false
};

export const VIEW_CREATE_PERMISSIONS: Permission = {
  view: true,
  create: true,
  edit: false,
  delete: false
};

export const VIEW_EDIT_PERMISSIONS: Permission = {
  view: true,
  create: true,
  edit: true,
  delete: false
};