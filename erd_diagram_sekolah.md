# ERD SISTEM MANAJEMEN SEKOLAH AL AZHAR 7 SUKOHARJO

## DAFTAR ENTITY DAN ATRIBUT

### 1. CORE MANAGEMENT ENTITIES

#### **USERS**
- **PK**: User_ID
- Username (UNIQUE) - **semua login menggunakan username**
- Password (encrypted)
- User_Type (Siswa/Guru/Admin/Kepala_Sekolah/Petugas_Keuangan/Orang_Tua)
- Status (Aktif/Non-aktif)
- Reference_ID (points to related table PK based on user_type)
- Last_Login
- Created_Date
- Updated_Date

#### **SISWA**
- **PK**: NIS
- Nama_Lengkap
- Tanggal_Lahir
- Jenis_Kelamin
- Alamat
- **FK**: ID_Kelas
- **FK**: ID_Jurusan
- Rombel (1/2/3/4) - nullable for kelas 10
- Status (Aktif/Non-aktif/Lulus)
- Asal_Sekolah
- Nama_Ayah
- Nama_Ibu
- No_HP_Orang_Tua
- Alamat_Orang_Tua
- Golongan_Darah
- **FK**: ID_OrangTua

#### **GURU**
- **PK**: NIK_Guru
- Nama_Lengkap
- Tanggal_Lahir
- Jenis_Kelamin
- Alamat
- No_Telepon
- Status_Kepegawaian (Pengganti/Honorer/Capeg/PTY/PTYK)
- Jabatan (Guru/Guru_dan_Wali_Kelas)
- Status (Aktif/Non-aktif)

#### **ORANG_TUA**
- **PK**: ID_OrangTua
- Nama_Ayah
- Nama_Ibu
- No_HP
- Alamat
- Pekerjaan_Ayah
- Pekerjaan_Ibu
- Status (Aktif/Non-aktif)

#### **ADMIN**
- **PK**: ID_Admin
- Nama_Admin
- Jabatan
- Status (Aktif/Non-aktif)

#### **KEPALA_SEKOLAH**
- **PK**: ID_KepalaSekolah
- Nama
- NIP
- Status (Aktif/Non-aktif)

#### **PETUGAS_KEUANGAN**
- **PK**: ID_PetugasKeuangan
- Nama
- NIP
- Status (Aktif/Non-aktif)

### 2. AKADEMIK ENTITIES

#### **TAHUN_AJARAN**
- **PK**: ID_TahunAjaran
- Tahun_Ajaran (2024/2025)
- Semester (Ganjil/Genap)
- Tanggal_Mulai
- Tanggal_Selesai
- Status (Aktif/Non-aktif)

#### **JURUSAN**
- **PK**: ID_Jurusan
- Nama_Jurusan (Tahfizh/Digital/Billingual/Reguler/IPA/IPS)
- Status (Aktif/Non-aktif)

#### **KELAS**
- **PK**: ID_Kelas
- Ruangan (1-12)
- Nama_Kelas (XE1/XI.F1/XII.F1)
- Tingkat (10/11/12)
- **FK**: ID_Jurusan
- **FK**: ID_TahunAjaran
- Kapasitas_Maksimal
- **FK**: Wali_Kelas (NIK_Guru)

#### **MATA_PELAJARAN**
- **PK**: ID_MataPelajaran
- Nama_MataPelajaran
- Kode_MataPelajaran
- Kategori (Wajib/Umum/Peminatan/TL/Agama/Mulok)
- Status (Aktif/Non-aktif)

#### **KURIKULUM**
- **PK**: ID_Kurikulum
- **FK**: ID_TahunAjaran
- **FK**: ID_MataPelajaran
- Tingkat_Kelas (10/11/12)
- Rombel (NULL for kelas 10, 1/2/3/4 for kelas 11-12)
- Status (Aktif/Non-aktif)
- SKS_JamPerminggu

#### **JADWAL_PELAJARAN**
- **PK**: ID_Jadwal
- **FK**: ID_TahunAjaran
- **FK**: ID_MataPelajaran
- **FK**: NIK_Guru
- **FK**: ID_Kelas
- Hari (Senin/Selasa/Rabu/Kamis/Jumat)
- Jam_Ke (1/2/3/4/5/6/7/8/9/10)

### 3. PEMBELAJARAN ENTITIES

#### **JURNAL_MENGAJAR**
- **PK**: ID_Jurnal
- **FK**: ID_Jadwal
- Tanggal
- **FK**: NIK_Guru
- Status_Mengajar (Hadir/Tidak_Hadir/Diganti)
- Materi_Diajarkan
- Keterangan
- Jam_Input

