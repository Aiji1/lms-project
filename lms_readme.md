# Sistem LMS SMA Islam Al-Azhar 7 Sukoharjo

## Overview

Sistem Learning Management System (LMS) yang dikembangkan khusus untuk SMA Islam Al-Azhar 7 Sukoharjo. Sistem ini dibangun dengan arsitektur modern menggunakan **Laravel** sebagai backend API dan **Next.js** sebagai frontend dengan **TypeScript** dan **Tailwind CSS**.

## Arsitektur Sistem

```
lms-project/
├── backend/          # Laravel 12 API Backend
│   ├── app/Http/Controllers/Api/
│   ├── routes/api.php
│   └── database/
└── frontend/         # Next.js 15 Frontend
    ├── src/app/
    ├── src/components/
    └── src/lib/
```

## Technology Stack

### Backend
- **Laravel 12** - PHP Framework
- **MySQL** - Database (47 tabel)
- **PhpSpreadsheet** - Excel processing
- **RESTful API** - API architecture

### Frontend
- **Next.js 15** - React Framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

## Database Schema

Database terdiri dari **47 tabel** yang mencakup:

### Core Management (8 tabel)
- `users` - Manajemen pengguna sistem
- `siswa` - Data siswa
- `guru` - Data guru
- `orang_tua` - Data orang tua siswa
- `admin` - Data admin
- `kepala_sekolah` - Data kepala sekolah
- `petugas_keuangan` - Data petugas keuangan

### Akademik (6 tabel)
- `tahun_ajaran` - Data tahun ajaran
- `jurusan` - Data jurusan (Tahfizh, Digital, Billingual, dll)
- `kelas` - Data kelas
- `mata_pelajaran` - Data mata pelajaran
- `kurikulum` - Struktur kurikulum
- `guru_mata_pelajaran` - Relasi guru dan mapel
- `jadwal_pelajaran` - Jadwal mengajar

### Pembelajaran (7 tabel)
- `jurnal_mengajar` - Jurnal harian guru
- `presensi_harian` - Presensi siswa
- `presensi_mapel` - Presensi per mata pelajaran
- `nilai` - Nilai siswa
- `tugas` - Data tugas
- `tugas_siswa` - Relasi tugas dan siswa
- `pengumpulan_tugas` - Pengumpulan tugas

### Keagamaan (6 tabel)
- `tugas_adab` - Tugas adab harian
- `monitoring_adab` - Monitoring pelaksanaan adab
- `monitoring_sholat` - Monitoring sholat berjamaah
- `target_hafalan_siswa` - Target hafalan per siswa
- `hafalan` - Data setoran hafalan
- `evaluasi_hafalan` - Evaluasi berkala hafalan

### Kedisiplinan (1 tabel)
- `pelanggaran` - Data pelanggaran siswa

### Keuangan (3 tabel)
- `jenis_pembayaran` - Jenis-jenis pembayaran
- `tagihan` - Tagihan siswa
- `pembayaran` - Riwayat pembayaran

### Komunikasi (2 tabel)
- `pengumuman` - Pengumuman sekolah
- `pengumuman_target` - Target penerima pengumuman

### Rapot (8 tabel)
- `rapot` - Rapot akademik
- `rapot_nilai` - Nilai per mapel
- `rapot_ekstrakurikuler` - Nilai ekstrakurikuler
- `rapot_kehadiran` - Data kehadiran
- `rapot_catatan` - Catatan wali kelas
- `rapot_att` - Rapot ATT (Akhlak, Tahfidz, Tanse)
- `rapot_tahfidz_detail` - Detail tahfidz
- `rapot_adab_detail` - Detail adab
- `rapot_tanse_detail` - Detail tata tertib

### Laporan (4 tabel)
- `laporan` - Header laporan
- `laporan_presensi_detail` - Detail laporan presensi
- `laporan_tahfidz_detail` - Detail laporan tahfidz
- `laporan_statistik` - Statistik laporan

## Fitur yang Sudah Dikerjakan ✅

### 1. Authentication & Authorization
- **Login system** dengan role-based access
- **6 role pengguna**: Admin, Kepala Sekolah, Guru, Siswa, Orang Tua, Petugas Keuangan
- **Dynamic sidebar** berdasarkan role
- **Session management** dengan token

### 2. Frontend Architecture
- **Next.js App Router** dengan TypeScript
- **Responsive layout** dengan Tailwind CSS
- **Component-based architecture**:
  - Layout components (Sidebar, Header, DashboardLayout)
  - Form components (ImportModal)
  - Page components untuk setiap fitur
- **API integration** dengan Axios

