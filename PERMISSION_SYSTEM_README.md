# 🔒 Permission & Route Protection System - LMS SMA Al-Azhar 7

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Status](#implementation-status)
4. [How to Apply Protection](#how-to-apply-protection)
5. [Code Templates](#code-templates)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Sistem permission management terpusat untuk mengontrol akses menu per role dengan fitur:
- ✅ **Route Protection** - Block akses langsung via URL
- ✅ **UI Permission** - Hide/show buttons (Create, Edit, Delete)
- ✅ **Dynamic Override** - Admin bisa ubah permission via UI
- ✅ **Role-based & User-specific** - Support override per role atau per user
- ✅ **Auto-refresh Sidebar** - Menu auto hide/show setelah permission diubah

---

## 🏗️ Architecture

### **Backend (Laravel 12)**

#### 1. Database Table: `permission_overrides`
```sql
CREATE TABLE permission_overrides (
  id_override INT PRIMARY KEY AUTO_INCREMENT,
  target_type ENUM('role', 'user') NOT NULL,
  target_id VARCHAR(255) NOT NULL,
  resource_key VARCHAR(255) NOT NULL,
  view TINYINT(1) DEFAULT 0,
  create TINYINT(1) DEFAULT 0,
  edit TINYINT(1) DEFAULT 0,
  delete TINYINT(1) DEFAULT 0,
  UNIQUE KEY unique_override (target_type, target_id, resource_key)
);
```

#### 2. Model: `PermissionOverride.php`
Location: `backend/app/Models/PermissionOverride.php`
```php
<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PermissionOverride extends Model
{
    public $timestamps = false;
    protected $table = 'permission_overrides';
    protected $primaryKey = 'id_override';
    
    protected $fillable = [
        'target_type',
        'target_id',
        'resource_key',
        'view',
        'create',
        'edit',
        'delete',
    ];
    
    protected $casts = [
        'view' => 'boolean',
        'create' => 'boolean',
        'edit' => 'boolean',
        'delete' => 'boolean',
    ];
}
```

#### 3. Controller: `PermissionOverrideController.php`
Location: `backend/app/Http/Controllers/Api/PermissionOverrideController.php`

**6 Endpoints:**
- `GET /v1/permission-overrides` - List all overrides (with filters)
- `GET /v1/permission-overrides/merged?role=X` - Get merged permissions for role
- `POST /v1/permission-overrides/check` - Check specific permission
- `POST /v1/permission-overrides` - Create override
- `PUT /v1/permission-overrides/{id}` - Update override
- `DELETE /v1/permission-overrides/{id}` - Delete override

#### 4. Routes: `routes/api.php`
```php
use App\Http\Controllers\Api\PermissionOverrideController;

Route::prefix('v1')->group(function () {
    Route::get('/permission-overrides', [PermissionOverrideController::class, 'index']);
    Route::get('/permission-overrides/merged', [PermissionOverrideController::class, 'merged']);
    Route::post('/permission-overrides/check', [PermissionOverrideController::class, 'check']);
    Route::post('/permission-overrides', [PermissionOverrideController::class, 'store']);
    Route::put('/permission-overrides/{id}', [PermissionOverrideController::class, 'update']);
    Route::delete('/permission-overrides/{id}', [PermissionOverrideController::class, 'destroy']);
});
```

---

### **Frontend (Next.js 15 + TypeScript)**

#### 1. Hooks

**`usePermission.ts`** - Get permission untuk specific resource
Location: `frontend/src/hooks/usePermission.ts`
```typescript
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Permission } from '@/types/permissions';

export function usePermission(resourceKey: string) {
  const [permission, setPermission] = useState<Permission>({ 
    view: false, create: false, edit: false, delete: false 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermission = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await api.post('/v1/permission-overrides/check', {
          role: user.user_type,
          resource_key: resourceKey,
          user_id: user.id || user.user_id
        });

        if (response.data.success && response.data.data) {
          setPermission(response.data.data);
        } else {
          // Use default permission
          const defaultPerm = getDefaultPermission(user.user_type, resourceKey);
          setPermission(defaultPerm);
        }
      } catch (error) {
        console.error('Failed to fetch permission:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermission();
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

function getDefaultPermission(role: string, resourceKey: string): Permission {
  // Logic untuk default permission berdasarkan role
  if (role === 'Admin') {
    return { view: true, create: true, edit: true, delete: true };
  }
  // ... dst
  return { view: false, create: false, edit: false, delete: false };
}
```

**`useRouteProtection.ts`** - Protect route dari akses langsung
Location: `frontend/src/hooks/useRouteProtection.ts`
```typescript
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from './usePermission';

interface RouteProtectionOptions {
  resourceKey: string;
  requireCreate?: boolean;
  requireEdit?: boolean;
  requireDelete?: boolean;
  redirectTo?: string;
}

export function useRouteProtection(options: RouteProtectionOptions) {
  const router = useRouter();
  const { permission, loading } = usePermission(options.resourceKey);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    let authorized = permission.view;

    if (options.requireCreate && !permission.create) {
      authorized = false;
    }
    if (options.requireEdit && !permission.edit) {
      authorized = false;
    }
    if (options.requireDelete && !permission.delete) {
      authorized = false;
    }

    setIsAuthorized(authorized);

    if (!authorized) {
      const redirectPath = options.redirectTo || '/dashboard';
      console.warn(`Access denied to ${options.resourceKey}. Redirecting to ${redirectPath}`);
      router.push(redirectPath);
    }
  }, [loading, permission, options, router]);

  return {
    isAuthorized,
    loading,
    permission,
  };
}
```

#### 2. Components

**`Sidebar.tsx`** - Auto hide menu based on permission
Location: `frontend/src/components/layout/Sidebar.tsx`

Key features:
- Load permission overrides on mount
- Listen to `permission-overrides-saved` event untuk refresh
- Filter menu items based on `canView` permission
- Auto-expand menu yang mengandung active page

#### 3. Config

**`menuConfig.tsx`** - Define resource keys untuk setiap menu
Location: `frontend/src/config/menuConfig.tsx`
```typescript
export const universalMenuConfig: MenuItem[] = [
  {
    label: 'Komunikasi',
    icon: <MessageSquare size={20} />,
    resourceKey: 'komunikasi',
    permissions: {...},
    children: [
      {
        label: 'Pengumuman',
        href: '/komunikasi/pengumuman',
        icon: <Bell size={18} />,
        resourceKey: 'pengumuman',  // ← Resource key untuk permission check
        permissions: {...},
      }
    ]
  },
  {
    label: 'Manajemen Data',
    icon: <Users size={20} />,
    resourceKey: 'manajemen_data',
    children: [
      {
        label: 'Data Siswa',
        href: '/admin/siswa',
        resourceKey: 'manajemen_data.data_siswa',  // ← Nested resource key
        permissions: {...},
      }
    ]
  }
];
```

#### 4. Permission Management Page

Location: `frontend/src/app/(dashboard)/settings/permissions/page.tsx`

Features:
- Select role dropdown
- Search menu
- Expand/collapse menu groups
- 5 access levels: None, View Only, View+Create, View+Edit, Full Access
- Bulk save dengan batch API calls
- Success/error notifications
- Auto-refresh sidebar setelah save

---

## 📊 Implementation Status

### ✅ **Completed:**
1. ✅ Backend API (Controller, Routes, Model)
2. ✅ Frontend Hooks (usePermission, useRouteProtection)
3. ✅ Sidebar auto-hide menu
4. ✅ Permission Manager UI
5. ✅ **Pengumuman** - Full protection
6. ✅ **Data Siswa** - Full protection

### ⏳ **Pending (Need Route Protection):**

**Manajemen Data:**
- Data Guru → `resourceKey: 'manajemen_data.data_guru'`
- Data User → `resourceKey: 'manajemen_data.data_user'`

**Keuangan:**
- Tagihan → `resourceKey: 'tagihan'`
- Pembayaran → `resourceKey: 'keuangan.pembayaran'`
- Jenis Pembayaran → `resourceKey: 'keuangan.jenis_pembayaran'`

**Data Master:**
- Tahun Ajaran → `resourceKey: 'data_master.tahun_ajaran'`
- Jurusan → `resourceKey: 'data_master.jurusan'`
- Kelas → `resourceKey: 'data_master.kelas'`
- Mata Pelajaran → `resourceKey: 'data_master.mata_pelajaran'`
- Kurikulum → `resourceKey: 'data_master.kurikulum'`

**Pembelajaran:**
- Jadwal Pelajaran → `resourceKey: 'pembelajaran.jadwal_pelajaran'`
- Jurnal Mengajar → `resourceKey: 'pembelajaran.jurnal_mengajar'`
- Presensi Harian → `resourceKey: 'pembelajaran.presensi_harian'`
- Presensi Mapel → `resourceKey: 'pembelajaran.presensi_mapel'`
- Nilai Siswa → `resourceKey: 'pembelajaran.nilai_siswa'`
- Tugas → `resourceKey: 'pembelajaran.tugas'`
- Modul Ajar → `resourceKey: 'pembelajaran.modul_ajar'`

**Keagamaan:**
- Monitoring Adab → `resourceKey: 'keagamaan.monitoring_adab'`
- Monitoring Sholat → `resourceKey: 'keagamaan.monitoring_sholat'`
- Hafalan → `resourceKey: 'keagamaan.hafalan'`

**Kedisiplinan:**
- Pelanggaran → `resourceKey: 'kedisiplinan.pelanggaran'`

**Rapot:**
- Rapot Akademik → `resourceKey: 'rapot.rapot_akademik'`
- ATT → `resourceKey: 'rapot.att'`

**Laporan:**
- Laporan Presensi → `resourceKey: 'laporan.presensi'`
- Laporan Tahfidz → `resourceKey: 'laporan.tahfidz'`
- Laporan Statistik → `resourceKey: 'laporan.statistik'`

---

## 🚀 How to Apply Protection

### **Step-by-Step untuk Setiap Page:**

#### **1. Import Hooks**
Tambahkan di bagian atas file:
```typescript
import { usePermission } from '@/hooks/usePermission';
import { useRouteProtection } from '@/hooks/useRouteProtection';
```

#### **2. Add Route Protection**
Di dalam component function, tambahkan di paling atas:
```typescript
export default function YourPage() {
  // Route protection - redirect if no view permission
  const { isAuthorized, loading: permLoading } = useRouteProtection({
    resourceKey: 'your.resource.key',  // ← Sesuaikan dengan resource key di menuConfig
    redirectTo: '/dashboard'
  });

  // Get permissions from centralized system
  const { canCreate, canEdit, canDelete } = usePermission('your.resource.key');

  // ... existing states ...
```

#### **3. Add Loading State**
Sebelum return statement utama, tambahkan:
```typescript
  // Show loading while checking permission
  if (permLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If not authorized, return null (will redirect)
  if (!isAuthorized) {
    return null;
  }

  // Render page content...
  return (
    <div>...</div>
  );
```

#### **4. Replace Permission Checks**
Ganti hardcoded permission checks dengan hook:

**Before:**
```typescript
{userPermissions.create && (
  <button>Tambah Data</button>
)}
{userPermissions.edit && (
  <button>Edit</button>
)}
{userPermissions.delete && (
  <button>Hapus</button>
)}
```

**After:**
```typescript
{canCreate && (
  <button>Tambah Data</button>
)}
{canEdit && (
  <button>Edit</button>
)}
{canDelete && (
  <button>Hapus</button>
)}
```

---

## 📝 Code Templates

### **Template 1: Simple CRUD Page**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useRouteProtection } from '@/hooks/useRouteProtection';

export default function YourPage() {
  // Route protection
  const { isAuthorized, loading: permLoading } = useRouteProtection({
    resourceKey: 'your.resource.key',
    redirectTo: '/dashboard'
  });

  // Get permissions
  const { canCreate, canEdit, canDelete } = usePermission('your.resource.key');

  // States
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Your fetch logic
  };

  // Loading state
  if (permLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  // Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Page Title</h1>
        {canCreate && (
          <button className="btn btn-primary">
            <Plus size={20} />
            Tambah Data
          </button>
        )}
      </div>

      {/* Table */}
      <table>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>
                <Eye size={16} />
                {canEdit && <Edit size={16} />}
                {canDelete && <Trash2 size={16} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### **Template 2: Page with Import/Export**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Plus, Upload, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import ImportModal from '@/components/forms/ImportModal';

export default function YourPage() {
  const { isAuthorized, loading: permLoading } = useRouteProtection({
    resourceKey: 'your.resource.key',
    redirectTo: '/dashboard'
  });

  const { canCreate, canEdit, canDelete } = usePermission('your.resource.key');

  const [showImportModal, setShowImportModal] = useState(false);

  if (permLoading || isAuthorized === null) {
    return <LoadingScreen />;
  }

  if (!isAuthorized) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex gap-3">
        {canCreate && (
          <>
            <button onClick={() => setShowImportModal(true)}>
              <Upload size={20} />
              Import Excel
            </button>
            <button>
              <Plus size={20} />
              Tambah Data
            </button>
          </>
        )}
        <button>
          <Download size={20} />
          Export
        </button>
      </div>

      {/* Content */}
      {/* ... */}

      {/* Import Modal */}
      {canCreate && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => fetchData()}
          title="Import Data"
          endpoint="/v1/your-endpoint/import"
          templateEndpoint="/v1/your-endpoint/template"
        />
      )}
    </div>
  );
}
```

---

## 🧪 Testing Guide

### **1. Test Route Protection**

**Scenario:** Login sebagai Guru, set permission ke "None", akses langsung via URL

**Steps:**
1. Login sebagai Admin
2. Buka `/settings/permissions`
3. Pilih Role: **Guru**
4. Set menu ke **"None"** (🚫)
5. Klik "Simpan Perubahan"
6. Logout → Login sebagai Guru
7. Akses langsung via URL: `http://localhost:3000/admin/siswa`

**Expected:**
- ✅ Auto-redirect ke `/dashboard`
- ✅ Menu tidak muncul di sidebar

---

### **2. Test UI Permission**

**Scenario:** Login sebagai Guru, set permission ke "View Only"

**Steps:**
1. Login sebagai Admin
2. Set Guru ke **"View Only"** (👁️)
3. Simpan
4. Login sebagai Guru
5. Buka `/admin/siswa`

**Expected:**
- ✅ Bisa lihat list
- ❌ Tidak ada tombol "Tambah Siswa"
- ❌ Tidak ada tombol "Import Excel"
- ❌ Tidak ada checkbox (bulk delete)
- ✅ Ada icon "Eye" (view detail)
- ❌ Tidak ada icon "Edit"
- ❌ Tidak ada icon "Delete"

---

### **3. Test Permission Override**

**Scenario:** Ubah permission dari View Only → Full Access

**Steps:**
1. Login sebagai Admin
2. Set Guru dari "View Only" → **"Full Access"** (⚡)
3. Klik "Simpan Perubahan"
4. **JANGAN LOGOUT** - Stay di page Guru
5. Refresh page (F5)

**Expected:**
- ✅ Sidebar auto-update (menu muncul/hilang)
- ✅ Notifikasi hijau "Berhasil Disimpan!"
- ✅ Setelah refresh, semua tombol muncul (Create, Edit, Delete)

---

### **4. Test API Endpoints**
```bash
# Test merged overrides
curl -X GET "http://localhost:8000/api/v1/permission-overrides/merged?role=Guru"

# Expected response:
{
  "pengumuman": {
    "view": true,
    "create": false,
    "edit": false,
    "delete": false
  },
  "manajemen_data.data_siswa": {
    "view": true,
    "create": false,
    "edit": false,
    "delete": false
  }
}

# Test check permission
curl -X POST "http://localhost:8000/api/v1/permission-overrides/check" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Guru",
    "resource_key": "pengumuman"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "view": true,
    "create": false,
    "edit": false,
    "delete": false
  },
  "source": "role_override"
}
```

---

## 🐛 Troubleshooting

### **Problem 1: Permission tidak update setelah save**

**Cause:** Cache issue atau event listener tidak jalan

**Solution:**
```typescript
// Di Sidebar.tsx, pastikan ada listener:
useEffect(() => {
  const handler = () => {
    loadOverrides();
  };
  window.addEventListener('permission-overrides-saved', handler);
  return () => window.removeEventListener('permission-overrides-saved', handler);
}, [loadOverrides]);

// Di Permission page, pastikan dispatch event:
window.dispatchEvent(new Event('permission-overrides-saved'));
```

---

### **Problem 2: Menu tidak hilang dari sidebar**

**Cause:** Resource key mismatch atau filter logic salah

**Solution:**
1. Check console log di Sidebar.tsx:
```
   Menu Komunikasi (komunikasi): parentViewable: true hasVisibleChildren: true
   Child Pengumuman (pengumuman): canView: true
```

2. Pastikan resource key di `menuConfig.tsx` sama dengan yang di database

3. Check filter logic di Sidebar:
```typescript
   const visibleChildren = item.children!.filter(child => {
     const childPerms = child.resourceKey
       ? mergeItemPermissions(child.permissions, overrideMap, child.resourceKey)
       : child.permissions;
     
     const userPerm = getUserPermission(userType, childPerms);
     return userPerm.view;  // ← Must check .view explicitly
   });
```

---

### **Problem 3: 404 Error di `/settings/permissions`**

**Cause:** File tidak ada atau Next.js cache

**Solution:**
```bash
# Check file exists
ls -la src/app/\(dashboard\)/settings/permissions/page.tsx

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

### **Problem 4: Permission save gagal (Error 422)**

**Cause:** Validation error di backend

**Solution:**
Check terminal backend untuk error detail:
```bash
tail -f storage/logs/laravel.log
```

Pastikan semua boolean fields ada:
```typescript
const payload = {
  target_type: 'role',
  target_id: selectedRole,
  resource_key: resourceKey,
  view: true,      // ← Must be boolean
  create: false,   // ← Must be boolean
  edit: false,     // ← Must be boolean
  delete: false,   // ← Must be boolean
};
```

---

## 📚 Resource Keys Reference

### **Naming Convention:**
- **Parent menu:** `komunikasi`, `keuangan`, `pembelajaran`
- **Submenu:** `pengumuman`, `tagihan`, `pembayaran`
- **Nested:** `data_master.tahun_ajaran`, `pembelajaran.jadwal_pelajaran`

### **Complete List:**
```typescript
const resourceKeys = {
  // Komunikasi
  'komunikasi': 'Parent menu',
  'pengumuman': 'Submenu',

  // Manajemen Data
  'manajemen_data': 'Parent menu',
  'manajemen_data.data_siswa': 'Submenu',
  'manajemen_data.data_guru': 'Submenu',
  'manajemen_data.data_user': 'Submenu',

  // Keuangan
  'keuangan': 'Parent menu',
  'tagihan': 'Submenu',
  'keuangan.pembayaran': 'Submenu',
  'keuangan.jenis_pembayaran': 'Submenu',

  // Data Master
  'data_master': 'Parent menu',
  'data_master.tahun_ajaran': 'Submenu',
  'data_master.jurusan': 'Submenu',
  'data_master.kelas': 'Submenu',
  'data_master.mata_pelajaran': 'Submenu',
  'data_master.kurikulum': 'Submenu',

  // Pembelajaran
  'pembelajaran': 'Parent menu',
  'pembelajaran.jadwal_pelajaran': 'Submenu',
  'pembelajaran.jurnal_mengajar': 'Submenu',
  'pembelajaran.presensi_harian': 'Submenu',
  'pembelajaran.presensi_mapel': 'Submenu',
  'pembelajaran.nilai_siswa': 'Submenu',
  'pembelajaran.tugas': 'Submenu',
  'pembelajaran.modul_ajar': 'Submenu',

  // Keagamaan
  'keagamaan': 'Parent menu',
  'keagamaan.monitoring_adab': 'Submenu',
  'keagamaan.monitoring_sholat': 'Submenu',
  'keagamaan.hafalan': 'Submenu',

  // Kedisiplinan
  'kedisiplinan': 'Parent menu',
  'kedisiplinan.pelanggaran': 'Submenu',

  // Rapot
  'rapot': 'Parent menu',
  'rapot.rapot_akademik': 'Submenu',
  'rapot.att': 'Submenu',

  // Laporan
  'laporan': 'Parent menu',
  'laporan.presensi': 'Submenu',
  'laporan.tahfidz': 'Submenu',
  'laporan.statistik': 'Submenu',
};
```

---

## 🎯 Next Steps

### **Priority Implementation Order:**

1. ✅ **Pengumuman** - Done
2. ✅ **Data Siswa** - Done
3. → **Data Guru** - Next (Use Template 2)
4. → **Data User** - Next (Use Template 1)
5. → **Tagihan** - Next (Use Template 2)
6. → **Pembayaran** - Next (Use Template 1)
7. → **Jenis Pembayaran** - Next (Use Template 1)

### **After Priority Pages:**

Copy-paste pattern yang sama untuk:
- Data Master (5 pages)
- Pembelajaran (7 pages)
- Keagamaan (3 pages)
- Kedisiplinan (1 page)
- Rapot (2 pages)
- Laporan (3 pages)

**Total:** ~28 pages need protection

---

## 📞 Support & Contact

**Developer:** Gemilang (with Claude AI Assistant)
**Project:** LMS SMA Islam Al-Azhar 7 Sukoharjo
**Tech Stack:** Laravel 12 + Next.js 15 + TypeScript + MySQL

**Last Updated:** November 23, 2025

---

## 🔗 Related Documentation

- [Laravel Query Builder](https://laravel.com/docs/12.x/queries)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Happy Coding! 🚀**