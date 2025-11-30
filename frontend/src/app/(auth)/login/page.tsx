'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', formData);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        switch (user.user_type) {
          case 'Admin':
            router.push('/admin/siswa');
            break;
          default:
            router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.status === 401) {
        setError(error.response.data.message || 'Username atau password salah');
      } else {
        setError('Terjadi kesalahan saat login. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/outer-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#0066cc'
      }}>
      
      {/* Overlay untuk outer background */}
      <div className="absolute inset-0 bg-blue-900/40"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl shadow-2xl overflow-hidden rounded-2xl">
        <div className="grid md:grid-cols-2 gap-0">
          
          {/* Left Side - Background Image */}
          <div className="relative min-h-[600px] flex flex-col justify-center items-center text-white p-12"
            style={{
              backgroundImage: 'url(/login-background.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#0066cc'
            }}>
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-blue-800/60 to-blue-900/70"></div>

            {/* Content */}
            <div className="relative z-10 text-center w-full max-w-md">
              {/* Logo */}
              <div className="mb-8 flex justify-center">
                <div className="bg-white p-4 rounded-2xl shadow-2xl">
                  <Image 
                    src="/logo_alazhar.png" 
                    alt="SMA Islam Al Azhar 7 Sukoharjo" 
                    width={280}
                    height={70}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>

              {/* Welcome Text */}
              <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
                Selamat Datang
              </h1>
              <p className="text-xl font-medium mb-3 drop-shadow-md">
                Learning Management System
              </p>
              <p className="text-xl font-bold mb-10 drop-shadow-md">
                Generasi Mulia Islami Cemerlang
              </p>

              {/* Islamic Quote */}
              <div className="bg-blue-900/50 backdrop-blur-sm border-l-4 border-orange-500 rounded-xl p-6 shadow-xl">
                <p className="text-base italic leading-relaxed mb-2">
                  &quot;Menuntut ilmu adalah kewajiban setiap muslim&quot;
                </p>
                <p className="text-sm drop-shadow-md">— HR. Ibnu Majah</p>
              </div>
            </div>
          </div>

          {/* Right Side - White Card */}
          <div className="bg-white flex items-center justify-center p-12">
            <div className="w-full max-w-md">
              
              {/* Header */}
              <div className="mb-10">
                <h2 className="text-4xl font-bold mb-2" style={{ color: '#0066cc' }}>
                  Masuk ke Akun Anda
                </h2>
                <p className="text-gray-600">
                  Silakan masuk menggunakan kredensial Anda
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-bold text-gray-800 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="Masukkan username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="Masukkan password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Ingat Saya</span>
                  </label>
                  <a href="#" className="text-sm font-semibold hover:underline" style={{ color: '#0066cc' }}>
                    Lupa Password?
                  </a>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-white text-lg uppercase tracking-wide shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #ff8c00 0%, #ff7300 100%)'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Memproses...
                    </div>
                  ) : (
                    'MASUK'
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center text-sm text-gray-500 space-y-1">
                <p>© 2025 SMA Islam Al Azhar 7 Sukoharjo</p>
                <p className="text-xs">Sistem Pembelajaran Digital</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
