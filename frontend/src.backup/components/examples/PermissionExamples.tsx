'use client';

import { Edit, Trash2, Plus, Eye } from 'lucide-react';
import { 
  PermissionGuard, 
  PermissionButton, 
  ConditionalRender,
  usePermissions 
} from '@/components/ui/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
import { PERMISSION_PRESETS, createPermissionForRoles } from '@/lib/permissions';
import { FULL_PERMISSIONS, READ_ONLY_PERMISSIONS, VIEW_EDIT_PERMISSIONS } from '@/types/permissions';

/**
 * Contoh implementasi sistem permission dalam berbagai komponen
 */
export function PermissionExamples() {
  const { userRole } = useAuth();

  // Contoh permission untuk data siswa
  const studentDataPermissions = createPermissionForRoles(['Admin'], FULL_PERMISSIONS);
  studentDataPermissions['Kepala_Sekolah'] = READ_ONLY_PERMISSIONS;
  studentDataPermissions['Guru'] = READ_ONLY_PERMISSIONS;

  // Contoh permission untuk nilai
  const gradePermissions = createPermissionForRoles(['Admin'], FULL_PERMISSIONS);
  gradePermissions['Guru'] = VIEW_EDIT_PERMISSIONS;
  gradePermissions['Siswa'] = READ_ONLY_PERMISSIONS;
  gradePermissions['Orang_Tua'] = READ_ONLY_PERMISSIONS;

  const studentPermissions = usePermissions(userRole || 'Siswa', studentDataPermissions);
  const gradePermissions_hook = usePermissions(userRole || 'Siswa', gradePermissions);

  if (!userRole) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Contoh Implementasi Permission System</h2>
        <p className="text-gray-600 mb-6">
          Role Anda: <span className="font-semibold text-blue-600">{userRole}</span>
        </p>

        {/* Contoh 1: Permission Guard untuk Tombol */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">1. Permission Guard untuk Tombol</h3>
          <div className="flex space-x-4">
            <PermissionGuard
              userRole={userRole}
              permissions={studentDataPermissions}
              action="create"
            >
              <button className="bg-green-500 text-white px-4 py-2 rounded flex items-center space-x-2">
                <Plus size={16} />
                <span>Tambah Siswa</span>
              </button>
            </PermissionGuard>

            <PermissionGuard
              userRole={userRole}
              permissions={studentDataPermissions}
              action="edit"
            >
              <button className="bg-blue-500 text-white px-4 py-2 rounded flex items-center space-x-2">
                <Edit size={16} />
                <span>Edit Siswa</span>
              </button>
            </PermissionGuard>

            <PermissionGuard
              userRole={userRole}
              permissions={studentDataPermissions}
              action="delete"
            >
              <button className="bg-red-500 text-white px-4 py-2 rounded flex items-center space-x-2">
                <Trash2 size={16} />
                <span>Hapus Siswa</span>
              </button>
            </PermissionGuard>

            <PermissionGuard
              userRole={userRole}
              permissions={studentDataPermissions}
              action="view"
            >
              <button className="bg-gray-500 text-white px-4 py-2 rounded flex items-center space-x-2">
                <Eye size={16} />
                <span>Lihat Detail</span>
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Contoh 2: Permission Button dengan Auto Disable */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">2. Permission Button (Auto Disable)</h3>
          <div className="flex space-x-4">
            <PermissionButton
              userRole={userRole}
              permissions={gradePermissions}
              action="create"
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={() => alert('Membuat nilai baru')}
            >
              Buat Nilai
            </PermissionButton>

            <PermissionButton
              userRole={userRole}
              permissions={gradePermissions}
              action="edit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => alert('Mengedit nilai')}
            >
              Edit Nilai
            </PermissionButton>

            <PermissionButton
              userRole={userRole}
              permissions={gradePermissions}
              action="delete"
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={() => alert('Menghapus nilai')}
            >
              Hapus Nilai
            </PermissionButton>
          </div>
        </div>

        {/* Contoh 3: Conditional Render dengan Multiple Permissions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">3. Conditional Render (Multiple Permissions)</h3>
          
          <ConditionalRender
            userRole={userRole}
            permissions={PERMISSION_PRESETS.ADMIN_ONLY}
            requiredActions={['view', 'create']}
            mode="all"
            fallback={
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                Anda tidak memiliki akses untuk melihat panel admin
              </div>
            }
          >
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
              <h4 className="font-semibold">Panel Admin</h4>
              <p>Hanya admin yang dapat melihat panel ini</p>
            </div>
          </ConditionalRender>
        </div>

        {/* Contoh 4: Menggunakan usePermissions Hook */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">4. usePermissions Hook</h3>
          <div className="bg-gray-100 p-4 rounded">
            <h4 className="font-semibold mb-2">Permission Status untuk Data Siswa:</h4>
            <ul className="space-y-1">
              <li>Can View: <span className={studentPermissions.canView ? 'text-green-600' : 'text-red-600'}>
                {studentPermissions.canView ? '✓' : '✗'}
              </span></li>
              <li>Can Create: <span className={studentPermissions.canCreate ? 'text-green-600' : 'text-red-600'}>
                {studentPermissions.canCreate ? '✓' : '✗'}
              </span></li>
              <li>Can Edit: <span className={studentPermissions.canEdit ? 'text-green-600' : 'text-red-600'}>
                {studentPermissions.canEdit ? '✓' : '✗'}
              </span></li>
              <li>Can Delete: <span className={studentPermissions.canDelete ? 'text-green-600' : 'text-red-600'}>
                {studentPermissions.canDelete ? '✓' : '✗'}
              </span></li>
            </ul>
          </div>
        </div>

        {/* Contoh 5: Table dengan Permission-based Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">5. Table dengan Permission-based Actions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Siswa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nilai
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { id: 1, nama: 'Ahmad Fauzi', kelas: 'X IPA 1', nilai: 85 },
                  { id: 2, nama: 'Siti Nurhaliza', kelas: 'X IPA 2', nilai: 92 },
                  { id: 3, nama: 'Budi Santoso', kelas: 'X IPS 1', nilai: 78 }
                ].map((siswa) => (
                  <tr key={siswa.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {siswa.nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {siswa.kelas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {siswa.nilai}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <PermissionButton
                        userRole={userRole}
                        permissions={gradePermissions}
                        action="view"
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => alert(`Melihat detail ${siswa.nama}`)}
                      >
                        Lihat
                      </PermissionButton>

                      <PermissionButton
                        userRole={userRole}
                        permissions={gradePermissions}
                        action="edit"
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => alert(`Mengedit ${siswa.nama}`)}
                      >
                        Edit
                      </PermissionButton>

                      <PermissionButton
                        userRole={userRole}
                        permissions={studentDataPermissions}
                        action="delete"
                        className="text-red-600 hover:text-red-900"
                        onClick={() => alert(`Menghapus ${siswa.nama}`)}
                      >
                        Hapus
                      </PermissionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contoh 6: Form dengan Permission-based Fields */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">6. Form dengan Permission-based Fields</h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Siswa</label>
              <input 
                type="text" 
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                disabled={!gradePermissions_hook.canEdit}
              />
            </div>

            <PermissionGuard
              userRole={userRole}
              permissions={studentDataPermissions}
              action="edit"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Kelas (Admin Only)</label>
                <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                  <option>X IPA 1</option>
                  <option>X IPA 2</option>
                  <option>X IPS 1</option>
                </select>
              </div>
            </PermissionGuard>

            <div className="flex space-x-4">
              <PermissionButton
                userRole={userRole}
                permissions={gradePermissions}
                action="create"
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => alert('Menyimpan data')}
              >
                Simpan
              </PermissionButton>

              <button 
                type="button" 
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={() => alert('Membatalkan')}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}