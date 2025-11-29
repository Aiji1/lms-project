'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Shield, 
  Key, 
  Eye, 
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';

interface UserData {
  user_id: string;
  username: string;
  user_type: string;
  status: string;
  reference_id: string;
  nama_lengkap: string;
  created_date: string;
  last_login?: string;
}

interface FormData {
  username: string;
  password: string;
  password_confirmation: string;
  user_type: string;
  reference_id: string;
  status: string;
}

interface ReferenceOption {
  id: string;
  nama_lengkap: string;
  status: string;
}

interface FormDataResponse {
  siswa: ReferenceOption[];
  guru: ReferenceOption[];
  admin: ReferenceOption[];
  kepala_sekolah: ReferenceOption[];
  petugas_keuangan: ReferenceOption[];
  orang_tua: ReferenceOption[];
  user_types: string[];
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const user_id = params.user_id as string;

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [formDataLoading, setFormDataLoading] = useState(true);
  const [formOptions, setFormOptions] = useState<FormDataResponse | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    password_confirmation: '',
    user_type: '',
    reference_id: '',
    status: 'Aktif'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch existing user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/users/${user_id}`);
        if (response.data.success) {
          const data = response.data.data;
          setUserData(data);
          
          // Populate form with existing data
          setFormData({
            username: data.username || '',
            password: '',
            password_confirmation: '',
            user_type: data.user_type || '',
            reference_id: data.reference_id || '',
            status: data.status || 'Aktif'
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        alert('Error mengambil data user');
        router.push('/admin/users');
      } finally {
        setDataLoading(false);
      }
    };

    if (user_id) {
      fetchUserData();
    }
  }, [user_id, router]);

  // Fetch form options
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const response = await api.get('/users-form-data');
        if (response.data.success) {
          setFormOptions(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      } finally {
        setFormDataLoading(false);
      }
    };

    fetchFormData();
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset reference_id when user_type changes
    if (name === 'user_type') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        reference_id: value === prev.user_type ? prev.reference_id : '' // Keep reference_id if same type
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Get reference options based on user type
  const getReferenceOptions = (): ReferenceOption[] => {
    if (!formOptions || !formData.user_type) return [];
    
    const typeKey = formData.user_type.toLowerCase() as keyof FormDataResponse;
    return formOptions[typeKey] as ReferenceOption[] || [];
  };

  // Get user type display name
  const getUserTypeDisplayName = (userType: string) => {
    return {
      'Admin': 'Administrator',
      'Kepala_Sekolah': 'Kepala Sekolah',
      'Guru': 'Guru',
      'Petugas_Keuangan': 'Petugas Keuangan',
      'Siswa': 'Siswa',
      'Orang_Tua': 'Orang Tua'
    }[userType] || userType;
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username harus diisi';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username minimal 3 karakter';
    }

    // Password validation only if password is provided
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password minimal 6 karakter';
      }

      if (!formData.password_confirmation) {
        newErrors.password_confirmation = 'Konfirmasi password harus diisi';
      } else if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Konfirmasi password tidak cocok';
      }
    }

    if (!formData.user_type) {
      newErrors.user_type = 'Tipe user harus dipilih';
    }

    // Reference ID wajib hanya untuk Siswa/Guru/Orang_Tua
    if (formData.user_type && ['Siswa','Guru','Orang_Tua'].includes(formData.user_type) && !formData.reference_id) {
      newErrors.reference_id = 'Reference ID harus dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.put(`/users/${user_id}`, formData);
      
      if (response.data.success) {
        alert('User berhasil diupdate');
        router.push('/admin/users');
      }
    } catch (error: any) {
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        const newErrors: Record<string, string> = {};
        
        Object.keys(validationErrors).forEach(key => {
          newErrors[key] = validationErrors[key][0];
        });
        
        setErrors(newErrors);
      } else {
        alert('Error: ' + (error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading || formDataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading data user...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Data user tidak ditemukan</p>
          <Link href="/admin/users" className="text-blue-600 hover:underline mt-2 inline-block">
            Kembali ke Daftar Users
          </Link>
        </div>
      </div>
    );
  }

  const referenceOptions = getReferenceOptions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/users"
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-600 mt-1">
                ID: {userData.user_id} - {userData.username}
              </p>
              <p className="text-sm text-blue-600">
                {getUserTypeDisplayName(userData.user_type)} - {userData.nama_lengkap}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User ID (Read Only) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield size={20} className="mr-2" />
              Informasi Dasar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={userData.user_id}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  placeholder="User ID tidak dapat diubah"
                />
                <p className="text-xs text-gray-500 mt-1">User ID tidak dapat diubah setelah data dibuat</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dibuat Tanggal
                </label>
                <input
                  type="text"
                  value={new Date(userData.created_date).toLocaleDateString('id-ID')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* User Type Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield size={20} className="mr-2" />
              Tipe Pengguna
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe User *
              </label>
              <select
                name="user_type"
                value={formData.user_type}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.user_type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Tipe User</option>
                {formOptions?.user_types.map(type => (
                  <option key={type} value={type}>
                    {getUserTypeDisplayName(type)}
                  </option>
                ))}
              </select>
              {errors.user_type && (
                <p className="mt-1 text-sm text-red-600">{errors.user_type}</p>
              )}
            </div>
          </div>

          {/* Reference Selection */}
          {formData.user_type && ['Siswa','Guru','Orang_Tua'].includes(formData.user_type) && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User size={20} className="mr-2" />
                Pilih {getUserTypeDisplayName(formData.user_type)}
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih {getUserTypeDisplayName(formData.user_type)} *
                </label>
                <select
                  name="reference_id"
                  value={formData.reference_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.reference_id ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih {getUserTypeDisplayName(formData.user_type)}</option>
                  {referenceOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.nama_lengkap} ({option.id})
                    </option>
                  ))}
                </select>
                {errors.reference_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.reference_id}</p>
                )}
                {referenceOptions.length === 0 && formData.user_type && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle size={16} className="text-yellow-600 mr-2 mt-0.5" />
                      <p className="text-sm text-yellow-700">
                        Tidak ada data {getUserTypeDisplayName(formData.user_type)} yang tersedia.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Key size={20} className="mr-2" />
              Informasi Akun
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Masukkan username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-aktif">Non-aktif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Kosongkan jika tidak ingin mengubah"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin mengubah password</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirmation ? "text" : "password"}
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.password_confirmation ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Konfirmasi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordConfirmation ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password_confirmation && (
                  <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/admin/users"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Update User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}