#### **PRESENSI_HARIAN**
- **PK**: ID_PresensiHarian
- **FK**: NIS (Siswa)
- Tanggal
- Jam_Masuk
- Status (Hadir/Tidak_Hadir)
- Metode_Presensi (RFID/Barcode/Fingerprint)

#### **PRESENSI_MAPEL**
- **PK**: ID_PresensiMapel
- **FK**: ID_Jurnal
- **FK**: NIS (Siswa) - hanya yang tidak hadir
- Status_Ketidakhadiran (Sakit/Izin/Alpa)
- Keterangan

#### **NILAI**
- **PK**: ID_Nilai
- **FK**: NIS (Siswa)
- **FK**: ID_MataPelajaran
- **FK**: ID_TahunAjaran
- Jenis_Penilaian (PH1/PH2/PH3/ASTS1/ASAS/ASTS2/ASAT/Tugas/Praktek)
- Nilai (0-100)
- Status (Draft/Final)
- Tanggal_Input
- **FK**: NIK_Guru_Penginput
- Keterangan

#### **TUGAS**
- **PK**: ID_Tugas
- **FK**: ID_MataPelajaran
- **FK**: NIK_Guru
- **FK**: ID_Kelas
- **FK**: ID_TahunAjaran
- Judul_Tugas
- Deskripsi_Tugas
- Tanggal_Pemberian
- Tanggal_Deadline
- Tipe_Tugas (Semua_Siswa/Siswa_Terpilih)
- Status (Aktif/Non-aktif)
- File_Tugas
- Bobot_Nilai
- Keterangan

#### **TUGAS_SISWA**
- **PK**: ID_TugasSiswa
- **FK**: ID_Tugas
- **FK**: NIS (Siswa)
- Status_Pengumpulan (Belum/Sudah/Terlambat)

#### **PENGUMPULAN_TUGAS**
- **PK**: ID_Pengumpulan
- **FK**: ID_Tugas
- **FK**: NIS (Siswa)
- Tanggal_Submit
- File_Jawaban
- Status (Draft/Final)
- Nilai
- Feedback_Guru

### 4. KEAGAMAAN ENTITIES

#### **TUGAS_ADAB**
- **PK**: ID_TugasAdab
- Nama_Tugas
- Deskripsi_Tugas
- **FK**: ID_TahunAjaran
- Status (Aktif/Non-aktif)

#### **MONITORING_ADAB**
- **PK**: ID_MonitoringAdab
- **FK**: NIS (Siswa)
- **FK**: ID_TahunAjaran
- Tanggal
- **FK**: ID_TugasAdab
- Status_Dilaksanakan (Ya/Tidak)

#### **MONITORING_SHOLAT**
- **PK**: ID_MonitoringSholat
- **FK**: NIS (Siswa)
- Tanggal
- Jenis_Sholat (Dhuha/Dhuhur/Asar)
- Status_Kehadiran (Hadir/Tidak_Hadir)
- **FK**: NIK_Guru_Input

#### **TARGET_HAFALAN_SISWA**
- **PK**: ID_TargetHafalan
- **FK**: NIS (Siswa)
- **FK**: ID_TahunAjaran
- Target_Baris_PerPertemuan (3/5/7)
- Status (Aktif/Non-aktif)

#### **HAFALAN**
- **PK**: ID_Hafalan
- **FK**: NIS (Siswa)
- Nama_Surah
- Ayat_Mulai
- Ayat_Selesai
- Jumlah_Baris
- Tanggal_Setoran
- Status_Hafalan (Lancar/Kurang_Lancar/Belum_Lancar)
- **FK**: NIK_Guru_Penguji

#### **EVALUASI_HAFALAN**
- **PK**: ID_Evaluasi
- **FK**: NIS (Siswa)
- Periode_Evaluasi (Bulanan/3_Bulanan/Semesteran)
- Bulan_Periode
- Total_Baris_Target
- Target_Surah_Mulai
- Target_Ayat_Mulai
- Target_Surah_Selesai
- Target_Ayat_Selesai
- Total_Baris_Tercapai
- Tercapai_Surah_Mulai
- Tercapai_Ayat_Mulai
- Tercapai_Surah_Selesai
- Tercapai_Ayat_Selesai
- Status_Ketuntasan (Tuntas/Belum_Tuntas)
- **FK**: ID_TahunAjaran

### 5. KEDISIPLINAN ENTITIES

#### **PELANGGARAN**
- **PK**: ID_Pelanggaran
- **FK**: NIS (Siswa)
- Tanggal_Pelanggaran
- Jenis_Pelanggaran (Kaos_Kaki_Pendek/Terlambat/Salah_Seragam/Salah_Sepatu/Other)
- Deskripsi_Custom
- Deskripsi_Pelanggaran
- Poin_Pelanggaran
- Status (Active/Resolved)
- **FK**: NIK_Guru_Input

