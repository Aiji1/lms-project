'use client';

import { useState, useEffect } from 'react';
import { PermissionExamples } from '@/components/examples/PermissionExamples';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/permissions';

/**
 * Halaman untuk testing sistem permission dengan berbagai role
 */
export default function TestPermissionsPage() {
  const { userRole, user, login, logout } = useAuth();
  const [selectedTestRole, setSelectedTestRole] = useState<UserRole | ''>('');

  // Restrict this page to development only to prevent accidental role overrides
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-yellow-800">Halaman Testing Nonaktif</h2>
          <p className="mt-2 text-sm text-yellow-700">
            Halaman test-permissions hanya tersedia saat pengembangan.
          </p>
        </div>
      </div>
    );
  }

  // Daftar role untuk testing
  const testRoles: { value: UserRole; label: string }[] = [
    { value: 'Admin', label: 'Administrator' },
    { value: 'Kepala_Sekolah', label: 'Kepala Sekolah' },
    { value: 'Guru', label: 'Guru' },
    { value: 'Siswa', label: 'Siswa' },
    { value: 'Orang_Tua', label: 'Orang Tua' },
    { value: 'Petugas_Keuangan', label: 'Petugas Keuangan' }
  ];

  // Simulasi login dengan role tertentu untuk testing
  const simulateLogin = (role: UserRole) => {
    const mockUser = {
      id: '1',
      username: `test_${role.toLowerCase()}`,
      nama_lengkap: `Test User ${role}`,
      user_type: role,
      reference_id: '1'
    };

    // Update auth state only (avoid direct localStorage writes here)
    login(mockUser, 'test-token-' + role);
    setSelectedTestRole(role);
  };

  const handleRoleChange = (role: UserRole) => {
    simulateLogin(role);
  };

  const handleLogout = () => {
    logout();
    setSelectedTestRole('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Test Permission System
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Halaman untuk menguji sistem permission dengan berbagai role user
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
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Pilih Role untuk Testing</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {testRoles.map((role) => (
              <button
                key={role.value}
                onClick={() => handleRoleChange(role.value)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedTestRole === role.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">{role.label}</div>
                <div className="text-xs text-gray-500 mt-1">{role.value}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Permission Test Results */}
        {userRole ? (
          <PermissionExamples />
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pilih Role untuk Memulai Testing
              </h3>
              <p className="text-gray-500">
                Pilih salah satu role di atas untuk melihat bagaimana sistem permission bekerja
              </p>
            </div>
          </div>
        )}

        {/* Documentation */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Dokumentasi Permission System</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Komponen yang Tersedia:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">PermissionGuard</code> - Untuk conditional rendering berdasarkan permission</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">PermissionButton</code> - Button yang otomatis disable jika tidak ada permission</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">PermissionLink</code> - Link yang dikontrol berdasarkan permission</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">ConditionalRender</code> - Untuk multiple permission requirements</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">usePermissions</code> - Hook untuk mengecek permission dalam komponen</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Permission Actions:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><code className="bg-gray-100 px-2 py-1 rounded">view</code> - Hak untuk melihat data</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">create</code> - Hak untuk membuat data baru</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">edit</code> - Hak untuk mengedit data</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">delete</code> - Hak untuk menghapus data</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Role Hierarchy:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>Admin</strong> - Full access ke semua fitur</li>
                <li><strong>Kepala Sekolah</strong> - Read-only access ke sebagian besar data</li>
                <li><strong>Guru</strong> - Access ke data pembelajaran dan nilai</li>
                <li><strong>Siswa</strong> - Read-only access ke data pribadi dan nilai</li>
                <li><strong>Orang Tua</strong> - Read-only access ke data anak</li>
                <li><strong>Petugas Keuangan</strong> - Access ke data keuangan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}