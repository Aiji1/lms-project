'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, Save, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function PresensiSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({
    jam_masuk: '07:00',
    jam_pulang: '15:00',
    toleransi_terlambat: 15,
    gps_enabled: true,
    school_latitude: -7.55641,
    school_longitude: 110.828316,
    gps_radius: 100
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/presensi');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const settingsToUpdate: Record<string, any> = {};
      Object.keys(settings).forEach(key => {
        settingsToUpdate[`presensi.${key}`] = settings[key];
      });

      const response = await api.post('/settings/bulk-update', {
        settings: settingsToUpdate
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings berhasil disimpan!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Gagal menyimpan settings' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pengaturan Presensi</h1>
          <p className="text-gray-600">Konfigurasi jam masuk/pulang dan validasi GPS</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Jam Operasional</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jam Masuk
              </label>
              <input
                type="time"
                value={settings.jam_masuk}
                onChange={(e) => handleChange('jam_masuk', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Waktu mulai presensi masuk</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jam Pulang
              </label>
              <input
                type="time"
                value={settings.jam_pulang}
                onChange={(e) => handleChange('jam_pulang', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Waktu mulai presensi pulang</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toleransi Terlambat (Menit)
              </label>
              <input
                type="number"
                value={settings.toleransi_terlambat || 15}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  handleChange('toleransi_terlambat', isNaN(val) ? 15 : val);
                }}
                min="0"
                max="60"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Batas waktu toleransi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold">Validasi GPS</h2>
          </div>

          <div className="mb-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-gray-900">Aktifkan Validasi GPS</p>
                <p className="text-sm text-gray-500">Siswa harus berada dalam radius sekolah saat presensi</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.gps_enabled}
                  onChange={(e) => handleChange('gps_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude Sekolah
              </label>
              <input
                type="number"
                step="0.000001"
                value={settings.school_latitude || -7.55641}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleChange('school_latitude', isNaN(val) ? -7.55641 : val);
                }}
                disabled={!settings.gps_enabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude Sekolah
              </label>
              <input
                type="number"
                step="0.000001"
                value={settings.school_longitude || 110.828316}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleChange('school_longitude', isNaN(val) ? 110.828316 : val);
                }}
                disabled={!settings.gps_enabled}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radius Valid (Meter)
            </label>
            <input
              type="number"
              value={settings.gps_radius || 100}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                handleChange('gps_radius', isNaN(val) ? 100 : val);
              }}
              min="10"
              max="1000"
              disabled={!settings.gps_enabled}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Jarak maksimum dari koordinat sekolah untuk presensi valid
            </p>
          </div>

          {settings.gps_enabled && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 mb-2">
                <strong>Koordinat Sekolah:</strong>
              </p>
              <p className="text-xs text-blue-700">
                Lat: {settings.school_latitude}, Lng: {settings.school_longitude}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Radius: {settings.gps_radius} meter
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 font-medium"
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>
          
          <button
            onClick={fetchSettings}
            disabled={saving}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 font-medium"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}