### 6. KEUANGAN ENTITIES

#### **JENIS_PEMBAYARAN**
- **PK**: ID_JenisPembayaran
- Nama_Pembayaran (SPP/Buku/Seragam/Praktikum)
- Nominal
- Periode (Bulanan/Semesteran/Tahunan/Sekali)
- Status (Aktif/Non-aktif)

#### **TAGIHAN**
- **PK**: ID_Tagihan
- **FK**: NIS (Siswa)
- **FK**: ID_JenisPembayaran
- **FK**: ID_TahunAjaran
- Bulan_Tagihan
- Jumlah_Tagihan
- Tanggal_Jatuh_Tempo
- Status_Tagihan (Belum_Bayar/Sudah_Bayar/Overdue)
- Keterangan

#### **PEMBAYARAN**
- **PK**: ID_Pembayaran
- **FK**: ID_Tagihan
- Tanggal_Bayar
- Jumlah_Bayar
- Metode_Pembayaran (Tunai/Transfer/Kartu/E-wallet)
- Status_Pembayaran (Pending/Success/Failed)
- No_Referensi
- **FK**: ID_User_Petugas
- Bukti_Pembayaran
- Keterangan_Cicilan

### 7. KOMUNIKASI ENTITIES

#### **PENGUMUMAN**
- **PK**: ID_Pengumuman
- Judul_Pengumuman
- Isi_Pengumuman
- Tanggal_Posting
- Tanggal_Berakhir
- Target_Type (Semua/Siswa_Spesifik/Guru_Spesifik/Kelas_Spesifik/Jurusan_Spesifik)
- **FK**: ID_User_Pembuat
- Status (Draft/Published/Archived)
- File_Lampiran
- Priority (Normal/Penting/Urgent)

#### **PENGUMUMAN_TARGET**
- **PK**: ID_Target
- **FK**: ID_Pengumuman
- Target_Type (Siswa/Guru/Kelas/Jurusan)
- Target_ID

### 8. RAPOT ENTITIES

#### **RAPOT**
- **PK**: ID_Rapot
- **FK**: NIS (Siswa)
- **FK**: ID_TahunAjaran
- Semester (1/2)
- Fase (E/F)
- Status_Rapot (Draft/Final/Published)

#### **RAPOT_NILAI**
- **PK**: ID_RapotNilai
- **FK**: ID_Rapot
- **FK**: ID_MataPelajaran
- Nilai_Akhir (0-100)
- Capaian_Kompetensi_Baik
- Capaian_Kompetensi_Perlu

#### **RAPOT_EKSTRAKURIKULER**
- **PK**: ID_RapotEkskul
- **FK**: ID_Rapot
- Nama_Ekstrakurikuler
- Predikat (Sangat_Baik/Baik/Cukup)
- Keterangan

#### **RAPOT_KEHADIRAN**
- **PK**: ID_RapotKehadiran
- **FK**: ID_Rapot
- Sakit
- Izin
- Tanpa_Keterangan

#### **RAPOT_CATATAN**
- **PK**: ID_RapotCatatan
- **FK**: ID_Rapot
- Catatan_Wali_Kelas
- Keterangan_Kenaikan_Kelas

#### **RAPOT_ATT** (Adab-Tahfidz-Tanse)
- **PK**: ID_RapotATT
- **FK**: NIS (Siswa)
- **FK**: ID_TahunAjaran
- Semester (1/2/3/4)
- Term (Satu/Dua/Tiga/Empat)
- Status (Draft/Final/Published)

#### **RAPOT_TAHFIDZ_DETAIL**
- **PK**: ID_RapotTahfidz
- **FK**: ID_RapotATT
- Target
- Capaian
- Keterangan
- Deskripsi

#### **RAPOT_ADAB_DETAIL**
- **PK**: ID_RapotAdab
- **FK**: ID_RapotATT
- Komponen_Adab (Adab_Kepada_Allah/Adab_Kepada_Rosul/Adab_Belajar)
- Nilai
- Deskripsi

#### **RAPOT_TANSE_DETAIL**
- **PK**: ID_RapotTanse
- **FK**: ID_RapotATT
- Jenis_Perilaku (Penghargaan/Pelanggaran)
- Poin
- Deskripsi

### 9. LAPORAN ENTITIES

#### **LAPORAN**
- **PK**: ID_Laporan
- Nama_Laporan
- Jenis_Laporan (Presensi_Bulanan/Tahfidz_Kelompok/Tahfidz_Kelas)
- Periode_Laporan (Bulanan/3_Bulanan/Semesteran)
- **FK**: ID_TahunAjaran
- Bulan_Laporan
- Tanggal_Generate
- File_Laporan
- **FK**: ID_User_Generate

