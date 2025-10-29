-- ============================
-- DATABASE SCHEMA FOR SMA ISLAM AL AZHAR 7 SUKOHARJO
-- SISTEM MANAJEMEN SEKOLAH
-- Generated from DBDiagram.io ERD
-- Total Tables: 47
-- ============================

-- Create Database
CREATE DATABASE IF NOT EXISTS `lms` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `lms`;

-- Set SQL Mode
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- ============================
-- CORE MANAGEMENT TABLES
-- ============================

-- Table: users
-- Tabel utama untuk manajemen pengguna sistem
CREATE TABLE `users` (
  `user_id` VARCHAR(20) NOT NULL COMMENT 'ID unik pengguna',
  `username` VARCHAR(50) NOT NULL COMMENT 'Username untuk login',
  `password` VARCHAR(255) NOT NULL COMMENT 'Password terenkripsi',
  `user_type` ENUM('Siswa','Guru','Admin','Kepala_Sekolah','Petugas_Keuangan','Orang_Tua') NOT NULL COMMENT 'Tipe pengguna',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif pengguna',
  `reference_id` VARCHAR(20) DEFAULT NULL COMMENT 'ID referensi ke tabel terkait',
  `last_login` TIMESTAMP NULL DEFAULT NULL COMMENT 'Waktu login terakhir',
  `remember_token` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Token untuk remember me functionality',
  `created_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Tanggal dibuat',
  `updated_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Tanggal diupdate',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel pengguna sistem';

-- Table: siswa
-- Tabel data siswa
CREATE TABLE `siswa` (
  `nis` VARCHAR(20) NOT NULL COMMENT 'Nomor Induk Siswa',
  `nama_lengkap` VARCHAR(100) NOT NULL COMMENT 'Nama lengkap siswa',
  `tanggal_lahir` DATE NOT NULL COMMENT 'Tanggal lahir siswa',
  `jenis_kelamin` ENUM('L','P') NOT NULL COMMENT 'Jenis kelamin (L=Laki-laki, P=Perempuan)',
  `alamat` TEXT DEFAULT NULL COMMENT 'Alamat siswa',
  `id_kelas` INT DEFAULT NULL COMMENT 'ID kelas siswa',
  `id_jurusan` INT DEFAULT NULL COMMENT 'ID jurusan siswa',
  `rombel` ENUM('1','2','3','4') DEFAULT NULL COMMENT 'Rombongan belajar (nullable untuk kelas 10)',
  `status` ENUM('Aktif','Non-aktif','Lulus') DEFAULT 'Aktif' COMMENT 'Status siswa',
  `asal_sekolah` VARCHAR(100) DEFAULT NULL COMMENT 'Asal sekolah sebelumnya',
  `nama_ayah` VARCHAR(100) DEFAULT NULL COMMENT 'Nama ayah',
  `nama_ibu` VARCHAR(100) DEFAULT NULL COMMENT 'Nama ibu',
  `no_hp_orang_tua` VARCHAR(15) DEFAULT NULL COMMENT 'Nomor HP orang tua',
  `alamat_orang_tua` TEXT DEFAULT NULL COMMENT 'Alamat orang tua',
  `golongan_darah` ENUM('A','B','AB','O') DEFAULT NULL COMMENT 'Golongan darah',
  `id_orang_tua` INT DEFAULT NULL COMMENT 'ID orang tua',
  PRIMARY KEY (`nis`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data siswa';

-- Table: guru
-- Tabel data guru
CREATE TABLE `guru` (
  `nik_guru` VARCHAR(20) NOT NULL COMMENT 'NIK guru',
  `nama_lengkap` VARCHAR(100) NOT NULL COMMENT 'Nama lengkap guru',
  `tanggal_lahir` DATE NOT NULL COMMENT 'Tanggal lahir guru',
  `jenis_kelamin` ENUM('L','P') NOT NULL COMMENT 'Jenis kelamin',
  `alamat` TEXT DEFAULT NULL COMMENT 'Alamat guru',
  `no_telepon` VARCHAR(15) DEFAULT NULL COMMENT 'Nomor telepon',
  `status_kepegawaian` ENUM('Pengganti','Honorer','Capeg','PTY','PTYK') NOT NULL COMMENT 'Status kepegawaian',
  `jabatan` ENUM('Guru','Guru_dan_Wali_Kelas') NOT NULL COMMENT 'Jabatan guru',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  PRIMARY KEY (`nik_guru`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data guru';

-- Table: orang_tua
-- Tabel data orang tua siswa
CREATE TABLE `orang_tua` (
  `id_orang_tua` INT NOT NULL AUTO_INCREMENT COMMENT 'ID orang tua',
  `nama_ayah` VARCHAR(100) DEFAULT NULL COMMENT 'Nama ayah',
  `nama_ibu` VARCHAR(100) DEFAULT NULL COMMENT 'Nama ibu',
  `no_hp` VARCHAR(15) DEFAULT NULL COMMENT 'Nomor HP',
  `alamat` TEXT DEFAULT NULL COMMENT 'Alamat',
  `pekerjaan_ayah` VARCHAR(100) DEFAULT NULL COMMENT 'Pekerjaan ayah',
  `pekerjaan_ibu` VARCHAR(100) DEFAULT NULL COMMENT 'Pekerjaan ibu',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  PRIMARY KEY (`id_orang_tua`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data orang tua siswa';

-- Table: admin
-- Tabel data admin
CREATE TABLE `admin` (
  `id_admin` INT NOT NULL AUTO_INCREMENT COMMENT 'ID admin',
  `nama_admin` VARCHAR(100) NOT NULL COMMENT 'Nama admin',
  `jabatan` VARCHAR(100) DEFAULT NULL COMMENT 'Jabatan admin',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  PRIMARY KEY (`id_admin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data admin';

-- Table: kepala_sekolah
-- Tabel data kepala sekolah
CREATE TABLE `kepala_sekolah` (
  `id_kepala_sekolah` INT NOT NULL AUTO_INCREMENT COMMENT 'ID kepala sekolah',
  `nama` VARCHAR(100) NOT NULL COMMENT 'Nama kepala sekolah',
  `nip` VARCHAR(20) DEFAULT NULL COMMENT 'NIP kepala sekolah',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  PRIMARY KEY (`id_kepala_sekolah`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data kepala sekolah';

-- Table: petugas_keuangan
-- Tabel data petugas keuangan
CREATE TABLE `petugas_keuangan` (
  `id_petugas_keuangan` INT NOT NULL AUTO_INCREMENT COMMENT 'ID petugas keuangan',
  `nama` VARCHAR(100) NOT NULL COMMENT 'Nama petugas keuangan',
  `nip` VARCHAR(20) DEFAULT NULL COMMENT 'NIP petugas keuangan',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  PRIMARY KEY (`id_petugas_keuangan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data petugas keuangan';

-- ============================
-- AKADEMIK TABLES
-- ============================

-- Table: tahun_ajaran
-- Tabel tahun ajaran
CREATE TABLE `tahun_ajaran` (
  `id_tahun_ajaran` INT NOT NULL AUTO_INCREMENT COMMENT 'ID tahun ajaran',
  `tahun_ajaran` VARCHAR(10) NOT NULL COMMENT 'Tahun ajaran (contoh: 2024/2025)',
  `semester` ENUM('Ganjil','Genap') NOT NULL COMMENT 'Semester',
  `tanggal_mulai` DATE NOT NULL COMMENT 'Tanggal mulai',
  `tanggal_selesai` DATE NOT NULL COMMENT 'Tanggal selesai',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  PRIMARY KEY (`id_tahun_ajaran`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel tahun ajaran';

-- Table: jurusan
-- Tabel jurusan
CREATE TABLE `jurusan` (
  `id_jurusan` INT NOT NULL AUTO_INCREMENT COMMENT 'ID jurusan',
  `nama_jurusan` ENUM('Tahfizh','Digital','Billingual','Reguler','IPA','IPS') NOT NULL COMMENT 'Nama jurusan',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  PRIMARY KEY (`id_jurusan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel jurusan';

-- Table: kelas
-- Tabel kelas
CREATE TABLE `kelas` (
  `id_kelas` INT NOT NULL AUTO_INCREMENT COMMENT 'ID kelas',
  `ruangan` ENUM('1','2','3','4','5','6','7','8','9','10','11','12') NOT NULL COMMENT 'Nomor ruangan',
  `nama_kelas` VARCHAR(20) NOT NULL COMMENT 'Nama kelas (contoh: XE1, XI.F1)',
  `tingkat` ENUM('10','11','12') NOT NULL COMMENT 'Tingkat kelas',
  `id_jurusan` INT NOT NULL COMMENT 'ID jurusan',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `kapasitas_maksimal` INT NOT NULL COMMENT 'Kapasitas maksimal siswa',
  `wali_kelas` VARCHAR(20) DEFAULT NULL COMMENT 'NIK guru wali kelas',
  PRIMARY KEY (`id_kelas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel kelas';

-- Table: mata_pelajaran
-- Tabel mata pelajaran
CREATE TABLE `mata_pelajaran` (
  `id_mata_pelajaran` INT NOT NULL AUTO_INCREMENT COMMENT 'ID mata pelajaran',
  `nama_mata_pelajaran` VARCHAR(100) NOT NULL COMMENT 'Nama mata pelajaran',
  `kode_mata_pelajaran` VARCHAR(10) NOT NULL COMMENT 'Kode mata pelajaran',
  `kategori` ENUM('Wajib','Umum','Peminatan','TL','Agama','Mulok') NOT NULL COMMENT 'Kategori mata pelajaran',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  PRIMARY KEY (`id_mata_pelajaran`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel mata pelajaran';

-- Table: kurikulum
-- Tabel kurikulum
CREATE TABLE `kurikulum` (
  `id_kurikulum` INT NOT NULL AUTO_INCREMENT COMMENT 'ID kurikulum',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `id_mata_pelajaran` INT NOT NULL COMMENT 'ID mata pelajaran',
  `tingkat_kelas` ENUM('10','11','12') NOT NULL COMMENT 'Tingkat kelas',
  `rombel` ENUM('1','2','3','4') DEFAULT NULL COMMENT 'Rombel (NULL untuk kelas 10)',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  `sks_jam_perminggu` INT DEFAULT NULL COMMENT 'SKS jam per minggu',
  PRIMARY KEY (`id_kurikulum`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel kurikulum';

-- Table: guru_mata_pelajaran
-- Tabel relasi guru dan mata pelajaran
CREATE TABLE `guru_mata_pelajaran` (
  `id_guru_mapel` INT NOT NULL AUTO_INCREMENT COMMENT 'ID guru mata pelajaran',
  `nik_guru` VARCHAR(20) NOT NULL COMMENT 'NIK guru',
  `id_mata_pelajaran` INT NOT NULL COMMENT 'ID mata pelajaran',
  PRIMARY KEY (`id_guru_mapel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel relasi guru dan mata pelajaran';

-- Table: jadwal_pelajaran
-- Tabel jadwal pelajaran
CREATE TABLE `jadwal_pelajaran` (
  `id_jadwal` INT NOT NULL AUTO_INCREMENT COMMENT 'ID jadwal',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `id_mata_pelajaran` INT NOT NULL COMMENT 'ID mata pelajaran',
  `nik_guru` VARCHAR(20) NOT NULL COMMENT 'NIK guru',
  `id_kelas` INT NOT NULL COMMENT 'ID kelas',
  `hari` ENUM('Senin','Selasa','Rabu','Kamis','Jumat') NOT NULL COMMENT 'Hari',
  `jam_ke` ENUM('1','2','3','4','5','6','7','8','9','10') NOT NULL COMMENT 'Jam ke',
  PRIMARY KEY (`id_jadwal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel jadwal pelajaran';

-- ============================
-- PEMBELAJARAN TABLES
-- ============================

-- Table: jurnal_mengajar
-- Tabel jurnal mengajar guru
CREATE TABLE `jurnal_mengajar` (
  `id_jurnal` INT NOT NULL AUTO_INCREMENT COMMENT 'ID jurnal',
  `id_jadwal` INT NOT NULL COMMENT 'ID jadwal',
  `tanggal` DATE NOT NULL COMMENT 'Tanggal mengajar',
  `nik_guru` VARCHAR(20) NOT NULL COMMENT 'NIK guru',
  `status_mengajar` ENUM('Hadir','Tidak_Hadir','Diganti') NOT NULL COMMENT 'Status mengajar',
  `materi_diajarkan` TEXT NOT NULL COMMENT 'Materi yang diajarkan',
  `keterangan` TEXT DEFAULT NULL COMMENT 'Keterangan tambahan',
  `jam_input` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu input',
  PRIMARY KEY (`id_jurnal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel jurnal mengajar guru';

-- Table: presensi_harian
-- Tabel presensi harian siswa
CREATE TABLE `presensi_harian` (
  `id_presensi_harian` INT NOT NULL AUTO_INCREMENT COMMENT 'ID presensi harian',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `tanggal` DATE NOT NULL COMMENT 'Tanggal presensi',
  `jam_masuk` TIME DEFAULT NULL COMMENT 'Jam masuk',
  `status` ENUM('Hadir','Tidak_Hadir') NOT NULL COMMENT 'Status kehadiran',
  `metode_presensi` ENUM('RFID','Barcode','Fingerprint') NOT NULL COMMENT 'Metode presensi',
  PRIMARY KEY (`id_presensi_harian`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel presensi harian siswa';

-- Table: presensi_mapel
-- Tabel presensi mata pelajaran (hanya siswa tidak hadir)
CREATE TABLE `presensi_mapel` (
  `id_presensi_mapel` INT NOT NULL AUTO_INCREMENT COMMENT 'ID presensi mapel',
  `id_jurnal` INT NOT NULL COMMENT 'ID jurnal mengajar',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa (hanya yang tidak hadir)',
  `status_ketidakhadiran` ENUM('Sakit','Izin','Alpa') NOT NULL COMMENT 'Status ketidakhadiran',
  `keterangan` TEXT DEFAULT NULL COMMENT 'Keterangan',
  PRIMARY KEY (`id_presensi_mapel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel presensi mata pelajaran';

-- Table: nilai
-- Tabel nilai siswa
CREATE TABLE `nilai` (
  `id_nilai` INT NOT NULL AUTO_INCREMENT COMMENT 'ID nilai',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `id_mata_pelajaran` INT NOT NULL COMMENT 'ID mata pelajaran',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `jenis_penilaian` ENUM('PH1','PH2','PH3','ASTS1','ASAS','ASTS2','ASAT','Tugas','Praktek') NOT NULL COMMENT 'Jenis penilaian',
  `nilai` INT NOT NULL COMMENT 'Nilai (0-100)',
  `status` ENUM('Draft','Final') DEFAULT 'Draft' COMMENT 'Status nilai',
  `tanggal_input` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Tanggal input',
  `nik_guru_penginput` VARCHAR(20) NOT NULL COMMENT 'NIK guru penginput',
  `keterangan` TEXT DEFAULT NULL COMMENT 'Keterangan',
  PRIMARY KEY (`id_nilai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel nilai siswa';

-- Table: tugas
-- Tabel tugas
CREATE TABLE `tugas` (
  `id_tugas` INT NOT NULL AUTO_INCREMENT COMMENT 'ID tugas',
  `id_mata_pelajaran` INT NOT NULL COMMENT 'ID mata pelajaran',
  `nik_guru` VARCHAR(20) NOT NULL COMMENT 'NIK guru pemberi tugas',
  `id_kelas` INT NOT NULL COMMENT 'ID kelas',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `judul_tugas` VARCHAR(200) NOT NULL COMMENT 'Judul tugas',
  `deskripsi_tugas` TEXT NOT NULL COMMENT 'Deskripsi tugas',
  `tanggal_pemberian` DATE NOT NULL COMMENT 'Tanggal pemberian tugas',
  `tanggal_deadline` DATETIME NOT NULL COMMENT 'Tanggal deadline',
  `tipe_tugas` ENUM('Semua_Siswa','Siswa_Terpilih') NOT NULL COMMENT 'Tipe tugas',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status tugas',
  `file_tugas` VARCHAR(255) DEFAULT NULL COMMENT 'File tugas',
  `bobot_nilai` DECIMAL(3,2) DEFAULT NULL COMMENT 'Bobot nilai',
  `keterangan` TEXT DEFAULT NULL COMMENT 'Keterangan',
  PRIMARY KEY (`id_tugas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel tugas';

-- Table: tugas_siswa
-- Tabel relasi tugas dan siswa
CREATE TABLE `tugas_siswa` (
  `id_tugas_siswa` INT NOT NULL AUTO_INCREMENT COMMENT 'ID tugas siswa',
  `id_tugas` INT NOT NULL COMMENT 'ID tugas',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `status_pengumpulan` ENUM('Belum','Sudah','Terlambat') DEFAULT 'Belum' COMMENT 'Status pengumpulan',
  PRIMARY KEY (`id_tugas_siswa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel relasi tugas dan siswa';

-- Table: pengumpulan_tugas
-- Tabel pengumpulan tugas siswa
CREATE TABLE `pengumpulan_tugas` (
  `id_pengumpulan` INT NOT NULL AUTO_INCREMENT COMMENT 'ID pengumpulan',
  `id_tugas` INT NOT NULL COMMENT 'ID tugas',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `tanggal_submit` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Tanggal submit',
  `file_jawaban` VARCHAR(255) NOT NULL COMMENT 'File jawaban',
  `status` ENUM('Draft','Final') DEFAULT 'Draft' COMMENT 'Status pengumpulan',
  `nilai` INT DEFAULT NULL COMMENT 'Nilai tugas',
  `feedback_guru` TEXT DEFAULT NULL COMMENT 'Feedback dari guru',
  PRIMARY KEY (`id_pengumpulan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel pengumpulan tugas siswa';

-- ============================
-- KEAGAMAAN TABLES
-- ============================

-- Table: tugas_adab
-- Tabel tugas adab
CREATE TABLE `tugas_adab` (
  `id_tugas_adab` INT NOT NULL AUTO_INCREMENT COMMENT 'ID tugas adab',
  `nama_tugas` VARCHAR(200) NOT NULL COMMENT 'Nama tugas adab',
  `deskripsi_tugas` TEXT NOT NULL COMMENT 'Deskripsi tugas',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status tugas',
  PRIMARY KEY (`id_tugas_adab`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel tugas adab';

-- Table: monitoring_adab
-- Tabel monitoring adab siswa
CREATE TABLE `monitoring_adab` (
  `id_monitoring_adab` INT NOT NULL AUTO_INCREMENT COMMENT 'ID monitoring adab',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `tanggal` DATE NOT NULL COMMENT 'Tanggal monitoring',
  `id_tugas_adab` INT NOT NULL COMMENT 'ID tugas adab',
  `status_dilaksanakan` ENUM('Ya','Tidak') NOT NULL COMMENT 'Status dilaksanakan',
  PRIMARY KEY (`id_monitoring_adab`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel monitoring adab siswa';

-- Table: monitoring_sholat
-- Tabel monitoring sholat siswa
CREATE TABLE `monitoring_sholat` (
  `id_monitoring_sholat` INT NOT NULL AUTO_INCREMENT COMMENT 'ID monitoring sholat',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `tanggal` DATE NOT NULL COMMENT 'Tanggal monitoring',
  `jenis_sholat` ENUM('Dhuha','Dhuhur','Asar') NOT NULL COMMENT 'Jenis sholat',
  `status_kehadiran` ENUM('Hadir','Tidak_Hadir') NOT NULL COMMENT 'Status kehadiran',
  `nik_guru_input` VARCHAR(20) NOT NULL COMMENT 'NIK guru penginput',
  PRIMARY KEY (`id_monitoring_sholat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel monitoring sholat siswa';

-- Table: target_hafalan_siswa
-- Tabel target hafalan siswa
CREATE TABLE `target_hafalan_siswa` (
  `id_target_hafalan` INT NOT NULL AUTO_INCREMENT COMMENT 'ID target hafalan',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `target_baris_perpertemuan` ENUM('3','5','7') NOT NULL COMMENT 'Target baris per pertemuan',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status target',
  PRIMARY KEY (`id_target_hafalan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel target hafalan siswa';

-- Table: hafalan
-- Tabel hafalan siswa
CREATE TABLE `hafalan` (
  `id_hafalan` INT NOT NULL AUTO_INCREMENT COMMENT 'ID hafalan',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `nama_surah` VARCHAR(50) NOT NULL COMMENT 'Nama surah',
  `ayat_mulai` INT NOT NULL COMMENT 'Ayat mulai',
  `ayat_selesai` INT NOT NULL COMMENT 'Ayat selesai',
  `jumlah_baris` INT NOT NULL COMMENT 'Jumlah baris',
  `tanggal_setoran` DATE NOT NULL COMMENT 'Tanggal setoran',
  `status_hafalan` ENUM('Lancar','Kurang_Lancar','Belum_Lancar') NOT NULL COMMENT 'Status hafalan',
  `nik_guru_penguji` VARCHAR(20) NOT NULL COMMENT 'NIK guru penguji',
  PRIMARY KEY (`id_hafalan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel hafalan siswa';

-- Table: evaluasi_hafalan
-- Tabel evaluasi hafalan siswa
CREATE TABLE `evaluasi_hafalan` (
  `id_evaluasi` INT NOT NULL AUTO_INCREMENT COMMENT 'ID evaluasi',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `periode_evaluasi` ENUM('Bulanan','3_Bulanan','Semesteran') NOT NULL COMMENT 'Periode evaluasi',
  `bulan_periode` VARCHAR(20) DEFAULT NULL COMMENT 'Bulan periode',
  `total_baris_target` INT NOT NULL COMMENT 'Total baris target',
  `target_surah_mulai` VARCHAR(50) DEFAULT NULL COMMENT 'Target surah mulai',
  `target_ayat_mulai` INT DEFAULT NULL COMMENT 'Target ayat mulai',
  `target_surah_selesai` VARCHAR(50) DEFAULT NULL COMMENT 'Target surah selesai',
  `target_ayat_selesai` INT DEFAULT NULL COMMENT 'Target ayat selesai',
  `total_baris_tercapai` INT NOT NULL COMMENT 'Total baris tercapai',
  `tercapai_surah_mulai` VARCHAR(50) DEFAULT NULL COMMENT 'Tercapai surah mulai',
  `tercapai_ayat_mulai` INT DEFAULT NULL COMMENT 'Tercapai ayat mulai',
  `tercapai_surah_selesai` VARCHAR(50) DEFAULT NULL COMMENT 'Tercapai surah selesai',
  `tercapai_ayat_selesai` INT DEFAULT NULL COMMENT 'Tercapai ayat selesai',
  `status_ketuntasan` ENUM('Tuntas','Belum_Tuntas') NOT NULL COMMENT 'Status ketuntasan',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  PRIMARY KEY (`id_evaluasi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel evaluasi hafalan siswa';

-- ============================
-- KEDISIPLINAN TABLES
-- ============================

-- Table: pelanggaran
-- Tabel pelanggaran siswa
CREATE TABLE `pelanggaran` (
  `id_pelanggaran` INT NOT NULL AUTO_INCREMENT COMMENT 'ID pelanggaran',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `tanggal_pelanggaran` DATE NOT NULL COMMENT 'Tanggal pelanggaran',
  `jenis_pelanggaran` ENUM('Kaos_Kaki_Pendek','Terlambat','Salah_Seragam','Salah_Sepatu','Other') NOT NULL COMMENT 'Jenis pelanggaran',
  `deskripsi_custom` VARCHAR(200) DEFAULT NULL COMMENT 'Deskripsi custom untuk jenis Other',
  `deskripsi_pelanggaran` TEXT NOT NULL COMMENT 'Deskripsi pelanggaran',
  `poin_pelanggaran` INT NOT NULL COMMENT 'Poin pelanggaran',
  `status` ENUM('Active','Resolved') DEFAULT 'Active' COMMENT 'Status pelanggaran',
  `nik_guru_input` VARCHAR(20) NOT NULL COMMENT 'NIK guru penginput',
  PRIMARY KEY (`id_pelanggaran`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel pelanggaran siswa';

-- ============================
-- KEUANGAN TABLES
-- ============================

-- Table: jenis_pembayaran
-- Tabel jenis pembayaran
CREATE TABLE `jenis_pembayaran` (
  `id_jenis_pembayaran` INT NOT NULL AUTO_INCREMENT COMMENT 'ID jenis pembayaran',
  `nama_pembayaran` VARCHAR(100) NOT NULL COMMENT 'Nama pembayaran (SPP, Buku, Seragam, dll)',
  `nominal` DECIMAL(10,2) NOT NULL COMMENT 'Nominal pembayaran',
  `periode` ENUM('Bulanan','Semesteran','Tahunan','Sekali') NOT NULL COMMENT 'Periode pembayaran',
  `status` ENUM('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  PRIMARY KEY (`id_jenis_pembayaran`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel jenis pembayaran';

-- Table: tagihan
-- Tabel tagihan siswa
CREATE TABLE `tagihan` (
  `id_tagihan` INT NOT NULL AUTO_INCREMENT COMMENT 'ID tagihan',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `id_jenis_pembayaran` INT NOT NULL COMMENT 'ID jenis pembayaran',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `bulan_tagihan` VARCHAR(20) DEFAULT NULL COMMENT 'Bulan tagihan (untuk pembayaran bulanan)',
  `jumlah_tagihan` DECIMAL(10,2) NOT NULL COMMENT 'Jumlah tagihan',
  `tanggal_jatuh_tempo` DATE NOT NULL COMMENT 'Tanggal jatuh tempo',
  `status_tagihan` ENUM('Belum_Bayar','Sudah_Bayar','Overdue') DEFAULT 'Belum_Bayar' COMMENT 'Status tagihan',
  `keterangan` TEXT DEFAULT NULL COMMENT 'Keterangan',
  PRIMARY KEY (`id_tagihan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel tagihan siswa';

-- Table: pembayaran
-- Tabel pembayaran
CREATE TABLE `pembayaran` (
  `id_pembayaran` INT NOT NULL AUTO_INCREMENT COMMENT 'ID pembayaran',
  `id_tagihan` INT NOT NULL COMMENT 'ID tagihan',
  `tanggal_bayar` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Tanggal bayar',
  `jumlah_bayar` DECIMAL(10,2) NOT NULL COMMENT 'Jumlah bayar',
  `metode_pembayaran` ENUM('Tunai','Transfer','Kartu','E-wallet') NOT NULL COMMENT 'Metode pembayaran',
  `status_pembayaran` ENUM('Pending','Success','Failed') DEFAULT 'Pending' COMMENT 'Status pembayaran',
  `no_referensi` VARCHAR(100) DEFAULT NULL COMMENT 'Nomor referensi',
  `id_user_petugas` VARCHAR(20) NOT NULL COMMENT 'ID user petugas',
  `bukti_pembayaran` VARCHAR(255) DEFAULT NULL COMMENT 'Bukti pembayaran',
  `keterangan_cicilan` TEXT DEFAULT NULL COMMENT 'Keterangan cicilan',
  PRIMARY KEY (`id_pembayaran`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel pembayaran';

-- ============================
-- KOMUNIKASI TABLES
-- ============================

-- Table: pengumuman
-- Tabel pengumuman
CREATE TABLE `pengumuman` (
  `id_pengumuman` INT NOT NULL AUTO_INCREMENT COMMENT 'ID pengumuman',
  `judul_pengumuman` VARCHAR(200) NOT NULL COMMENT 'Judul pengumuman',
  `isi_pengumuman` TEXT NOT NULL COMMENT 'Isi pengumuman',
  `tanggal_posting` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Tanggal posting',
  `tanggal_berakhir` TIMESTAMP NULL DEFAULT NULL COMMENT 'Tanggal berakhir',
  `target_type` ENUM('Semua','Siswa_Spesifik','Guru_Spesifik','Kelas_Spesifik','Jurusan_Spesifik') NOT NULL COMMENT 'Tipe target',
  `id_user_pembuat` VARCHAR(20) NOT NULL COMMENT 'ID user pembuat',
  `status` ENUM('Draft','Published','Archived') DEFAULT 'Draft' COMMENT 'Status pengumuman',
  `file_lampiran` VARCHAR(255) DEFAULT NULL COMMENT 'File lampiran',
  `priority` ENUM('Normal','Penting','Urgent') DEFAULT 'Normal' COMMENT 'Prioritas',
  PRIMARY KEY (`id_pengumuman`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel pengumuman';

-- Table: pengumuman_target
-- Tabel target pengumuman
CREATE TABLE `pengumuman_target` (
  `id_target` INT NOT NULL AUTO_INCREMENT COMMENT 'ID target',
  `id_pengumuman` INT NOT NULL COMMENT 'ID pengumuman',
  `target_type` ENUM('Siswa','Guru','Kelas','Jurusan') NOT NULL COMMENT 'Tipe target',
  `target_id` VARCHAR(20) NOT NULL COMMENT 'ID target',
  PRIMARY KEY (`id_target`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel target pengumuman';

-- ============================
-- RAPOT TABLES
-- ============================

-- Table: rapot
-- Tabel rapot siswa
CREATE TABLE `rapot` (
  `id_rapot` INT NOT NULL AUTO_INCREMENT COMMENT 'ID rapot',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `semester` ENUM('1','2') NOT NULL COMMENT 'Semester',
  `fase` ENUM('E','F') NOT NULL COMMENT 'Fase',
  `status_rapot` ENUM('Draft','Final','Published') DEFAULT 'Draft' COMMENT 'Status rapot',
  PRIMARY KEY (`id_rapot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel rapot siswa';

-- Table: rapot_nilai
-- Tabel nilai rapot
CREATE TABLE `rapot_nilai` (
  `id_rapot_nilai` INT NOT NULL AUTO_INCREMENT COMMENT 'ID rapot nilai',
  `id_rapot` INT NOT NULL COMMENT 'ID rapot',
  `id_mata_pelajaran` INT NOT NULL COMMENT 'ID mata pelajaran',
  `nilai_akhir` INT NOT NULL COMMENT 'Nilai akhir (0-100)',
  `capaian_kompetensi_baik` TEXT NOT NULL COMMENT 'Capaian kompetensi baik',
  `capaian_kompetensi_perlu` TEXT NOT NULL COMMENT 'Capaian kompetensi perlu diperbaiki',
  PRIMARY KEY (`id_rapot_nilai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel nilai rapot';

-- Table: rapot_ekstrakurikuler
-- Tabel ekstrakurikuler rapot
CREATE TABLE `rapot_ekstrakurikuler` (
  `id_rapot_ekskul` INT NOT NULL AUTO_INCREMENT COMMENT 'ID rapot ekstrakurikuler',
  `id_rapot` INT NOT NULL COMMENT 'ID rapot',
  `nama_ekstrakurikuler` VARCHAR(100) NOT NULL COMMENT 'Nama ekstrakurikuler',
  `predikat` ENUM('Sangat_Baik','Baik','Cukup') NOT NULL COMMENT 'Predikat',
  `keterangan` TEXT DEFAULT NULL COMMENT 'Keterangan',
  PRIMARY KEY (`id_rapot_ekskul`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel ekstrakurikuler rapot';

-- Table: rapot_kehadiran
-- Tabel kehadiran rapot
CREATE TABLE `rapot_kehadiran` (
  `id_rapot_kehadiran` INT NOT NULL AUTO_INCREMENT COMMENT 'ID rapot kehadiran',
  `id_rapot` INT NOT NULL COMMENT 'ID rapot',
  `sakit` INT DEFAULT 0 COMMENT 'Jumlah sakit',
  `izin` INT DEFAULT 0 COMMENT 'Jumlah izin',
  `tanpa_keterangan` INT DEFAULT 0 COMMENT 'Jumlah tanpa keterangan',
  PRIMARY KEY (`id_rapot_kehadiran`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel kehadiran rapot';

-- Table: rapot_catatan
-- Tabel catatan rapot
CREATE TABLE `rapot_catatan` (
  `id_rapot_catatan` INT NOT NULL AUTO_INCREMENT COMMENT 'ID rapot catatan',
  `id_rapot` INT NOT NULL COMMENT 'ID rapot',
  `catatan_wali_kelas` TEXT NOT NULL COMMENT 'Catatan wali kelas',
  `keterangan_kenaikan_kelas` VARCHAR(100) NOT NULL COMMENT 'Keterangan kenaikan kelas',
  PRIMARY KEY (`id_rapot_catatan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel catatan rapot';

-- Table: rapot_att
-- Tabel rapot ATT (Akhlak, Tahfidz, Tanse)
CREATE TABLE `rapot_att` (
  `id_rapot_att` INT NOT NULL AUTO_INCREMENT COMMENT 'ID rapot ATT',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `semester` ENUM('1','2','3','4') NOT NULL COMMENT 'Semester',
  `term` ENUM('Satu','Dua','Tiga','Empat') NOT NULL COMMENT 'Term',
  `status` ENUM('Draft','Final','Published') DEFAULT 'Draft' COMMENT 'Status rapot ATT',
  PRIMARY KEY (`id_rapot_att`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel rapot ATT';

-- Table: rapot_tahfidz_detail
-- Tabel detail tahfidz rapot ATT
CREATE TABLE `rapot_tahfidz_detail` (
  `id_rapot_tahfidz` INT NOT NULL AUTO_INCREMENT COMMENT 'ID rapot tahfidz',
  `id_rapot_att` INT NOT NULL COMMENT 'ID rapot ATT',
  `target` VARCHAR(200) NOT NULL COMMENT 'Target tahfidz',
  `capaian` VARCHAR(200) NOT NULL COMMENT 'Capaian tahfidz',
  `keterangan` TEXT DEFAULT NULL COMMENT 'Keterangan',
  `deskripsi` TEXT DEFAULT NULL COMMENT 'Deskripsi',
  PRIMARY KEY (`id_rapot_tahfidz`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel detail tahfidz rapot ATT';

-- Table: rapot_adab_detail
-- Tabel detail adab rapot ATT
CREATE TABLE `rapot_adab_detail` (
  `id_rapot_adab` INT NOT NULL AUTO_INCREMENT COMMENT 'ID rapot adab',
  `id_rapot_att` INT NOT NULL COMMENT 'ID rapot ATT',
  `komponen_adab` ENUM('Adab_Kepada_Allah','Adab_Kepada_Rosul','Adab_Belajar') NOT NULL COMMENT 'Komponen adab',
  `nilai` VARCHAR(10) NOT NULL COMMENT 'Nilai adab',
  `deskripsi` TEXT DEFAULT NULL COMMENT 'Deskripsi',
  PRIMARY KEY (`id_rapot_adab`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel detail adab rapot ATT';

-- Table: rapot_tanse_detail
-- Tabel detail tanse (tata tertib dan sanksi) rapot ATT
CREATE TABLE `rapot_tanse_detail` (
  `id_rapot_tanse` INT NOT NULL AUTO_INCREMENT COMMENT 'ID rapot tanse',
  `id_rapot_att` INT NOT NULL COMMENT 'ID rapot ATT',
  `jenis_perilaku` ENUM('Penghargaan','Pelanggaran') NOT NULL COMMENT 'Jenis perilaku',
  `poin` INT NOT NULL COMMENT 'Poin',
  `deskripsi` TEXT DEFAULT NULL COMMENT 'Deskripsi',
  PRIMARY KEY (`id_rapot_tanse`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel detail tanse rapot ATT';

-- ============================
-- LAPORAN TABLES
-- ============================

-- Table: laporan
-- Tabel laporan
CREATE TABLE `laporan` (
  `id_laporan` INT NOT NULL AUTO_INCREMENT COMMENT 'ID laporan',
  `nama_laporan` VARCHAR(200) NOT NULL COMMENT 'Nama laporan',
  `jenis_laporan` ENUM('Presensi_Bulanan','Tahfidz_Kelompok','Tahfidz_Kelas') NOT NULL COMMENT 'Jenis laporan',
  `periode_laporan` ENUM('Bulanan','3_Bulanan','Semesteran') NOT NULL COMMENT 'Periode laporan',
  `id_tahun_ajaran` INT NOT NULL COMMENT 'ID tahun ajaran',
  `bulan_laporan` VARCHAR(20) DEFAULT NULL COMMENT 'Bulan laporan',
  `tanggal_generate` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Tanggal generate',
  `file_laporan` VARCHAR(255) DEFAULT NULL COMMENT 'File laporan',
  `id_user_generate` VARCHAR(20) NOT NULL COMMENT 'ID user generate',
  PRIMARY KEY (`id_laporan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel laporan';

-- Table: laporan_presensi_detail
-- Tabel detail laporan presensi
CREATE TABLE `laporan_presensi_detail` (
  `id_laporan_presensi` INT NOT NULL AUTO_INCREMENT COMMENT 'ID laporan presensi',
  `id_laporan` INT NOT NULL COMMENT 'ID laporan',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `total_hari_masuk` INT NOT NULL COMMENT 'Total hari masuk',
  `total_sakit` INT NOT NULL COMMENT 'Total sakit',
  `total_izin` INT NOT NULL COMMENT 'Total izin',
  `total_alfa` INT NOT NULL COMMENT 'Total alfa',
  `persentase_sakit` DECIMAL(5,2) NOT NULL COMMENT 'Persentase sakit',
  `persentase_izin` DECIMAL(5,2) NOT NULL COMMENT 'Persentase izin',
  `persentase_alfa` DECIMAL(5,2) NOT NULL COMMENT 'Persentase alfa',
  PRIMARY KEY (`id_laporan_presensi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel detail laporan presensi';

-- Table: laporan_tahfidz_detail
-- Tabel detail laporan tahfidz
CREATE TABLE `laporan_tahfidz_detail` (
  `id_laporan_tahfidz` INT NOT NULL AUTO_INCREMENT COMMENT 'ID laporan tahfidz',
  `id_laporan` INT NOT NULL COMMENT 'ID laporan',
  `nis` VARCHAR(20) NOT NULL COMMENT 'NIS siswa',
  `target_baris` INT NOT NULL COMMENT 'Target baris',
  `capaian_baris` INT NOT NULL COMMENT 'Capaian baris',
  `status_ketuntasan` ENUM('Tuntas','Belum_Tuntas') NOT NULL COMMENT 'Status ketuntasan',
  PRIMARY KEY (`id_laporan_tahfidz`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel detail laporan tahfidz';

-- Table: laporan_statistik
-- Tabel statistik laporan
CREATE TABLE `laporan_statistik` (
  `id_statistik` INT NOT NULL AUTO_INCREMENT COMMENT 'ID statistik',
  `id_laporan` INT NOT NULL COMMENT 'ID laporan',
  `jenis_statistik` ENUM('Tuntas_Tahfidz','Presensi') NOT NULL COMMENT 'Jenis statistik',
  `total_tuntas` INT NOT NULL COMMENT 'Total tuntas',
  `total_belum_tuntas` INT NOT NULL COMMENT 'Total belum tuntas',
  `persentase_tuntas` DECIMAL(5,2) NOT NULL COMMENT 'Persentase tuntas',
  `persentase_belum_tuntas` DECIMAL(5,2) NOT NULL COMMENT 'Persentase belum tuntas',
  PRIMARY KEY (`id_statistik`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel statistik laporan';

-- ============================
-- FOREIGN KEY CONSTRAINTS
-- ============================

-- Core Management Foreign Keys
ALTER TABLE `siswa`
  ADD CONSTRAINT `fk_siswa_kelas` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_siswa_jurusan` FOREIGN KEY (`id_jurusan`) REFERENCES `jurusan` (`id_jurusan`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_siswa_orang_tua` FOREIGN KEY (`id_orang_tua`) REFERENCES `orang_tua` (`id_orang_tua`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Akademik Foreign Keys
ALTER TABLE `kelas`
  ADD CONSTRAINT `fk_kelas_jurusan` FOREIGN KEY (`id_jurusan`) REFERENCES `jurusan` (`id_jurusan`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kelas_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kelas_wali_kelas` FOREIGN KEY (`wali_kelas`) REFERENCES `guru` (`nik_guru`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `kurikulum`
  ADD CONSTRAINT `fk_kurikulum_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kurikulum_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `guru_mata_pelajaran`
  ADD CONSTRAINT `fk_guru_mapel_guru` FOREIGN KEY (`nik_guru`) REFERENCES `guru` (`nik_guru`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_guru_mapel_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `jadwal_pelajaran`
  ADD CONSTRAINT `fk_jadwal_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jadwal_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jadwal_guru` FOREIGN KEY (`nik_guru`) REFERENCES `guru` (`nik_guru`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jadwal_kelas` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Pembelajaran Foreign Keys
ALTER TABLE `jurnal_mengajar`
  ADD CONSTRAINT `fk_jurnal_jadwal` FOREIGN KEY (`id_jadwal`) REFERENCES `jadwal_pelajaran` (`id_jadwal`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jurnal_guru` FOREIGN KEY (`nik_guru`) REFERENCES `guru` (`nik_guru`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `presensi_harian`
  ADD CONSTRAINT `fk_presensi_harian_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `presensi_mapel`
  ADD CONSTRAINT `fk_presensi_mapel_jurnal` FOREIGN KEY (`id_jurnal`) REFERENCES `jurnal_mengajar` (`id_jurnal`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_presensi_mapel_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `nilai`
  ADD CONSTRAINT `fk_nilai_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_guru` FOREIGN KEY (`nik_guru_penginput`) REFERENCES `guru` (`nik_guru`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `tugas`
  ADD CONSTRAINT `fk_tugas_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tugas_guru` FOREIGN KEY (`nik_guru`) REFERENCES `guru` (`nik_guru`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tugas_kelas` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tugas_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `tugas_siswa`
  ADD CONSTRAINT `fk_tugas_siswa_tugas` FOREIGN KEY (`id_tugas`) REFERENCES `tugas` (`id_tugas`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tugas_siswa_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pengumpulan_tugas`
  ADD CONSTRAINT `fk_pengumpulan_tugas` FOREIGN KEY (`id_tugas`) REFERENCES `tugas` (`id_tugas`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengumpulan_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Keagamaan Foreign Keys
ALTER TABLE `tugas_adab`
  ADD CONSTRAINT `fk_tugas_adab_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `monitoring_adab`
  ADD CONSTRAINT `fk_monitoring_adab_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_monitoring_adab_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_monitoring_adab_tugas` FOREIGN KEY (`id_tugas_adab`) REFERENCES `tugas_adab` (`id_tugas_adab`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `monitoring_sholat`
  ADD CONSTRAINT `fk_monitoring_sholat_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_monitoring_sholat_guru` FOREIGN KEY (`nik_guru_input`) REFERENCES `guru` (`nik_guru`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `target_hafalan_siswa`
  ADD CONSTRAINT `fk_target_hafalan_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_target_hafalan_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `hafalan`
  ADD CONSTRAINT `fk_hafalan_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_hafalan_guru` FOREIGN KEY (`nik_guru_penguji`) REFERENCES `guru` (`nik_guru`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `evaluasi_hafalan`
  ADD CONSTRAINT `fk_evaluasi_hafalan_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_evaluasi_hafalan_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Kedisiplinan Foreign Keys
ALTER TABLE `pelanggaran`
  ADD CONSTRAINT `fk_pelanggaran_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pelanggaran_guru` FOREIGN KEY (`nik_guru_input`) REFERENCES `guru` (`nik_guru`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keuangan Foreign Keys
ALTER TABLE `tagihan`
  ADD CONSTRAINT `fk_tagihan_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tagihan_jenis_pembayaran` FOREIGN KEY (`id_jenis_pembayaran`) REFERENCES `jenis_pembayaran` (`id_jenis_pembayaran`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tagihan_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `pembayaran`
  ADD CONSTRAINT `fk_pembayaran_tagihan` FOREIGN KEY (`id_tagihan`) REFERENCES `tagihan` (`id_tagihan`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pembayaran_user` FOREIGN KEY (`id_user_petugas`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Komunikasi Foreign Keys
ALTER TABLE `pengumuman`
  ADD CONSTRAINT `fk_pengumuman_user` FOREIGN KEY (`id_user_pembuat`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pengumuman_target`
  ADD CONSTRAINT `fk_pengumuman_target_pengumuman` FOREIGN KEY (`id_pengumuman`) REFERENCES `pengumuman` (`id_pengumuman`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Rapot Foreign Keys
ALTER TABLE `rapot`
  ADD CONSTRAINT `fk_rapot_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rapot_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rapot_nilai`
  ADD CONSTRAINT `fk_rapot_nilai_rapot` FOREIGN KEY (`id_rapot`) REFERENCES `rapot` (`id_rapot`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rapot_nilai_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rapot_ekstrakurikuler`
  ADD CONSTRAINT `fk_rapot_ekskul_rapot` FOREIGN KEY (`id_rapot`) REFERENCES `rapot` (`id_rapot`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rapot_kehadiran`
  ADD CONSTRAINT `fk_rapot_kehadiran_rapot` FOREIGN KEY (`id_rapot`) REFERENCES `rapot` (`id_rapot`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rapot_catatan`
  ADD CONSTRAINT `fk_rapot_catatan_rapot` FOREIGN KEY (`id_rapot`) REFERENCES `rapot` (`id_rapot`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rapot_att`
  ADD CONSTRAINT `fk_rapot_att_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rapot_att_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rapot_tahfidz_detail`
  ADD CONSTRAINT `fk_rapot_tahfidz_att` FOREIGN KEY (`id_rapot_att`) REFERENCES `rapot_att` (`id_rapot_att`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rapot_adab_detail`
  ADD CONSTRAINT `fk_rapot_adab_att` FOREIGN KEY (`id_rapot_att`) REFERENCES `rapot_att` (`id_rapot_att`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `rapot_tanse_detail`
  ADD CONSTRAINT `fk_rapot_tanse_att` FOREIGN KEY (`id_rapot_att`) REFERENCES `rapot_att` (`id_rapot_att`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Laporan Foreign Keys
ALTER TABLE `laporan`
  ADD CONSTRAINT `fk_laporan_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_laporan_user` FOREIGN KEY (`id_user_generate`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `laporan_presensi_detail`
  ADD CONSTRAINT `fk_laporan_presensi_laporan` FOREIGN KEY (`id_laporan`) REFERENCES `laporan` (`id_laporan`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_laporan_presensi_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `laporan_tahfidz_detail`
  ADD CONSTRAINT `fk_laporan_tahfidz_laporan` FOREIGN KEY (`id_laporan`) REFERENCES `laporan` (`id_laporan`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_laporan_tahfidz_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `laporan_statistik`
  ADD CONSTRAINT `fk_laporan_statistik_laporan` FOREIGN KEY (`id_laporan`) REFERENCES `laporan` (`id_laporan`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================

-- Core Management Indexes
CREATE INDEX `idx_users_user_type` ON `users` (`user_type`);
CREATE INDEX `idx_users_status` ON `users` (`status`);
CREATE INDEX `idx_users_reference_id` ON `users` (`reference_id`);

CREATE INDEX `idx_siswa_nama` ON `siswa` (`nama_lengkap`);
CREATE INDEX `idx_siswa_kelas` ON `siswa` (`id_kelas`);
CREATE INDEX `idx_siswa_jurusan` ON `siswa` (`id_jurusan`);
CREATE INDEX `idx_siswa_status` ON `siswa` (`status`);

CREATE INDEX `idx_guru_nama` ON `guru` (`nama_lengkap`);
CREATE INDEX `idx_guru_status` ON `guru` (`status`);

-- Akademik Indexes
CREATE INDEX `idx_tahun_ajaran_status` ON `tahun_ajaran` (`status`);
CREATE INDEX `idx_tahun_ajaran_periode` ON `tahun_ajaran` (`tahun_ajaran`, `semester`);

CREATE INDEX `idx_kelas_tingkat` ON `kelas` (`tingkat`);
CREATE INDEX `idx_kelas_tahun_ajaran` ON `kelas` (`id_tahun_ajaran`);

CREATE INDEX `idx_jadwal_hari_jam` ON `jadwal_pelajaran` (`hari`, `jam_ke`);
CREATE INDEX `idx_jadwal_guru` ON `jadwal_pelajaran` (`nik_guru`);
CREATE INDEX `idx_jadwal_kelas` ON `jadwal_pelajaran` (`id_kelas`);

-- Pembelajaran Indexes
CREATE INDEX `idx_jurnal_tanggal` ON `jurnal_mengajar` (`tanggal`);
CREATE INDEX `idx_jurnal_guru` ON `jurnal_mengajar` (`nik_guru`);

CREATE INDEX `idx_presensi_harian_tanggal` ON `presensi_harian` (`tanggal`);
CREATE INDEX `idx_presensi_harian_nis` ON `presensi_harian` (`nis`);
CREATE INDEX `idx_presensi_harian_status` ON `presensi_harian` (`status`);

CREATE INDEX `idx_nilai_nis_mapel` ON `nilai` (`nis`, `id_mata_pelajaran`);
CREATE INDEX `idx_nilai_tahun_ajaran` ON `nilai` (`id_tahun_ajaran`);
CREATE INDEX `idx_nilai_jenis` ON `nilai` (`jenis_penilaian`);
CREATE INDEX `idx_nilai_tanggal` ON `nilai` (`tanggal_input`);

CREATE INDEX `idx_tugas_deadline` ON `tugas` (`tanggal_deadline`);
CREATE INDEX `idx_tugas_kelas` ON `tugas` (`id_kelas`);
CREATE INDEX `idx_tugas_guru` ON `tugas` (`nik_guru`);

-- Keagamaan Indexes
CREATE INDEX `idx_monitoring_adab_tanggal` ON `monitoring_adab` (`tanggal`);
CREATE INDEX `idx_monitoring_adab_nis` ON `monitoring_adab` (`nis`);

CREATE INDEX `idx_monitoring_sholat_tanggal` ON `monitoring_sholat` (`tanggal`);
CREATE INDEX `idx_monitoring_sholat_nis` ON `monitoring_sholat` (`nis`);
CREATE INDEX `idx_monitoring_sholat_jenis` ON `monitoring_sholat` (`jenis_sholat`);

CREATE INDEX `idx_hafalan_tanggal` ON `hafalan` (`tanggal_setoran`);
CREATE INDEX `idx_hafalan_nis` ON `hafalan` (`nis`);
CREATE INDEX `idx_hafalan_status` ON `hafalan` (`status_hafalan`);

-- Kedisiplinan Indexes
CREATE INDEX `idx_pelanggaran_tanggal` ON `pelanggaran` (`tanggal_pelanggaran`);
CREATE INDEX `idx_pelanggaran_nis` ON `pelanggaran` (`nis`);
CREATE INDEX `idx_pelanggaran_jenis` ON `pelanggaran` (`jenis_pelanggaran`);
CREATE INDEX `idx_pelanggaran_status` ON `pelanggaran` (`status`);

-- Keuangan Indexes
CREATE INDEX `idx_tagihan_nis` ON `tagihan` (`nis`);
CREATE INDEX `idx_tagihan_status` ON `tagihan` (`status_tagihan`);
CREATE INDEX `idx_tagihan_jatuh_tempo` ON `tagihan` (`tanggal_jatuh_tempo`);
CREATE INDEX `idx_tagihan_bulan` ON `tagihan` (`bulan_tagihan`);

CREATE INDEX `idx_pembayaran_tanggal` ON `pembayaran` (`tanggal_bayar`);
CREATE INDEX `idx_pembayaran_status` ON `pembayaran` (`status_pembayaran`);
CREATE INDEX `idx_pembayaran_metode` ON `pembayaran` (`metode_pembayaran`);

-- Komunikasi Indexes
CREATE INDEX `idx_pengumuman_tanggal` ON `pengumuman` (`tanggal_posting`);
CREATE INDEX `idx_pengumuman_status` ON `pengumuman` (`status`);
CREATE INDEX `idx_pengumuman_target_type` ON `pengumuman` (`target_type`);

-- Rapot Indexes
CREATE INDEX `idx_rapot_nis_tahun` ON `rapot` (`nis`, `id_tahun_ajaran`);
CREATE INDEX `idx_rapot_semester` ON `rapot` (`semester`);
CREATE INDEX `idx_rapot_status` ON `rapot` (`status_rapot`);

CREATE INDEX `idx_rapot_att_nis_tahun` ON `rapot_att` (`nis`, `id_tahun_ajaran`);
CREATE INDEX `idx_rapot_att_semester` ON `rapot_att` (`semester`);

-- Laporan Indexes
CREATE INDEX `idx_laporan_jenis` ON `laporan` (`jenis_laporan`);
CREATE INDEX `idx_laporan_periode` ON `laporan` (`periode_laporan`);
CREATE INDEX `idx_laporan_tanggal` ON `laporan` (`tanggal_generate`);
CREATE INDEX `idx_laporan_bulan` ON `laporan` (`bulan_laporan`);

-- ============================
-- INSERT MASTER DATA
-- ============================

-- Insert Tahun Ajaran Aktif
INSERT INTO `tahun_ajaran` (`tahun_ajaran`, `semester`, `tanggal_mulai`, `tanggal_selesai`, `status`) VALUES
('2024/2025', 'Ganjil', '2024-07-15', '2024-12-20', 'Aktif'),
('2024/2025', 'Genap', '2025-01-06', '2025-06-15', 'Non-aktif');

-- Insert Jurusan
INSERT INTO `jurusan` (`nama_jurusan`, `status`) VALUES
('Tahfizh', 'Aktif'),
('Digital', 'Aktif'),
('Billingual', 'Aktif'),
('Reguler', 'Aktif'),
('IPA', 'Aktif'),
('IPS', 'Aktif');

-- Insert Mata Pelajaran Dasar
INSERT INTO `mata_pelajaran` (`nama_mata_pelajaran`, `kode_mata_pelajaran`, `kategori`, `status`) VALUES
-- Mata Pelajaran Wajib
('Pendidikan Agama Islam', 'PAI', 'Wajib', 'Aktif'),
('Pendidikan Pancasila', 'PP', 'Wajib', 'Aktif'),
('Bahasa Indonesia', 'BIND', 'Wajib', 'Aktif'),
('Matematika', 'MTK', 'Wajib', 'Aktif'),
('Sejarah Indonesia', 'SEJIND', 'Wajib', 'Aktif'),
('Bahasa Inggris', 'BING', 'Wajib', 'Aktif'),

-- Mata Pelajaran Umum
('Seni Budaya', 'SB', 'Umum', 'Aktif'),
('Pendidikan Jasmani, Olahraga dan Kesehatan', 'PJOK', 'Umum', 'Aktif'),
('Prakarya dan Kewirausahaan', 'PKWU', 'Umum', 'Aktif'),

-- Mata Pelajaran Peminatan IPA
('Matematika Peminatan', 'MTKP', 'Peminatan', 'Aktif'),
('Fisika', 'FIS', 'Peminatan', 'Aktif'),
('Kimia', 'KIM', 'Peminatan', 'Aktif'),
('Biologi', 'BIO', 'Peminatan', 'Aktif'),

-- Mata Pelajaran Peminatan IPS
('Geografi', 'GEO', 'Peminatan', 'Aktif'),
('Sejarah Peminatan', 'SEJP', 'Peminatan', 'Aktif'),
('Sosiologi', 'SOS', 'Peminatan', 'Aktif'),
('Ekonomi', 'EKO', 'Peminatan', 'Aktif'),

-- Mata Pelajaran Agama
('Al-Quran Hadits', 'QH', 'Agama', 'Aktif'),
('Akidah Akhlak', 'AA', 'Agama', 'Aktif'),
('Fiqih', 'FIQ', 'Agama', 'Aktif'),
('Sejarah Kebudayaan Islam', 'SKI', 'Agama', 'Aktif'),
('Tahfidz Al-Quran', 'TAHFIDZ', 'Agama', 'Aktif'),

-- Mata Pelajaran Muatan Lokal
('Bahasa Arab', 'BARAB', 'Mulok', 'Aktif'),
('Bahasa Jawa', 'BJAWA', 'Mulok', 'Aktif'),
('Teknologi Informasi dan Komunikasi', 'TIK', 'Mulok', 'Aktif');

-- Insert Jenis Pembayaran
INSERT INTO `jenis_pembayaran` (`nama_pembayaran`, `nominal`, `periode`, `status`) VALUES
('SPP Bulanan', 500000.00, 'Bulanan', 'Aktif'),
('Uang Pangkal', 5000000.00, 'Sekali', 'Aktif'),
('Seragam Sekolah', 750000.00, 'Tahunan', 'Aktif'),
('Buku Pelajaran', 1200000.00, 'Tahunan', 'Aktif'),
('Kegiatan Ekstrakurikuler', 300000.00, 'Semesteran', 'Aktif'),
('Ujian Semester', 200000.00, 'Semesteran', 'Aktif'),
('Ujian Nasional', 500000.00, 'Tahunan', 'Aktif'),
('Wisuda/Graduation', 1000000.00, 'Sekali', 'Aktif');

-- Insert Tugas Adab Default
INSERT INTO `tugas_adab` (`nama_tugas`, `deskripsi_tugas`, `id_tahun_ajaran`, `status`) VALUES
('Sholat Dhuha', 'Melaksanakan sholat dhuha sebelum jam pelajaran dimulai', 1, 'Aktif'),
('Sholat Dhuhur Berjamaah', 'Melaksanakan sholat dhuhur berjamaah di masjid sekolah', 1, 'Aktif'),
('Sholat Asar Berjamaah', 'Melaksanakan sholat asar berjamaah di masjid sekolah', 1, 'Aktif'),
('Membaca Al-Quran Pagi', 'Membaca Al-Quran selama 15 menit sebelum pelajaran dimulai', 1, 'Aktif'),
('Dzikir Pagi', 'Melaksanakan dzikir pagi bersama-sama', 1, 'Aktif'),
('Infaq Jumat', 'Memberikan infaq setiap hari Jumat', 1, 'Aktif'),
('Kebersihan Kelas', 'Menjaga kebersihan kelas dan lingkungan sekolah', 1, 'Aktif'),
('Hormat kepada Guru', 'Menunjukkan sikap hormat dan sopan kepada guru', 1, 'Aktif');

-- Insert Admin Default
INSERT INTO `admin` (`nama_admin`, `jabatan`, `status`) VALUES
('Administrator Sistem', 'Super Admin', 'Aktif'),
('Staff Tata Usaha', 'Admin TU', 'Aktif');

-- Insert Kepala Sekolah Default
INSERT INTO `kepala_sekolah` (`nama`, `nip`, `status`) VALUES
('Dr. H. Ahmad Fauzi, M.Pd.I', '196801011990031001', 'Aktif');

-- Insert Petugas Keuangan Default
INSERT INTO `petugas_keuangan` (`nama`, `nip`, `status`) VALUES
('Siti Nurhalimah, S.E', '197505152005012001', 'Aktif'),
('Ahmad Budiman, S.Pd', '198203102010011002', 'Aktif');

-- Insert Users Default
INSERT INTO `users` (`user_id`, `username`, `password`, `user_type`, `status`, `reference_id`) VALUES
('USR001', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Aktif', '1'),
('USR002', 'kepsek', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kepala_Sekolah', 'Aktif', '1'),
('USR003', 'keuangan', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Petugas_Keuangan', 'Aktif', '1');

-- Commit Transaction
COMMIT;

-- ============================
-- SCHEMA CREATION COMPLETED
-- ============================
-- Database: sma_al_azhar_7_sukoharjo
-- Total Tables: 47
-- Total Foreign Keys: 65+
-- Total Indexes: 50+
-- 
-- Default Login Credentials:
-- Admin: username=admin, password=password
-- Kepala Sekolah: username=kepsek, password=password  
-- Petugas Keuangan: username=keuangan, password=password
--
-- Note: Please change default passwords after first login
-- ============================