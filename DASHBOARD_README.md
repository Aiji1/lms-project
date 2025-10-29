# 📊 Dashboard LMS - Dokumentasi Lengkap

## 🎯 Overview
Dashboard LMS adalah sistem manajemen pembelajaran yang menyediakan antarmuka terpusat untuk berbagai peran pengguna dalam lingkungan sekolah. Sistem ini dirancang dengan arsitektur modern menggunakan Laravel (Backend) dan Next.js (Frontend).

## 🏗️ Arsitektur Sistem

### Backend (Laravel)
- **Framework**: Laravel 11.x
- **Database**: SQLite
- **API**: RESTful API dengan Sanctum Authentication
- **Port**: 8000

### Frontend (Next.js)
- **Framework**: Next.js 15.x
- **UI Library**: Tailwind CSS + Lucide Icons
- **State Management**: React Hooks
- **Port**: 3001

## 👥 Role-Based Dashboard

### 1. 🔧 Dashboard Admin
**Akses**: Administrator Sistem
**Fitur Utama**:
- **Statistik Sistem**:
  - Total Siswa (dari tabel `siswa`)
  - Total Guru (dari tabel `guru`)
  - Total Kelas (dari tabel `kelas`)
  - Total Mata Pelajaran (dari tabel `mata_pelajaran`)
  - Total Tahun Ajaran (dari tabel `tahun_ajaran`)
  - Total Jurusan (dari tabel `jurusan`)
  - Total Users & Status (dari tabel `users`)

- **Quick Actions**:
  - Kelola Data Siswa (`/admin/siswa`)
  - Kelola Data Guru (`/admin/guru`)
  - Kelola Akun User (`/admin/users`)
  - Pengaturan Sistem (`/settings`)

### 2. 🎓 Dashboard Kepala Sekolah
**Akses**: Kepala Sekolah
**Fitur Utama**:
- **Monitoring Sekolah**:
  - Total Siswa & Guru
  - Total Prestasi (dari jumlah siswa aktif)
  - Total Laporan (dari tabel `laporan`)

- **Quick Actions**:
  - Lihat Laporan Sekolah (`/laporan`)
  - Monitoring Siswa (`/admin/siswa`)
  - Monitoring Guru (`/admin/guru`)
  - Analisis Statistik (`/laporan/statistik`)

### 3. 👨‍🏫 Dashboard Guru
**Akses**: Guru/Pengajar
**Fitur Utama**:
- **Data Mengajar** (berdasarkan `nik_guru` yang login):
  - Kelas Diampu
  - Total Siswa yang Diajar
  - Tugas Aktif (dari tabel `tugas`)
  - Penilaian (dari tabel `nilai` untuk mata pelajaran yang diampu)

- **Quick Actions**:
  - Jadwal Mengajar (`/jadwal`)
  - Input Nilai Siswa (`/nilai`)
  - Jurnal Mengajar (`/guru/jurnal`)
  - Presensi Siswa (`/presensi`)

### 4. 🎒 Dashboard Siswa
**Akses**: Siswa
**Fitur Utama**:
- **Data Akademik** (berdasarkan `nis` yang login):
  - Rata-rata Nilai (dari tabel `nilai`)
  - Persentase Kehadiran (dari tabel `presensi_harian`)
  - Tugas Diselesaikan (dari tabel `pengumpulan_tugas`)
  - Tugas Pending

- **Quick Actions**:
  - QR Code Presensi (`/siswa/barcode`)
  - Lihat Nilai (`/pembelajaran/nilai-siswa`)
  - Jadwal Pelajaran (`/jadwal`)
  - Tugas (`/tugas`)

### 5. 💰 Dashboard Petugas Keuangan
**Akses**: Staff Keuangan
**Fitur Utama**:
- **Data Keuangan**:
  - Total Tagihan (dari tabel `tagihan`)
  - Tunggakan
  - Pembayaran Bulan Ini (dari tabel `pembayaran`)
  - Total Pendapatan