### 3. CRUD Data Siswa (Complete)
- **List siswa** dengan pagination dan search
- **Tambah siswa** dengan form validation
- **Detail siswa** dengan informasi lengkap
- **Edit siswa** dengan pre-populated data
- **Hapus siswa** dengan confirmation
- **Import Excel/CSV** dengan template download
- **Export data** (preparation)

### 4. Database Setup
- **47 tabel** telah dibuat dengan relasi lengkap
- **Foreign key constraints** untuk data integrity
- **Indexes** untuk performance optimization
- **Sample data** untuk testing

### 5. API Backend
- **RESTful API** dengan Laravel
- **CRUD endpoints** untuk siswa
- **File upload/download** untuk import/export
- **Error handling** dan validation
- **CORS configuration** untuk cross-origin requests

## Fitur yang Sedang Dikerjakan 🔄

### 1. Import/Export System
- **Template Excel download** - debugging CORS issues
- **Bulk import validation** - testing with sample data
- **Error reporting** untuk import failures

### 2. API Integration
- **Frontend-backend connectivity** - resolving CORS configuration
- **Real-time data synchronization**

## Fitur yang Akan Dikerjakan 📋

### Priority 1: Core Management
1. **CRUD Data Guru**
   - List, create, edit, delete guru
   - Import/export guru data
   - Relasi dengan mata pelajaran

2. **CRUD Data User**
   - Manajemen akun login
   - Role assignment
   - Password management

3. **Data Master**
   - Manajemen kelas dan jurusan
   - Manajemen mata pelajaran
   - Tahun ajaran

### Priority 2: Academic Features
4. **Jadwal Pelajaran**
   - Input jadwal mengajar
   - View jadwal per kelas/guru
   - Kalender akademik

5. **Sistem Nilai**
   - Input nilai per jenis penilaian
   - Perhitungan nilai akhir
   - Laporan nilai

6. **Tugas dan Pengumpulan**
   - Buat dan assign tugas
   - Upload file tugas
   - Koreksi dan feedback

### Priority 3: Attendance & Monitoring
7. **Presensi Siswa**
   - Presensi harian
   - Presensi per mata pelajaran
   - Laporan kehadiran

8. **Monitoring Keagamaan**
   - Monitoring sholat berjamaah
   - Tracking adab harian
   - Target dan evaluasi hafalan

### Priority 4: Financial Management
9. **Sistem Keuangan**
   - Manajemen tagihan
   - Pembayaran SPP
   - Laporan keuangan

### Priority 5: Communication & Reports
10. **Sistem Pengumuman**
    - Broadcast pengumuman
    - Target spesifik (kelas/jurusan)
    - Notifikasi

11. **Sistem Rapot**
    - Generate rapot akademik
    - Rapot ATT (Akhlak, Tahfidz, Tanse)
    - Export rapot PDF

12. **Dashboard Analytics**
    - Statistik siswa, guru, kelas
    - Charts dan visualisasi data
    - Real-time monitoring

## Installation & Setup

### Prerequisites
- Node.js 18+
- PHP 8.1+
- Composer
- MySQL/MariaDB

### Backend Setup
```bash
cd backend
composer install
cp .env.example .env
# Configure database in .env
php artisan migrate
php artisan serve
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
```bash
# Import database schema
mysql -u root -p < sapa7.sql
# Update database name to 'lms' in the SQL file
```

## Test Credentials

```
Admin: admin / password
Kepala Sekolah: kepsek / password
Petugas Keuangan: keuangan / password
Guru: guru / password
Siswa: siswa / password
Orang Tua: ortu / password
```

## Development Notes

### Current Issues
1. **CORS Configuration** - Resolving cross-origin request issues for template download
2. **File Upload** - Testing import functionality with various file formats
3. **API Response** - Standardizing error responses across endpoints

### Next Steps
1. Complete import/export functionality
2. Implement CRUD for Guru and User entities
3. Setup real-time notifications
4. Implement role-based permissions for specific actions

## Contributing

1. Follow TypeScript best practices
2. Use Tailwind CSS for styling
3. Implement proper error handling
4. Write comprehensive API documentation
5. Test with all user roles

## Project Structure

```
frontend/src/
├── app/
│   ├── (auth)/login/          # Authentication pages
│   ├── (dashboard)/           # Main dashboard
│   │   ├── admin/siswa/       # Student management
│   │   ├── guru/              # Teacher pages
│   │   └── siswa/             # Student pages
├── components/
│   ├── layout/                # Layout components
│   ├── forms/                 # Form components
│   └── ui/                    # UI components
└── lib/
    ├── api.ts                 # API client
    └── auth.ts                # Authentication utilities
```

---

**Status**: Active Development  
**Last Updated**: September 2025  
**Developer**: Development Team SMA Islam Al-Azhar 7 Sukoharjo