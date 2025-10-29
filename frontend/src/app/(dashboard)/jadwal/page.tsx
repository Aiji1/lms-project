'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, BookOpen, User, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

interface JadwalItem {
  id_jadwal: number;
  mata_pelajaran: string;
  guru: string;
  kelas: string;
  ruangan: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  jam_ke: number;
}

interface JadwalHarian {
  hari: string;
  tanggal: string;
  jadwal: JadwalItem[];
}

export default function JadwalPage() {
  const [jadwalData, setJadwalData] = useState<JadwalHarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchJadwalData();
  }, [selectedWeek]);

  const fetchJadwalData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now - replace with actual API call
      const mockJadwal: JadwalHarian[] = [
        {
          hari: 'Senin',
          tanggal: '2024-01-15',
          jadwal: [
            {
              id_jadwal: 1,
              mata_pelajaran: 'Matematika',
              guru: 'Ahmad Muzaki, S.Pd',
              kelas: 'X IPA 1',
              ruangan: 'R.101',
              hari: 'Senin',
              jam_mulai: '07:00',
              jam_selesai: '08:30',
              jam_ke: 1
            },
            {
              id_jadwal: 2,
              mata_pelajaran: 'Bahasa Indonesia',
              guru: 'Siti Nurhaliza, S.Pd',
              kelas: 'X IPA 1',
              ruangan: 'R.102',
              hari: 'Senin',
              jam_mulai: '08:30',
              jam_selesai: '10:00',
              jam_ke: 2
            },
            {
              id_jadwal: 3,
              mata_pelajaran: 'Bahasa Inggris',
              guru: 'John Smith, S.Pd',
              kelas: 'X IPA 1',
              ruangan: 'R.103',
              hari: 'Senin',
              jam_mulai: '10:15',
              jam_selesai: '11:45',
              jam_ke: 3
            }
          ]
        },
        {
          hari: 'Selasa',
          tanggal: '2024-01-16',
          jadwal: [
            {
              id_jadwal: 4,
              mata_pelajaran: 'IPA',
              guru: 'Dr. Budi Santoso, S.Pd',
              kelas: 'X IPA 1',
              ruangan: 'Lab IPA',
              hari: 'Selasa',
              jam_mulai: '07:00',
              jam_selesai: '08:30',
              jam_ke: 1
            },
            {
              id_jadwal: 5,
              mata_pelajaran: 'Sejarah',
              guru: 'Dra. Sari Wulandari',
              kelas: 'X IPA 1',
              ruangan: 'R.105',
              hari: 'Selasa',
              jam_mulai: '08:30',
              jam_selesai: '10:00',
              jam_ke: 2
            }
          ]
        },
        {
          hari: 'Rabu',
          tanggal: '2024-01-17',
          jadwal: [
            {
              id_jadwal: 6,
              mata_pelajaran: 'Olahraga',
              guru: 'Budi Hartono, S.Pd',
              kelas: 'X IPA 1',
              ruangan: 'Lapangan',
              hari: 'Rabu',
              jam_mulai: '07:00',
              jam_selesai: '08:30',
              jam_ke: 1
            }
          ]
        },
        {
          hari: 'Kamis',
          tanggal: '2024-01-18',
          jadwal: [
            {
              id_jadwal: 7,
              mata_pelajaran: 'Seni Budaya',
              guru: 'Rina Sari, S.Pd',
              kelas: 'X IPA 1',
              ruangan: 'R.Seni',
              hari: 'Kamis',
              jam_mulai: '07:00',
              jam_selesai: '08:30',
              jam_ke: 1
            }
          ]
        },
        {
          hari: 'Jumat',
          tanggal: '2024-01-19',
          jadwal: [
            {
              id_jadwal: 8,
              mata_pelajaran: 'Agama',
              guru: 'Ustadz Abdullah, S.Ag',
              kelas: 'X IPA 1',
              ruangan: 'R.Agama',
              hari: 'Jumat',
              jam_mulai: '07:00',
              jam_selesai: '08:30',
              jam_ke: 1
            }
          ]
        }
      ];

      setJadwalData(mockJadwal);
    } catch (err) {
      setError('Gagal memuat data jadwal');
      console.error('Error fetching jadwal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHariIni = () => {
    const today = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[today.getDay()];
  };

  const isHariIni = (hari: string) => {
    return hari === getHariIni();
  };

  const getJamSekarang = () => {
    const now = new Date();
    return now.getHours() * 100 + now.getMinutes();
  };

  const isJamAktif = (jamMulai: string, jamSelesai: string) => {
    const sekarang = getJamSekarang();
    const mulai = parseInt(jamMulai.replace(':', ''));
    const selesai = parseInt(jamSelesai.replace(':', ''));
    return sekarang >= mulai && sekarang <= selesai;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat jadwal pelajaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-purple-600" />
              Jadwal Pelajaran
            </h1>
            <p className="text-gray-600 mt-1">Jadwal pelajaran minggu ini</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Hari ini: {getHariIni()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedWeek(selectedWeek - 1)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">Minggu {selectedWeek + 1}</span>
              <button
                onClick={() => setSelectedWeek(selectedWeek + 1)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Jadwal Harian */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {jadwalData.map((harian) => (
          <div
            key={harian.hari}
            className={`bg-white rounded-lg shadow-sm border-2 ${
              isHariIni(harian.hari) 
                ? 'border-purple-200 bg-purple-50' 
                : 'border-gray-200'
            }`}
          >
            <div className={`p-4 border-b ${
              isHariIni(harian.hari) 
                ? 'border-purple-200 bg-purple-100' 
                : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${
                  isHariIni(harian.hari) 
                    ? 'text-purple-800' 
                    : 'text-gray-900'
                }`}>
                  {harian.hari}
                </h3>
                {isHariIni(harian.hari) && (
                  <span className="px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded-full">
                    Hari Ini
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{harian.tanggal}</p>
            </div>
            
            <div className="p-4 space-y-3">
              {harian.jadwal.length > 0 ? (
                harian.jadwal.map((jadwal) => (
                  <div
                    key={jadwal.id_jadwal}
                    className={`p-3 rounded-lg border ${
                      isHariIni(harian.hari) && isJamAktif(jadwal.jam_mulai, jadwal.jam_selesai)
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">
                          {jadwal.mata_pelajaran}
                        </span>
                      </div>
                      {isHariIni(harian.hari) && isJamAktif(jadwal.jam_mulai, jadwal.jam_selesai) && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-full">
                          Sedang Berlangsung
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{jadwal.guru}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{jadwal.ruangan}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{jadwal.jam_mulai} - {jadwal.jam_selesai}</span>
                        <span className="text-xs bg-gray-200 px-1 rounded">
                          Jam ke-{jadwal.jam_ke}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Tidak ada jadwal</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}