### 6. 👨‍👩‍👧‍👦 Dashboard Orang Tua
**Akses**: Wali Murid
**Fitur Utama**:
- **Data Anak** (berdasarkan `id_orang_tua` yang login):
  - Rata-rata Nilai Anak (dari tabel `nilai`)
  - Kehadiran Anak (dari tabel `presensi_harian`)
  - Tagihan (dari tabel `tagihan`)

## 🔄 API Endpoints

### Dashboard API
```
GET /api/dashboard
```
**Response Structure**:
```json
{
  "stats": {
    "totalSiswa": 0,
    "totalGuru": 0,
    "totalKelas": 0,
    "totalMapel": 0,
    // ... role-specific stats
  },
  "user": {
    "user_id": "string",
    "username": "string",
    "user_type": "string",
    "nama_lengkap": "string",
    "reference_id": "string"
  },
  "recentActivities": []
}
```

## 🗄️ Database Schema

### Tabel Utama
- `users` - Data pengguna sistem
- `siswa` - Data siswa
- `guru` - Data guru
- `kelas` - Data kelas
- `mata_pelajaran` - Data mata pelajaran
- `nilai` - Data penilaian
- `presensi_harian` - Data kehadiran harian
- `tugas` - Data tugas
- `pengumpulan_tugas` - Data pengumpulan tugas
- `tagihan` - Data tagihan keuangan
- `pembayaran` - Data pembayaran
- `laporan` - Data laporan

## 🚀 Cara Menjalankan

### 1. Backend (Laravel)
```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. Frontend (Next.js)
```bash
cd frontend
npm run dev
```

### 3. Akses Aplikasi
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8000

## 🔐 Authentication & Authorization

### Flow Authentication
1. User login melalui frontend
2. Backend memvalidasi kredensial
3. Generate token menggunakan Laravel Sanctum
4. Token disimpan di frontend untuk API calls
5. Setiap request API menggunakan Bearer token

### Role-Based Access Control
- Setiap endpoint dashboard memfilter data berdasarkan role user
- Data personal difilter berdasarkan ID user yang login
- Guru hanya melihat data kelas/siswa yang diampu
- Siswa hanya melihat data pribadi mereka
- Orang tua hanya melihat data anak mereka

## 📊 Data Flow

### Real-Time Data
Semua statistik dashboard menggunakan **data real** dari database:
- ✅ Tidak ada data hardcoded/mock
- ✅ Query database secara real-time
- ✅ Filter berdasarkan user yang login
- ✅ Handling untuk data kosong

### Performance Optimization
- Query database dioptimasi dengan proper indexing
- Caching untuk data yang jarang berubah
- Lazy loading untuk komponen berat

## 🛠️ Troubleshooting

### Common Issues
1. **404 Error**: Pastikan kedua server (backend & frontend) berjalan
2. **CORS Error**: Periksa konfigurasi CORS di Laravel
3. **Authentication Error**: Pastikan token valid dan tidak expired
4. **Data Kosong**: Normal jika database masih kosong, sistem akan menampilkan 0

### Debug Mode
```bash
# Backend debug
php artisan tinker

# Frontend debug
npm run dev -- --debug
```

## 📝 Development Notes

### Code Structure
- **Backend Controller**: `app/Http/Controllers/Api/DashboardController.php`
- **Frontend Page**: `src/app/(dashboard)/dashboard/page.tsx`
- **API Client**: `src/lib/api.ts`

### Best Practices
- Selalu gunakan data real dari database
- Implement proper error handling
- Follow Laravel & Next.js conventions
- Maintain consistent UI/UX across roles

## 🔄 Recent Updates

### ✅ Completed
- ✅ Replaced all mock data with real database queries
- ✅ Implemented role-based data filtering
- ✅ Added proper authentication checks
- ✅ Optimized database queries
- ✅ Fixed all dashboard statistics

### 🚧 In Progress
- 🔧 Menu presensi mapel improvements
- 📱 Mobile responsiveness enhancements
- 🔔 Real-time notifications

---

**Last Updated**: 2024
**Version**: 1.0.0
**Maintainer**: Development Team