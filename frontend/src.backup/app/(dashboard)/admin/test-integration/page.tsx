'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PermissionExamples } from '@/components/examples/PermissionExamples';
import { UserRole } from '@/types/permissions';
import { 
  PERMISSION_PRESETS, 
  createPermissionForRoles,
  hasPermission,
  getUserPermission 
} from '@/lib/permissions';
import { 
  FULL_PERMISSIONS, 
  READ_ONLY_PERMISSIONS, 
  VIEW_EDIT_PERMISSIONS 
} from '@/types/permissions';

/**
 * Halaman untuk testing integrasi sistem permission dengan komponen yang sudah ada
 */
export default function TestIntegrationPage() {
  const { userRole, login, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');

  // Restrict this page to development environment only
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-yellow-800">Halaman Testing Nonaktif</h2>
          <p className="mt-2 text-sm text-yellow-700">
            Halaman test-integration hanya tersedia saat pengembangan.
          </p>
        </div>
      </div>
    );
  }

  // Daftar role untuk testing
  const testRoles: { value: UserRole; label: string; description: string }[] = [
    { 
      value: 'Admin', 
      label: 'Administrator', 
      description: 'Full access ke semua fitur dan data' 
    },
    { 
      value: 'Kepala_Sekolah', 
      label: 'Kepala Sekolah', 
      description: 'Read-only access ke laporan dan data sekolah' 
    },
    { 
      value: 'Guru', 
      label: 'Guru', 
      description: 'Access ke data pembelajaran, nilai, dan presensi' 
    },
    { 
      value: 'Siswa', 
      label: 'Siswa', 
      description: 'Read-only access ke data pribadi dan nilai' 
    },
    { 
      value: 'Orang_Tua', 
      label: 'Orang Tua', 
      description: 'Read-only access ke data anak' 
    },
    { 
      value: 'Petugas_Keuangan', 
      label: 'Petugas Keuangan', 
      description: 'Access ke data keuangan dan pembayaran' 
    }
  ];

  // Simulasi login dengan role tertentu
  const simulateLogin = (role: UserRole) => {
    const mockUser = {
      id: '1',
      username: `test_${role.toLowerCase()}`,
      user_type: role,
      reference_id: '1',
      nama_lengkap: `Test ${role}`
    };
    login(mockUser, 'mock-token');
    setSelectedRole(role);
  };

  // Test permission configurations
  const testPermissions = {
    // Data Master - Admin only
    dataMaster: createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
    
    // Data Siswa - Admin full, Guru read-only
    dataSiswa: {
      ...createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
      'Guru': READ_ONLY_PERMISSIONS,
      'Kepala_Sekolah': READ_ONLY_PERMISSIONS
    },
    
    // Nilai - Admin full, Guru edit, Siswa/Orang Tua read-only
    nilai: {
      ...createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
      'Guru': VIEW_EDIT_PERMISSIONS,
      'Siswa': READ_ONLY_PERMISSIONS,
      'Orang_Tua': READ_ONLY_PERMISSIONS
    },
    
    // Keuangan - Admin full, Petugas Keuangan edit
    keuangan: {
      ...createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
      'Petugas_Keuangan': VIEW_EDIT_PERMISSIONS,
      'Kepala_Sekolah': READ_ONLY_PERMISSIONS
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Integration Test - Permission System
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Testing integrasi sistem permission dengan komponen existing
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {userRole && (
                  <div className="text-sm">
                    <span className="text-gray-500">Current Role:</span>
                    <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                      {userRole}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Pilih Role untuk Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testRoles.map((role) => (
              <div
                key={role.value}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedRole === role.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => simulateLogin(role.value)}
              >
                <div className="font-medium text-gray-900">{role.label}</div>
                <div className="text-sm text-gray-500 mt-1">{role.value}</div>
                <div className="text-xs text-gray-400 mt-2">{role.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Permission Matrix */}
        {userRole && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Permission Matrix untuk Role: {userRole}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      View
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Create
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Edit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(testPermissions).map(([module, permissions]) => {
                    const userPermission = getUserPermission(userRole, permissions);
                    return (
                      <tr key={module}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {module.charAt(0).toUpperCase() + module.slice(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userPermission.view ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userPermission.view ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userPermission.create ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userPermission.create ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userPermission.edit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userPermission.edit ? '✓' : '✗'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            userPermission.delete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userPermission.delete ? '✓' : '✗'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permission Examples */}
        {userRole && <PermissionExamples />}

        {/* Implementation Guide */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Panduan Implementasi</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">1. Menggunakan PermissionGuard</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm text-gray-800">
{`<PermissionGuard
  userRole={userRole}
  permissions={studentDataPermissions}
  action="create"
>
  <button>Tambah Siswa</button>
</PermissionGuard>`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">2. Menggunakan PermissionButton</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm text-gray-800">
{`<PermissionButton
  userRole={userRole}
  permissions={gradePermissions}
  action="edit"
  onClick={() => handleEdit()}
>
  Edit Nilai
</PermissionButton>`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">3. Menggunakan usePermissions Hook</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm text-gray-800">
{`const permissions = usePermissions(userRole, modulePermissions);

if (permissions.canEdit) {
  // Show edit form
} else {
  // Show read-only view
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">4. Konfigurasi Permission</h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm text-gray-800">
{`const modulePermissions = {
  ...createPermissionForRoles(['Admin'], FULL_PERMISSIONS),
  'Guru': VIEW_EDIT_PERMISSIONS,
  'Siswa': READ_ONLY_PERMISSIONS
};`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Migration Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Panduan Migrasi dari Sistem Lama
          </h2>
          
          <div className="space-y-4 text-blue-800">
            <div>
              <h3 className="font-medium">1. Sidebar Sudah Terintegrasi</h3>
              <p className="text-sm">
                <code className="bg-blue-100 px-2 py-1 rounded">Sidebar</code> sudah menggunakan sistem permission yang baru
                di <code className="bg-blue-100 px-2 py-1 rounded">DashboardLayout</code>
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">2. Update Menu Configuration</h3>
              <p className="text-sm">
                Menu configuration sekarang menggunakan <code className="bg-blue-100 px-2 py-1 rounded">universalMenuConfig</code> 
                dengan permission-based access control
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">3. Implement Permission Guards</h3>
              <p className="text-sm">
                Tambahkan <code className="bg-blue-100 px-2 py-1 rounded">PermissionGuard</code> atau <code className="bg-blue-100 px-2 py-1 rounded">PermissionButton</code> 
                pada komponen yang memerlukan kontrol akses
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">4. Update Authentication Hook</h3>
              <p className="text-sm">
                Gunakan <code className="bg-blue-100 px-2 py-1 rounded">useAuth</code> hook untuk mendapatkan user role 
                dan status authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}