#### **LAPORAN_PRESENSI_DETAIL**
- **PK**: ID_LaporanPresensi
- **FK**: ID_Laporan
- **FK**: NIS (Siswa)
- Total_Hari_Masuk
- Total_Sakit
- Total_Izin
- Total_Alfa
- Persentase_Sakit
- Persentase_Izin
- Persentase_Alfa

#### **LAPORAN_TAHFIDZ_DETAIL**
- **PK**: ID_LaporanTahfidz
- **FK**: ID_Laporan
- **FK**: NIS (Siswa)
- Target_Baris
- Capaian_Baris
- Status_Ketuntasan (Tuntas/Belum_Tuntas)

#### **LAPORAN_STATISTIK**
- **PK**: ID_Statistik
- **FK**: ID_Laporan
- Jenis_Statistik (Tuntas_Tahfidz/Presensi)
- Total_Tuntas
- Total_Belum_Tuntas
- Persentase_Tuntas
- Persentase_Belum_Tuntas

## RELATIONSHIP DIAGRAM

```
USERS (Hub Central)
├── 1:1 → SISWA
├── 1:1 → GURU  
├── 1:1 → ORANG_TUA
├── 1:1 → ADMIN
├── 1:1 → KEPALA_SEKOLAH
└── 1:1 → PETUGAS_KEUANGAN

SISWA
├── M:1 → KELAS
├── M:1 → JURUSAN
├── M:1 → ORANG_TUA
├── 1:M → TARGET_HAFALAN_SISWA
├── 1:M → PRESENSI_HARIAN
├── 1:M → PRESENSI_MAPEL
├── 1:M → NILAI
├── 1:M → MONITORING_ADAB
├── 1:M → MONITORING_SHOLAT
├── 1:M → HAFALAN
├── 1:M → EVALUASI_HAFALAN
├── 1:M → PELANGGARAN
├── 1:M → TAGIHAN
├── 1:M → TUGAS_SISWA
├── 1:M → PENGUMPULAN_TUGAS
├── 1:M → RAPOT
└── 1:M → RAPOT_ATT

TAHUN_AJARAN
├── 1:M → KELAS
├── 1:M → KURIKULUM
├── 1:M → JADWAL_PELAJARAN
├── 1:M → NILAI
├── 1:M → TUGAS
├── 1:M → TUGAS_ADAB
├── 1:M → TARGET_HAFALAN_SISWA
├── 1:M → EVALUASI_HAFALAN
├── 1:M → TAGIHAN
├── 1:M → RAPOT
├── 1:M → RAPOT_ATT
└── 1:M → LAPORAN

JADWAL_PELAJARAN
├── M:1 → TAHUN_AJARAN
├── M:1 → MATA_PELAJARAN
├── M:1 → GURU
├── M:1 → KELAS
└── 1:M → JURNAL_MENGAJAR

JURNAL_MENGAJAR
├── M:1 → JADWAL_PELAJARAN
├── M:1 → GURU
└── 1:M → PRESENSI_MAPEL

MANY-TO-MANY RELATIONSHIPS:
- GURU ↔ MATA_PELAJARAN (via junction table)
- PENGUMUMAN ↔ TARGETS (via PENGUMUMAN_TARGET)
```

## CATATAN KHUSUS

### Sistem Rombel (Kelas 11-12):
- Field `Rombel` di tabel SISWA nullable untuk kelas 10
- Tabel KURIKULUM mengatur mata pelajaran per rombel
- Sistem moving class berdasarkan rombel siswa

### Sistem Tahfidz dengan 3 Guru:
- Akan diatur dalam implementasi aplikasi
- Setiap kelas Tahfidz dibagi 3 halaqoh
- Masing-masing halaqoh diampu 1 guru

### Auto-Generate Laporan:
- Data laporan diambil otomatis dari tabel transaksi
- Sistem kalkulasi statistik dan persentase
- Generate grafik berdasarkan data existing

### Sistem Login dengan Username:
- **Semua user** login menggunakan username (bukan NIS/NIK)
- Username bisa berupa nama, email, atau kode unik yang mudah diingat
- Reference_ID di tabel USERS menunjuk ke Primary Key tabel terkait:
  - Siswa: reference_id → NIS
  - Guru: reference_id → NIK_Guru
  - Admin: reference_id → ID_Admin
  - Kepala_Sekolah: reference_id → ID_KepalaSekolah
  - Petugas_Keuangan: reference_id → ID_PetugasKeuangan
  - Orang_Tua: reference_id → ID_OrangTua

### Sistem Presensi Ganda:
- Presensi Harian: masuk sekolah (RFID/Barcode/Fingerprint)
- Presensi Mapel: per mata pelajaran (input guru, hanya yang tidak hadir)
