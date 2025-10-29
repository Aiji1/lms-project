-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Waktu pembuatan: 21 Okt 2025 pada 03.17
-- Versi server: 10.4.28-MariaDB
-- Versi PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lms`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `admin`
--

CREATE TABLE `admin` (
  `id_admin` int(11) NOT NULL COMMENT 'ID admin',
  `nama_admin` varchar(100) NOT NULL COMMENT 'Nama admin',
  `jabatan` varchar(100) DEFAULT NULL COMMENT 'Jabatan admin',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data admin';

--
-- Dumping data untuk tabel `admin`
--

INSERT INTO `admin` (`id_admin`, `nama_admin`, `jabatan`, `status`) VALUES
(1, 'Administrator Sistem', 'Super Admin', 'Aktif'),
(2, 'Staff Tata Usaha', 'Admin TU', 'Aktif');

-- --------------------------------------------------------

--
-- Struktur dari tabel `evaluasi_hafalan`
--

CREATE TABLE `evaluasi_hafalan` (
  `id_evaluasi` int(11) NOT NULL COMMENT 'ID evaluasi',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `periode_evaluasi` enum('Bulanan','3_Bulanan','Semesteran') NOT NULL COMMENT 'Periode evaluasi',
  `bulan_periode` varchar(20) DEFAULT NULL COMMENT 'Bulan periode',
  `total_baris_target` int(11) NOT NULL COMMENT 'Total baris target',
  `target_surah_mulai` varchar(50) DEFAULT NULL COMMENT 'Target surah mulai',
  `target_ayat_mulai` int(11) DEFAULT NULL COMMENT 'Target ayat mulai',
  `target_surah_selesai` varchar(50) DEFAULT NULL COMMENT 'Target surah selesai',
  `target_ayat_selesai` int(11) DEFAULT NULL COMMENT 'Target ayat selesai',
  `total_baris_tercapai` int(11) NOT NULL COMMENT 'Total baris tercapai',
  `tercapai_surah_mulai` varchar(50) DEFAULT NULL COMMENT 'Tercapai surah mulai',
  `tercapai_ayat_mulai` int(11) DEFAULT NULL COMMENT 'Tercapai ayat mulai',
  `tercapai_surah_selesai` varchar(50) DEFAULT NULL COMMENT 'Tercapai surah selesai',
  `tercapai_ayat_selesai` int(11) DEFAULT NULL COMMENT 'Tercapai ayat selesai',
  `status_ketuntasan` enum('Tuntas','Belum_Tuntas') NOT NULL COMMENT 'Status ketuntasan',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel evaluasi hafalan siswa';

-- --------------------------------------------------------

--
-- Struktur dari tabel `guru`
--

CREATE TABLE `guru` (
  `nik_guru` varchar(20) NOT NULL COMMENT 'NIK guru',
  `nama_lengkap` varchar(100) NOT NULL COMMENT 'Nama lengkap guru',
  `tanggal_lahir` date NOT NULL COMMENT 'Tanggal lahir guru',
  `jenis_kelamin` enum('L','P') NOT NULL COMMENT 'Jenis kelamin',
  `alamat` text DEFAULT NULL COMMENT 'Alamat guru',
  `no_telepon` varchar(15) DEFAULT NULL COMMENT 'Nomor telepon',
  `status_kepegawaian` enum('Pengganti','Honorer','Capeg','PTY','PTYK') NOT NULL COMMENT 'Status kepegawaian',
  `jabatan` enum('Guru','Guru_dan_Wali_Kelas') NOT NULL COMMENT 'Jabatan guru',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data guru';

--
-- Dumping data untuk tabel `guru`
--

INSERT INTO `guru` (`nik_guru`, `nama_lengkap`, `tanggal_lahir`, `jenis_kelamin`, `alamat`, `no_telepon`, `status_kepegawaian`, `jabatan`, `status`) VALUES
('06.0412', 'Aione', '1994-05-01', 'L', NULL, '08970344492', 'PTY', 'Guru_dan_Wali_Kelas', 'Aktif'),
('07279', 'Aimi', '1996-12-22', 'P', NULL, '087762074887', 'PTYK', 'Guru', 'Aktif'),
('111', 'A', '2004-02-13', 'L', NULL, NULL, 'PTY', 'Guru', 'Aktif'),
('87678', 'A', '2000-01-01', 'L', NULL, NULL, 'PTY', 'Guru', 'Aktif'),
('93838', 'Dr. Ahmad Fauzi, M.Pd', '1980-05-15', 'L', 'Jl. Contoh No. 123, Sukoharjo', '081234567890', 'PTY', 'Guru', 'Aktif'),
('NIK0001', 'Guru Satu', '1985-01-01', 'L', 'Jl. Contoh No. 1', '08123456789', 'PTY', 'Guru', 'Aktif');

-- --------------------------------------------------------

--
-- Struktur dari tabel `guru_mata_pelajaran`
--

CREATE TABLE `guru_mata_pelajaran` (
  `id_guru_mapel` int(11) NOT NULL COMMENT 'ID guru mata pelajaran',
  `nik_guru` varchar(20) NOT NULL COMMENT 'NIK guru',
  `id_mata_pelajaran` int(11) NOT NULL COMMENT 'ID mata pelajaran'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel relasi guru dan mata pelajaran';

--
-- Dumping data untuk tabel `guru_mata_pelajaran`
--

INSERT INTO `guru_mata_pelajaran` (`id_guru_mapel`, `nik_guru`, `id_mata_pelajaran`) VALUES
(2, '06.0412', 22),
(3, '07279', 6),
(5, '93838', 4),
(6, '93838', 11),
(7, '87678', 26);

-- --------------------------------------------------------

--
-- Struktur dari tabel `hafalan`
--

CREATE TABLE `hafalan` (
  `id_hafalan` int(11) NOT NULL COMMENT 'ID hafalan',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `nama_surah` varchar(50) NOT NULL COMMENT 'Nama surah',
  `ayat_mulai` int(11) NOT NULL COMMENT 'Ayat mulai',
  `ayat_selesai` int(11) NOT NULL COMMENT 'Ayat selesai',
  `jumlah_baris` int(11) NOT NULL COMMENT 'Jumlah baris',
  `tanggal_setoran` date NOT NULL COMMENT 'Tanggal setoran',
  `status_hafalan` enum('Lancar','Kurang_Lancar','Belum_Lancar') NOT NULL COMMENT 'Status hafalan',
  `nik_guru_penguji` varchar(20) NOT NULL COMMENT 'NIK guru penguji'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel hafalan siswa';

-- --------------------------------------------------------

--
-- Struktur dari tabel `jadwal_pelajaran`
--

CREATE TABLE `jadwal_pelajaran` (
  `id_jadwal` int(11) NOT NULL COMMENT 'ID jadwal',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `id_mata_pelajaran` int(11) NOT NULL COMMENT 'ID mata pelajaran',
  `nik_guru` varchar(20) NOT NULL COMMENT 'NIK guru',
  `id_kelas` int(11) NOT NULL COMMENT 'ID kelas',
  `hari` enum('Senin','Selasa','Rabu','Kamis','Jumat') NOT NULL COMMENT 'Hari',
  `jam_ke` enum('1','2','3','4','5','6','7','8','9','10') NOT NULL COMMENT 'Jam ke'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel jadwal pelajaran';

--
-- Dumping data untuk tabel `jadwal_pelajaran`
--

INSERT INTO `jadwal_pelajaran` (`id_jadwal`, `id_tahun_ajaran`, `id_mata_pelajaran`, `nik_guru`, `id_kelas`, `hari`, `jam_ke`) VALUES
(1, 3, 22, '06.0412', 1, 'Selasa', '2'),
(3, 3, 6, '07279', 4, 'Selasa', '5'),
(4, 3, 26, '87678', 8, 'Selasa', '4'),
(5, 3, 22, '06.0412', 7, 'Kamis', '7');

-- --------------------------------------------------------

--
-- Struktur dari tabel `jenis_pembayaran`
--

CREATE TABLE `jenis_pembayaran` (
  `id_jenis_pembayaran` int(11) NOT NULL COMMENT 'ID jenis pembayaran',
  `nama_pembayaran` varchar(100) NOT NULL COMMENT 'Nama pembayaran (SPP, Buku, Seragam, dll)',
  `nominal` decimal(10,2) NOT NULL COMMENT 'Nominal pembayaran',
  `periode` enum('Bulanan','Semesteran','Tahunan','Sekali') NOT NULL COMMENT 'Periode pembayaran',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel jenis pembayaran';

--
-- Dumping data untuk tabel `jenis_pembayaran`
--

INSERT INTO `jenis_pembayaran` (`id_jenis_pembayaran`, `nama_pembayaran`, `nominal`, `periode`, `status`) VALUES
(1, 'SPP Bulanan', 500000.00, 'Bulanan', 'Aktif'),
(2, 'Uang Pangkal', 5000000.00, 'Sekali', 'Aktif'),
(3, 'Seragam Sekolah', 750000.00, 'Tahunan', 'Aktif'),
(4, 'Buku Pelajaran', 1200000.00, 'Tahunan', 'Aktif'),
(5, 'Kegiatan Ekstrakurikuler', 300000.00, 'Semesteran', 'Aktif'),
(6, 'Ujian Semester', 200000.00, 'Semesteran', 'Aktif'),
(7, 'Ujian Nasional', 500000.00, 'Tahunan', 'Aktif'),
(8, 'Wisuda/Graduation', 1000000.00, 'Sekali', 'Aktif');

-- --------------------------------------------------------

--
-- Struktur dari tabel `jurnal_mengajar`
--

CREATE TABLE `jurnal_mengajar` (
  `id_jurnal` int(11) NOT NULL COMMENT 'ID jurnal',
  `id_jadwal` int(11) NOT NULL COMMENT 'ID jadwal',
  `tanggal` date NOT NULL COMMENT 'Tanggal mengajar',
  `nik_guru` varchar(20) NOT NULL COMMENT 'NIK guru',
  `status_mengajar` enum('Hadir','Tidak_Hadir','Diganti') NOT NULL COMMENT 'Status mengajar',
  `materi_diajarkan` text NOT NULL COMMENT 'Materi yang diajarkan',
  `keterangan` text DEFAULT NULL COMMENT 'Keterangan tambahan',
  `keterangan_tambahan` text DEFAULT NULL COMMENT 'Keterangan tambahan untuk mencatat murid yang tidak hadir atau keterangan lainnya',
  `jam_input` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Waktu input'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel jurnal mengajar guru';

--
-- Dumping data untuk tabel `jurnal_mengajar`
--

INSERT INTO `jurnal_mengajar` (`id_jurnal`, `id_jadwal`, `tanggal`, `nik_guru`, `status_mengajar`, `materi_diajarkan`, `keterangan`, `keterangan_tambahan`, `jam_input`) VALUES
(2, 3, '2025-09-28', '07279', 'Hadir', 'kjgbhjglhj', 'xfgxcghc', NULL, '2025-09-28 10:01:49'),
(3, 3, '2025-09-29', '07279', 'Hadir', 'Alhamdulillah berhasil', NULL, NULL, '2025-09-29 09:45:32'),
(4, 1, '2025-09-29', '06.0412', 'Hadir', 'Alhamdulillah sudah bisa', NULL, NULL, '2025-09-29 09:46:13'),
(5, 1, '2025-10-01', '06.0412', 'Hadir', 'opjijikhjkg', NULL, NULL, '2025-09-30 18:57:42'),
(6, 1, '2025-10-12', '06.0412', 'Hadir', 'iugkugbkjhvm,', NULL, NULL, '2025-10-12 03:35:45');

-- --------------------------------------------------------

--
-- Struktur dari tabel `jurusan`
--

CREATE TABLE `jurusan` (
  `id_jurusan` int(11) NOT NULL COMMENT 'ID jurusan',
  `nama_jurusan` varchar(100) NOT NULL COMMENT 'Nama jurusan',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel jurusan';

--
-- Dumping data untuk tabel `jurusan`
--

INSERT INTO `jurusan` (`id_jurusan`, `nama_jurusan`, `status`) VALUES
(1, 'Tahfizh', 'Aktif'),
(2, 'Digital', 'Aktif'),
(3, 'Billingual', 'Aktif'),
(4, 'Reguler', 'Aktif'),
(5, 'IPA', 'Non-aktif'),
(6, 'IPS', 'Non-aktif'),
(7, 'Bahasa', 'Aktif');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kelas`
--

CREATE TABLE `kelas` (
  `id_kelas` int(11) NOT NULL COMMENT 'ID kelas',
  `ruangan` enum('1','2','3','4','5','6','7','8','9','10','11','12') NOT NULL COMMENT 'Nomor ruangan',
  `nama_kelas` varchar(20) NOT NULL COMMENT 'Nama kelas (contoh: XE1, XI.F1)',
  `tingkat` enum('10','11','12') NOT NULL COMMENT 'Tingkat kelas',
  `id_jurusan` int(11) NOT NULL COMMENT 'ID jurusan',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `kapasitas_maksimal` int(11) NOT NULL COMMENT 'Kapasitas maksimal siswa',
  `wali_kelas` varchar(20) DEFAULT NULL COMMENT 'NIK guru wali kelas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel kelas';

--
-- Dumping data untuk tabel `kelas`
--

INSERT INTO `kelas` (`id_kelas`, `ruangan`, `nama_kelas`, `tingkat`, `id_jurusan`, `id_tahun_ajaran`, `kapasitas_maksimal`, `wali_kelas`) VALUES
(1, '1', 'X E1', '10', 1, 3, 32, '06.0412'),
(4, '2', 'X E2', '10', 2, 3, 32, NULL),
(5, '3', 'X E3', '10', 2, 3, 32, NULL),
(6, '4', 'X E4', '10', 3, 3, 32, NULL),
(7, '5', 'XI F1', '11', 1, 3, 32, NULL),
(8, '6', 'XI F2', '11', 2, 3, 32, NULL),
(9, '7', 'XI F3', '11', 4, 3, 32, NULL),
(10, '8', 'XI F4', '11', 4, 3, 32, NULL),
(11, '9', 'XII F1', '12', 1, 3, 32, NULL),
(12, '10', 'XII F2', '12', 4, 3, 32, NULL),
(13, '11', 'XII F3', '12', 4, 3, 32, NULL),
(14, '12', 'XII F4', '12', 4, 3, 32, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `kelas_siswa`
--

CREATE TABLE `kelas_siswa` (
  `id_kelas_siswa` bigint(20) UNSIGNED NOT NULL COMMENT 'ID kelas siswa',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `id_kelas` int(11) NOT NULL COMMENT 'ID kelas',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `status` enum('Aktif','Non-aktif') NOT NULL DEFAULT 'Aktif' COMMENT 'Status aktif',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `kelas_siswa`
--

INSERT INTO `kelas_siswa` (`id_kelas_siswa`, `nis`, `id_kelas`, `id_tahun_ajaran`, `status`, `created_at`, `updated_at`) VALUES
(1, '4407-2526001', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(2, '4407-2526002', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(3, '4407-2526003', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(4, '4407-2526004', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(5, '4407-2526005', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(6, '4407-2526006', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(7, '4407-2526007', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(8, '4407-2526008', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(9, '4407-2526009', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(10, '4407-2526011', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(11, '4407-2526012', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(12, '4407-2526013', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(13, '4407-2526014', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(14, '4407-2526015', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(15, '4407-2526016', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(16, '4407-2526017', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(17, '4407-2526018', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(18, '4407-2526019', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(19, '4407-2526020', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(20, '4407-2526021', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(21, '4407-2526090', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(22, '4407-2526091', 1, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(23, '4407-2526022', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(24, '4407-2526023', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(25, '4407-2526024', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(26, '4407-2526025', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(27, '4407-2526026', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(28, '4407-2526027', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(29, '4407-2526028', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(30, '4407-2526029', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(31, '4407-2526030', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(32, '4407-2526031', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(33, '4407-2526032', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(34, '4407-2526033', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(35, '4407-2526034', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(36, '4407-2526035', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(37, '4407-2526036', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(38, '4407-2526037', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(39, '4407-2526038', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(40, '4407-2526039', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(41, '4407-2526040', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(42, '4407-2526041', 4, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(43, '4407-2526042', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(44, '4407-2526043', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(45, '4407-2526044', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(46, '4407-2526045', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(47, '4407-2526046', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(48, '4407-2526047', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(49, '4407-2526048', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(50, '4407-2526049', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(51, '4407-2526050', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(52, '4407-2526051', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(53, '4407-2526052', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(54, '4407-2526053', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(55, '4407-2526054', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(56, '4407-2526055', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(57, '4407-2526056', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(58, '4407-2526057', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(59, '4407-2526058', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(60, '4407-2526059', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(61, '4407-2526060', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(62, '4407-2526061', 5, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(63, '4407-2526062', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(64, '4407-2526063', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(65, '4407-2526064', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(66, '4407-2526065', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(67, '4407-2526066', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(68, '4407-2526067', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(69, '4407-2526068', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(70, '4407-2526069', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(71, '4407-2526070', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(72, '4407-2526071', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(73, '4407-2526072', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(74, '4407-2526073', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(75, '4407-2526074', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(76, '4407-2526075', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(77, '4407-2526076', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(78, '4407-2526077', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(79, '4407-2526078', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(80, '4407-2526079', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(81, '4407-2526080', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(82, '4407-2526081', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(83, '4407-2526082', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(84, '4407-2526083', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(85, '4407-2526084', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(86, '4407-2526085', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(87, '4407-2526086', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(88, '4407-2526087', 6, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(89, '4407-2425001', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(90, '4407-2425002', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(91, '4407-2425003', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(92, '4407-2425004', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(93, '4407-2425005', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(94, '4407-2425006', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(95, '4407-2425007', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(96, '4407-2425008', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(97, '4407-2425009', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(98, '4407-2425010', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(99, '4407-2425011', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(100, '4407-2425012', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(101, '4407-2425013', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(102, '4407-2425014', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(103, '4407-2425015', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(104, '4407-2425016', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(105, '4407-2425017', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(106, '4407-2425018', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(107, '4407-2425019', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(108, '4407-2425020', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(109, '4407-2425021', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(110, '4407-2526088', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(111, '4407-2526089', 7, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(112, '4407-2425022', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(113, '4407-2425023', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(114, '4407-2425024', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(115, '4407-2425025', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(116, '4407-2425026', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(117, '4407-2425027', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(118, '4407-2425028', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(119, '4407-2425029', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(120, '4407-2425030', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(121, '4407-2425031', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(122, '4407-2425032', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(123, '4407-2425033', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(124, '4407-2425034', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(125, '4407-2425035', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(126, '4407-2425036', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(127, '4407-2425037', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(128, '4407-2425038', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(129, '4407-2425039', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(130, '4407-2425040', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(131, '4407-2425041', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(132, '4407-2425042', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(133, '4407-2425043', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(134, '4407-2425044', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(135, '4407-2425045', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(136, '4407-2425046', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(137, '4407-2425047', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(138, '4407-2425048', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(139, '4407-2425049', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(140, '4407-2425050', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(141, '4407-2425051', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(142, '4407-2425052', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(143, '4407-2425053', 8, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(144, '4407-2425055', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(145, '4407-2425058', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(146, '4407-2425059', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(147, '4407-2425064', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(148, '4407-2425065', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(149, '4407-2425066', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(150, '4407-2425068', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(151, '4407-2425071', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(152, '4407-2425072', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(153, '4407-2425073', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(154, '4407-2425074', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(155, '4407-2425076', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(156, '4407-2425078', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(157, '4407-2425081', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(158, '4407-2425083', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(159, '4407-2425086', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(160, '4407-2425087', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(161, '4407-2425089', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(162, '4407-2425090', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(163, '4407-2425091', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(164, '4407-2425092', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(165, '4407-2425098', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(166, '4407-2425100', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(167, '4407-2526092', 9, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(168, '4407-2425054', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(169, '4407-2425056', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(170, '4407-2425057', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(171, '4407-2425060', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(172, '4407-2425061', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(173, '4407-2425062', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(174, '4407-2425063', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(175, '4407-2425067', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(176, '4407-2425069', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(177, '4407-2425070', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(178, '4407-2425075', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(179, '4407-2425077', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(180, '4407-2425079', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(181, '4407-2425080', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(182, '4407-2425082', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(183, '4407-2425084', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(184, '4407-2425085', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(185, '4407-2425088', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(186, '4407-2425093', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(187, '4407-2425096', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34'),
(188, '4407-2425097', 10, 3, 'Aktif', '2025-10-01 20:03:34', '2025-10-01 20:03:34');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kepala_sekolah`
--

CREATE TABLE `kepala_sekolah` (
  `id_kepala_sekolah` int(11) NOT NULL COMMENT 'ID kepala sekolah',
  `nama` varchar(100) NOT NULL COMMENT 'Nama kepala sekolah',
  `nip` varchar(20) DEFAULT NULL COMMENT 'NIP kepala sekolah',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data kepala sekolah';

--
-- Dumping data untuk tabel `kepala_sekolah`
--

INSERT INTO `kepala_sekolah` (`id_kepala_sekolah`, `nama`, `nip`, `status`) VALUES
(1, 'Dr. H. Ahmad Fauzi, M.Pd.I', '196801011990031001', 'Aktif');

-- --------------------------------------------------------

--
-- Struktur dari tabel `kurikulum`
--

CREATE TABLE `kurikulum` (
  `id_kurikulum` int(11) NOT NULL COMMENT 'ID kurikulum',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `id_mata_pelajaran` int(11) NOT NULL COMMENT 'ID mata pelajaran',
  `tingkat_kelas` enum('10','11','12') NOT NULL COMMENT 'Tingkat kelas',
  `rombel` enum('1','2','3','4') DEFAULT NULL COMMENT 'Rombel (NULL untuk kelas 10)',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif',
  `sks_jam_perminggu` int(11) DEFAULT NULL COMMENT 'SKS jam per minggu'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel kurikulum';

--
-- Dumping data untuk tabel `kurikulum`
--

INSERT INTO `kurikulum` (`id_kurikulum`, `id_tahun_ajaran`, `id_mata_pelajaran`, `tingkat_kelas`, `rombel`, `status`, `sks_jam_perminggu`) VALUES
(1, 3, 23, '10', '1', 'Aktif', 5),
(2, 3, 26, '10', '1', 'Aktif', 4);

-- --------------------------------------------------------

--
-- Struktur dari tabel `laporan`
--

CREATE TABLE `laporan` (
  `id_laporan` int(11) NOT NULL COMMENT 'ID laporan',
  `nama_laporan` varchar(200) NOT NULL COMMENT 'Nama laporan',
  `jenis_laporan` enum('Presensi_Bulanan','Tahfidz_Kelompok','Tahfidz_Kelas') NOT NULL COMMENT 'Jenis laporan',
  `periode_laporan` enum('Bulanan','3_Bulanan','Semesteran') NOT NULL COMMENT 'Periode laporan',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `bulan_laporan` varchar(20) DEFAULT NULL COMMENT 'Bulan laporan',
  `tanggal_generate` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Tanggal generate',
  `file_laporan` varchar(255) DEFAULT NULL COMMENT 'File laporan',
  `id_user_generate` varchar(20) NOT NULL COMMENT 'ID user generate'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel laporan';

-- --------------------------------------------------------

--
-- Struktur dari tabel `laporan_presensi_detail`
--

CREATE TABLE `laporan_presensi_detail` (
  `id_laporan_presensi` int(11) NOT NULL COMMENT 'ID laporan presensi',
  `id_laporan` int(11) NOT NULL COMMENT 'ID laporan',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `total_hari_masuk` int(11) NOT NULL COMMENT 'Total hari masuk',
  `total_sakit` int(11) NOT NULL COMMENT 'Total sakit',
  `total_izin` int(11) NOT NULL COMMENT 'Total izin',
  `total_alfa` int(11) NOT NULL COMMENT 'Total alfa',
  `persentase_sakit` decimal(5,2) NOT NULL COMMENT 'Persentase sakit',
  `persentase_izin` decimal(5,2) NOT NULL COMMENT 'Persentase izin',
  `persentase_alfa` decimal(5,2) NOT NULL COMMENT 'Persentase alfa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel detail laporan presensi';

-- --------------------------------------------------------

--
-- Struktur dari tabel `laporan_statistik`
--

CREATE TABLE `laporan_statistik` (
  `id_statistik` int(11) NOT NULL COMMENT 'ID statistik',
  `id_laporan` int(11) NOT NULL COMMENT 'ID laporan',
  `jenis_statistik` enum('Tuntas_Tahfidz','Presensi') NOT NULL COMMENT 'Jenis statistik',
  `total_tuntas` int(11) NOT NULL COMMENT 'Total tuntas',
  `total_belum_tuntas` int(11) NOT NULL COMMENT 'Total belum tuntas',
  `persentase_tuntas` decimal(5,2) NOT NULL COMMENT 'Persentase tuntas',
  `persentase_belum_tuntas` decimal(5,2) NOT NULL COMMENT 'Persentase belum tuntas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel statistik laporan';

-- --------------------------------------------------------

--
-- Struktur dari tabel `laporan_tahfidz_detail`
--

CREATE TABLE `laporan_tahfidz_detail` (
  `id_laporan_tahfidz` int(11) NOT NULL COMMENT 'ID laporan tahfidz',
  `id_laporan` int(11) NOT NULL COMMENT 'ID laporan',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `target_baris` int(11) NOT NULL COMMENT 'Target baris',
  `capaian_baris` int(11) NOT NULL COMMENT 'Capaian baris',
  `status_ketuntasan` enum('Tuntas','Belum_Tuntas') NOT NULL COMMENT 'Status ketuntasan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel detail laporan tahfidz';

-- --------------------------------------------------------

--
-- Struktur dari tabel `mata_pelajaran`
--

CREATE TABLE `mata_pelajaran` (
  `id_mata_pelajaran` int(11) NOT NULL COMMENT 'ID mata pelajaran',
  `nama_mata_pelajaran` varchar(100) NOT NULL COMMENT 'Nama mata pelajaran',
  `kode_mata_pelajaran` varchar(10) NOT NULL COMMENT 'Kode mata pelajaran',
  `kategori` enum('Wajib','Umum','Peminatan','TL','Agama','Mulok') NOT NULL COMMENT 'Kategori mata pelajaran',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel mata pelajaran';

--
-- Dumping data untuk tabel `mata_pelajaran`
--

INSERT INTO `mata_pelajaran` (`id_mata_pelajaran`, `nama_mata_pelajaran`, `kode_mata_pelajaran`, `kategori`, `status`) VALUES
(1, 'Pendidikan Agama Islam', 'PAI', 'Wajib', 'Aktif'),
(2, 'Pendidikan Pancasila', 'PP', 'Wajib', 'Aktif'),
(3, 'Bahasa Indonesia', 'BIND', 'Wajib', 'Aktif'),
(4, 'Matematika', 'MTK', 'Wajib', 'Aktif'),
(5, 'Sejarah Indonesia', 'SEJIND', 'Wajib', 'Aktif'),
(6, 'Bahasa Inggris', 'BING', 'Wajib', 'Aktif'),
(7, 'Seni Budaya', 'SB', 'Umum', 'Aktif'),
(8, 'Pendidikan Jasmani, Olahraga dan Kesehatan', 'PJOK', 'Umum', 'Aktif'),
(9, 'Prakarya dan Kewirausahaan', 'PKWU', 'Umum', 'Aktif'),
(10, 'Matematika Peminatan', 'MTKP', 'Peminatan', 'Aktif'),
(11, 'Fisika', 'FIS', 'Peminatan', 'Aktif'),
(12, 'Kimia', 'KIM', 'Peminatan', 'Aktif'),
(13, 'Biologi', 'BIO', 'Peminatan', 'Aktif'),
(14, 'Geografi', 'GEO', 'Peminatan', 'Aktif'),
(15, 'Sejarah Peminatan', 'SEJP', 'Peminatan', 'Aktif'),
(16, 'Sosiologi', 'SOS', 'Peminatan', 'Aktif'),
(17, 'Ekonomi', 'EKO', 'Peminatan', 'Aktif'),
(18, 'Al-Quran Hadits', 'QH', 'Agama', 'Aktif'),
(20, 'Fiqih', 'FIQ', 'Agama', 'Aktif'),
(21, 'Sejarah Kebudayaan Islam', 'SKI', 'Agama', 'Aktif'),
(22, 'Tahfidz Al-Quran', 'TAHFIDZ', 'Agama', 'Aktif'),
(23, 'Bahasa Arab', 'BARAB', 'Mulok', 'Aktif'),
(24, 'Bahasa Jawa', 'BJAWA', 'Mulok', 'Aktif'),
(25, 'Teknologi Informasi dan Komunikasi', 'TIK', 'Mulok', 'Aktif'),
(26, 'Coding', 'CD', 'Umum', 'Aktif');

-- --------------------------------------------------------

--
-- Struktur dari tabel `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2025_09_28_173538_add_keterangan_tambahan_to_jurnal_mengajar_table', 1),
(2, '0001_01_01_000000_create_users_table', 1),
(3, '0001_01_01_000001_create_cache_table', 1),
(4, '0001_01_01_000002_create_jobs_table', 1),
(5, '2025_09_28_165418_create_jurnal_mengajar_table', 1),
(6, '2025_09_28_165418_create_jadwal_pelajaran_table', 1),
(7, '2025_09_28_181412_create_personal_access_tokens_table', 1),
(8, '2025_09_28_165353_create_jurnal_mengajar_table', 1),
(9, '2024_01_15_add_barcode_rfid_to_siswa_table', 2),
(10, '2025_10_02_025227_create_sessions_table', 3),
(11, '2025_10_02_030223_create_kelas_siswa_table', 4),
(12, '2024_01_16_fix_bobot_nilai_column', 5),
(13, '2025_10_02_000001_add_keterangan_siswa_to_pengumpulan_tugas', 6),
(14, '2025_10_02_040000_create_permission_overrides_table', 7);

-- --------------------------------------------------------

--
-- Struktur dari tabel `monitoring_adab`
--

CREATE TABLE `monitoring_adab` (
  `id_monitoring_adab` int(11) NOT NULL COMMENT 'ID monitoring adab',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `tanggal` date NOT NULL COMMENT 'Tanggal monitoring',
  `id_tugas_adab` int(11) NOT NULL COMMENT 'ID tugas adab',
  `status_dilaksanakan` enum('Ya','Tidak') NOT NULL COMMENT 'Status dilaksanakan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel monitoring adab siswa';

--
-- Dumping data untuk tabel `monitoring_adab`
--

INSERT INTO `monitoring_adab` (`id_monitoring_adab`, `nis`, `id_tahun_ajaran`, `tanggal`, `id_tugas_adab`, `status_dilaksanakan`) VALUES
(1, '4407-2425001', 1, '2025-10-06', 1, 'Tidak'),
(2, '4407-2425001', 1, '2025-10-06', 2, 'Ya'),
(3, '4407-2425001', 1, '2025-10-06', 3, 'Tidak'),
(4, '4407-2425001', 1, '2025-10-06', 4, 'Ya'),
(5, '4407-2425001', 1, '2025-10-06', 5, 'Tidak'),
(6, '4407-2425001', 1, '2025-10-06', 6, 'Ya'),
(7, '4407-2425001', 1, '2025-10-06', 7, 'Tidak'),
(8, '4407-2425001', 1, '2025-10-06', 8, 'Ya'),
(9, '4407-2425001', 3, '2025-10-06', 9, 'Tidak');

-- --------------------------------------------------------

--
-- Struktur dari tabel `monitoring_sholat`
--

CREATE TABLE `monitoring_sholat` (
  `id_monitoring_sholat` int(11) NOT NULL COMMENT 'ID monitoring sholat',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `tanggal` date NOT NULL COMMENT 'Tanggal monitoring',
  `jenis_sholat` enum('Dhuha','Dhuhur','Asar') NOT NULL COMMENT 'Jenis sholat',
  `status_kehadiran` enum('Hadir','Tidak_Hadir') NOT NULL COMMENT 'Status kehadiran',
  `nik_guru_input` varchar(20) NOT NULL COMMENT 'NIK guru penginput'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel monitoring sholat siswa';

--
-- Dumping data untuk tabel `monitoring_sholat`
--

INSERT INTO `monitoring_sholat` (`id_monitoring_sholat`, `nis`, `tanggal`, `jenis_sholat`, `status_kehadiran`, `nik_guru_input`) VALUES
(1, '4407-2526001', '2025-10-04', 'Dhuhur', 'Tidak_Hadir', '06.0412'),
(2, '4407-2526002', '2025-10-04', 'Dhuhur', 'Tidak_Hadir', '06.0412');

-- --------------------------------------------------------

--
-- Struktur dari tabel `nilai`
--

CREATE TABLE `nilai` (
  `id_nilai` int(11) NOT NULL COMMENT 'ID nilai',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `id_mata_pelajaran` int(11) NOT NULL COMMENT 'ID mata pelajaran',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `jenis_penilaian` enum('PH1','PH2','PH3','ASTS1','ASAS','ASTS2','ASAT','Tugas','Praktek') NOT NULL COMMENT 'Jenis penilaian',
  `nilai` int(11) NOT NULL COMMENT 'Nilai (0-100)',
  `status` enum('Draft','Final') DEFAULT 'Draft' COMMENT 'Status nilai',
  `tanggal_input` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Tanggal input',
  `nik_guru_penginput` varchar(20) NOT NULL COMMENT 'NIK guru penginput',
  `keterangan` text DEFAULT NULL COMMENT 'Keterangan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel nilai siswa';

-- --------------------------------------------------------

--
-- Struktur dari tabel `orang_tua`
--

CREATE TABLE `orang_tua` (
  `id_orang_tua` int(11) NOT NULL COMMENT 'ID orang tua',
  `nama_ayah` varchar(100) DEFAULT NULL COMMENT 'Nama ayah',
  `nama_ibu` varchar(100) DEFAULT NULL COMMENT 'Nama ibu',
  `no_hp` varchar(15) DEFAULT NULL COMMENT 'Nomor HP',
  `alamat` text DEFAULT NULL COMMENT 'Alamat',
  `pekerjaan_ayah` varchar(100) DEFAULT NULL COMMENT 'Pekerjaan ayah',
  `pekerjaan_ibu` varchar(100) DEFAULT NULL COMMENT 'Pekerjaan ibu',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data orang tua siswa';

--
-- Dumping data untuk tabel `orang_tua`
--

INSERT INTO `orang_tua` (`id_orang_tua`, `nama_ayah`, `nama_ibu`, `no_hp`, `alamat`, `pekerjaan_ayah`, `pekerjaan_ibu`, `status`) VALUES
(3, 'ayah1', 'ibu1', NULL, NULL, NULL, NULL, 'Aktif'),
(4, 'ayah2', 'ibu2', NULL, NULL, NULL, NULL, 'Aktif'),
(5, 'ayah3', 'ibu3', NULL, NULL, NULL, NULL, 'Aktif'),
(6, 'ayah4', 'ibu4', NULL, NULL, NULL, NULL, 'Aktif'),
(7, 'ayah5', 'ibu5', NULL, NULL, NULL, NULL, 'Aktif'),
(8, 'ayah6', 'ibu6', NULL, NULL, NULL, NULL, 'Aktif'),
(9, 'ayah7', 'ibu7', NULL, NULL, NULL, NULL, 'Aktif'),
(10, 'ayah8', 'ibu8', NULL, NULL, NULL, NULL, 'Aktif'),
(11, 'ayah9', 'ibu9', NULL, NULL, NULL, NULL, 'Aktif'),
(12, 'ayah10', 'ibu10', NULL, NULL, NULL, NULL, 'Aktif'),
(13, 'ayah11', 'ibu11', NULL, NULL, NULL, NULL, 'Aktif'),
(14, 'ayah12', 'ibu12', NULL, NULL, NULL, NULL, 'Aktif'),
(15, 'ayah13', 'ibu13', NULL, NULL, NULL, NULL, 'Aktif'),
(16, 'ayah14', 'ibu14', NULL, NULL, NULL, NULL, 'Aktif'),
(17, 'ayah15', 'ibu15', NULL, NULL, NULL, NULL, 'Aktif'),
(18, 'ayah16', 'ibu16', NULL, NULL, NULL, NULL, 'Aktif'),
(19, 'ayah17', 'ibu17', NULL, NULL, NULL, NULL, 'Aktif'),
(20, 'ayah18', 'ibu18', NULL, NULL, NULL, NULL, 'Aktif'),
(21, 'ayah19', 'ibu19', NULL, NULL, NULL, NULL, 'Aktif'),
(22, 'ayah20', 'ibu20', NULL, NULL, NULL, NULL, 'Aktif'),
(23, 'ayah21', 'ibu21', NULL, NULL, NULL, NULL, 'Aktif'),
(24, 'ayah22', 'ibu22', NULL, NULL, NULL, NULL, 'Aktif'),
(25, 'ayah23', 'ibu23', NULL, NULL, NULL, NULL, 'Aktif'),
(26, 'ayah24', 'ibu24', NULL, NULL, NULL, NULL, 'Aktif'),
(27, 'ayah25', 'ibu25', NULL, NULL, NULL, NULL, 'Aktif'),
(28, 'ayah26', 'ibu26', NULL, NULL, NULL, NULL, 'Aktif'),
(29, 'ayah27', 'ibu27', NULL, NULL, NULL, NULL, 'Aktif'),
(30, 'ayah28', 'ibu28', NULL, NULL, NULL, NULL, 'Aktif'),
(31, 'ayah29', 'ibu29', NULL, NULL, NULL, NULL, 'Aktif'),
(32, 'ayah30', 'ibu30', NULL, NULL, NULL, NULL, 'Aktif'),
(33, 'ayah31', 'ibu31', NULL, NULL, NULL, NULL, 'Aktif'),
(34, 'ayah32', 'ibu32', NULL, NULL, NULL, NULL, 'Aktif'),
(35, 'ayah33', 'ibu33', NULL, NULL, NULL, NULL, 'Aktif'),
(36, 'ayah34', 'ibu34', NULL, NULL, NULL, NULL, 'Aktif'),
(37, 'ayah35', 'ibu35', NULL, NULL, NULL, NULL, 'Aktif'),
(38, 'ayah36', 'ibu36', NULL, NULL, NULL, NULL, 'Aktif'),
(39, 'ayah37', 'ibu37', NULL, NULL, NULL, NULL, 'Aktif'),
(40, 'ayah38', 'ibu38', NULL, NULL, NULL, NULL, 'Aktif'),
(41, 'ayah39', 'ibu39', NULL, NULL, NULL, NULL, 'Aktif'),
(42, 'ayah40', 'ibu40', NULL, NULL, NULL, NULL, 'Aktif'),
(43, 'ayah41', 'ibu41', NULL, NULL, NULL, NULL, 'Aktif'),
(44, 'ayah42', 'ibu42', NULL, NULL, NULL, NULL, 'Aktif'),
(45, 'ayah43', 'ibu43', NULL, NULL, NULL, NULL, 'Aktif'),
(46, 'ayah44', 'ibu44', NULL, NULL, NULL, NULL, 'Aktif'),
(47, 'ayah45', 'ibu45', NULL, NULL, NULL, NULL, 'Aktif'),
(48, 'ayah46', 'ibu46', NULL, NULL, NULL, NULL, 'Aktif'),
(49, 'ayah47', 'ibu47', NULL, NULL, NULL, NULL, 'Aktif'),
(50, 'ayah48', 'ibu48', NULL, NULL, NULL, NULL, 'Aktif'),
(51, 'ayah49', 'ibu49', NULL, NULL, NULL, NULL, 'Aktif'),
(52, 'ayah50', 'ibu50', NULL, NULL, NULL, NULL, 'Aktif'),
(53, 'ayah51', 'ibu51', NULL, NULL, NULL, NULL, 'Aktif'),
(54, 'ayah52', 'ibu52', NULL, NULL, NULL, NULL, 'Aktif'),
(55, 'ayah53', 'ibu53', NULL, NULL, NULL, NULL, 'Aktif'),
(56, 'ayah54', 'ibu54', NULL, NULL, NULL, NULL, 'Aktif'),
(57, 'ayah55', 'ibu55', NULL, NULL, NULL, NULL, 'Aktif'),
(58, 'ayah56', 'ibu56', NULL, NULL, NULL, NULL, 'Aktif'),
(59, 'ayah57', 'ibu57', NULL, NULL, NULL, NULL, 'Aktif'),
(60, 'ayah58', 'ibu58', NULL, NULL, NULL, NULL, 'Aktif'),
(61, 'ayah59', 'ibu59', NULL, NULL, NULL, NULL, 'Aktif'),
(62, 'ayah60', 'ibu60', NULL, NULL, NULL, NULL, 'Aktif'),
(63, 'ayah61', 'ibu61', NULL, NULL, NULL, NULL, 'Aktif'),
(64, 'ayah62', 'ibu62', NULL, NULL, NULL, NULL, 'Aktif'),
(65, 'ayah63', 'ibu63', NULL, NULL, NULL, NULL, 'Aktif'),
(66, 'ayah64', 'ibu64', NULL, NULL, NULL, NULL, 'Aktif'),
(67, 'ayah65', 'ibu65', NULL, NULL, NULL, NULL, 'Aktif'),
(68, 'ayah66', 'ibu66', NULL, NULL, NULL, NULL, 'Aktif'),
(69, 'ayah67', 'ibu67', NULL, NULL, NULL, NULL, 'Aktif'),
(70, 'ayah68', 'ibu68', NULL, NULL, NULL, NULL, 'Aktif'),
(71, 'ayah69', 'ibu69', NULL, NULL, NULL, NULL, 'Aktif'),
(72, 'ayah70', 'ibu70', NULL, NULL, NULL, NULL, 'Aktif'),
(73, 'ayah71', 'ibu71', NULL, NULL, NULL, NULL, 'Aktif'),
(74, 'ayah72', 'ibu72', NULL, NULL, NULL, NULL, 'Aktif'),
(75, 'ayah73', 'ibu73', NULL, NULL, NULL, NULL, 'Aktif'),
(76, 'ayah74', 'ibu74', NULL, NULL, NULL, NULL, 'Aktif'),
(77, 'ayah75', 'ibu75', NULL, NULL, NULL, NULL, 'Aktif'),
(78, 'ayah76', 'ibu76', NULL, NULL, NULL, NULL, 'Aktif'),
(79, 'ayah77', 'ibu77', NULL, NULL, NULL, NULL, 'Aktif'),
(80, 'ayah78', 'ibu78', NULL, NULL, NULL, NULL, 'Aktif'),
(81, 'ayah79', 'ibu79', NULL, NULL, NULL, NULL, 'Aktif'),
(82, 'ayah80', 'ibu80', NULL, NULL, NULL, NULL, 'Aktif'),
(83, 'ayah81', 'ibu81', NULL, NULL, NULL, NULL, 'Aktif'),
(84, 'ayah82', 'ibu82', NULL, NULL, NULL, NULL, 'Aktif'),
(85, 'ayah83', 'ibu83', NULL, NULL, NULL, NULL, 'Aktif'),
(86, 'ayah84', 'ibu84', NULL, NULL, NULL, NULL, 'Aktif'),
(87, 'ayah85', 'ibu85', NULL, NULL, NULL, NULL, 'Aktif'),
(88, 'ayah86', 'ibu86', NULL, NULL, NULL, NULL, 'Aktif'),
(89, 'ayah87', 'ibu87', NULL, NULL, NULL, NULL, 'Aktif'),
(90, 'ayah1', 'ibu1', NULL, NULL, NULL, NULL, 'Aktif'),
(91, 'ayah2', 'ibu2', NULL, NULL, NULL, NULL, 'Aktif'),
(92, 'ayah3', 'ibu3', NULL, NULL, NULL, NULL, 'Aktif'),
(93, 'ayah4', 'ibu4', NULL, NULL, NULL, NULL, 'Aktif'),
(94, 'ayah5', 'ibu5', NULL, NULL, NULL, NULL, 'Aktif'),
(95, 'ayah6', 'ibu6', NULL, NULL, NULL, NULL, 'Aktif'),
(96, 'ayah7', 'ibu7', NULL, NULL, NULL, NULL, 'Aktif'),
(97, 'ayah8', 'ibu8', NULL, NULL, NULL, NULL, 'Aktif'),
(98, 'ayah9', 'ibu9', NULL, NULL, NULL, NULL, 'Aktif'),
(99, 'ayah10', 'ibu10', NULL, NULL, NULL, NULL, 'Aktif'),
(100, 'ayah11', 'ibu11', NULL, NULL, NULL, NULL, 'Aktif'),
(101, 'ayah12', 'ibu12', NULL, NULL, NULL, NULL, 'Aktif'),
(102, 'ayah13', 'ibu13', NULL, NULL, NULL, NULL, 'Aktif'),
(103, 'ayah14', 'ibu14', NULL, NULL, NULL, NULL, 'Aktif'),
(104, 'ayah15', 'ibu15', NULL, NULL, NULL, NULL, 'Aktif'),
(105, 'ayah16', 'ibu16', NULL, NULL, NULL, NULL, 'Aktif'),
(106, 'ayah17', 'ibu17', NULL, NULL, NULL, NULL, 'Aktif'),
(107, 'ayah18', 'ibu18', NULL, NULL, NULL, NULL, 'Aktif'),
(108, 'ayah19', 'ibu19', NULL, NULL, NULL, NULL, 'Aktif'),
(109, 'ayah20', 'ibu20', NULL, NULL, NULL, NULL, 'Aktif'),
(110, 'ayah21', 'ibu21', NULL, NULL, NULL, NULL, 'Aktif'),
(111, 'ayah22', 'ibu22', NULL, NULL, NULL, NULL, 'Aktif'),
(112, 'ayah23', 'ibu23', NULL, NULL, NULL, NULL, 'Aktif'),
(113, 'ayah24', 'ibu24', NULL, NULL, NULL, NULL, 'Aktif'),
(114, 'ayah25', 'ibu25', NULL, NULL, NULL, NULL, 'Aktif'),
(115, 'ayah26', 'ibu26', NULL, NULL, NULL, NULL, 'Aktif'),
(116, 'ayah27', 'ibu27', NULL, NULL, NULL, NULL, 'Aktif'),
(117, 'ayah28', 'ibu28', NULL, NULL, NULL, NULL, 'Aktif'),
(118, 'ayah29', 'ibu29', NULL, NULL, NULL, NULL, 'Aktif'),
(119, 'ayah30', 'ibu30', NULL, NULL, NULL, NULL, 'Aktif'),
(120, 'ayah31', 'ibu31', NULL, NULL, NULL, NULL, 'Aktif'),
(121, 'ayah32', 'ibu32', NULL, NULL, NULL, NULL, 'Aktif'),
(122, 'ayah33', 'ibu33', NULL, NULL, NULL, NULL, 'Aktif'),
(123, 'ayah34', 'ibu34', NULL, NULL, NULL, NULL, 'Aktif'),
(124, 'ayah35', 'ibu35', NULL, NULL, NULL, NULL, 'Aktif'),
(125, 'ayah36', 'ibu36', NULL, NULL, NULL, NULL, 'Aktif'),
(126, 'ayah37', 'ibu37', NULL, NULL, NULL, NULL, 'Aktif'),
(127, 'ayah38', 'ibu38', NULL, NULL, NULL, NULL, 'Aktif'),
(128, 'ayah39', 'ibu39', NULL, NULL, NULL, NULL, 'Aktif'),
(129, 'ayah40', 'ibu40', NULL, NULL, NULL, NULL, 'Aktif'),
(130, 'ayah41', 'ibu41', NULL, NULL, NULL, NULL, 'Aktif'),
(131, 'ayah42', 'ibu42', NULL, NULL, NULL, NULL, 'Aktif'),
(132, 'ayah43', 'ibu43', NULL, NULL, NULL, NULL, 'Aktif'),
(133, 'ayah44', 'ibu44', NULL, NULL, NULL, NULL, 'Aktif'),
(134, 'ayah45', 'ibu45', NULL, NULL, NULL, NULL, 'Aktif'),
(135, 'ayah46', 'ibu46', NULL, NULL, NULL, NULL, 'Aktif'),
(136, 'ayah47', 'ibu47', NULL, NULL, NULL, NULL, 'Aktif'),
(137, 'ayah48', 'ibu48', NULL, NULL, NULL, NULL, 'Aktif'),
(138, 'ayah49', 'ibu49', NULL, NULL, NULL, NULL, 'Aktif'),
(139, 'ayah50', 'ibu50', NULL, NULL, NULL, NULL, 'Aktif'),
(140, 'ayah51', 'ibu51', NULL, NULL, NULL, NULL, 'Aktif'),
(141, 'ayah52', 'ibu52', NULL, NULL, NULL, NULL, 'Aktif'),
(142, 'ayah53', 'ibu53', NULL, NULL, NULL, NULL, 'Aktif'),
(143, 'ayah54', 'ibu54', NULL, NULL, NULL, NULL, 'Aktif'),
(144, 'ayah55', 'ibu55', NULL, NULL, NULL, NULL, 'Aktif'),
(145, 'ayah56', 'ibu56', NULL, NULL, NULL, NULL, 'Aktif'),
(146, 'ayah57', 'ibu57', NULL, NULL, NULL, NULL, 'Aktif'),
(147, 'ayah58', 'ibu58', NULL, NULL, NULL, NULL, 'Aktif'),
(148, 'ayah59', 'ibu59', NULL, NULL, NULL, NULL, 'Aktif'),
(149, 'ayah60', 'ibu60', NULL, NULL, NULL, NULL, 'Aktif'),
(150, 'ayah61', 'ibu61', NULL, NULL, NULL, NULL, 'Aktif'),
(151, 'ayah62', 'ibu62', NULL, NULL, NULL, NULL, 'Aktif'),
(152, 'ayah63', 'ibu63', NULL, NULL, NULL, NULL, 'Aktif'),
(153, 'ayah64', 'ibu64', NULL, NULL, NULL, NULL, 'Aktif'),
(154, 'ayah65', 'ibu65', NULL, NULL, NULL, NULL, 'Aktif'),
(155, 'ayah66', 'ibu66', NULL, NULL, NULL, NULL, 'Aktif'),
(156, 'ayah67', 'ibu67', NULL, NULL, NULL, NULL, 'Aktif'),
(157, 'ayah68', 'ibu68', NULL, NULL, NULL, NULL, 'Aktif'),
(158, 'ayah69', 'ibu69', NULL, NULL, NULL, NULL, 'Aktif'),
(159, 'ayah70', 'ibu70', NULL, NULL, NULL, NULL, 'Aktif'),
(160, 'ayah71', 'ibu71', NULL, NULL, NULL, NULL, 'Aktif'),
(161, 'ayah72', 'ibu72', NULL, NULL, NULL, NULL, 'Aktif'),
(162, 'ayah73', 'ibu73', NULL, NULL, NULL, NULL, 'Aktif'),
(163, 'ayah74', 'ibu74', NULL, NULL, NULL, NULL, 'Aktif'),
(164, 'ayah75', 'ibu75', NULL, NULL, NULL, NULL, 'Aktif'),
(165, 'ayah76', 'ibu76', NULL, NULL, NULL, NULL, 'Aktif'),
(166, 'ayah77', 'ibu77', NULL, NULL, NULL, NULL, 'Aktif'),
(167, 'ayah78', 'ibu78', NULL, NULL, NULL, NULL, 'Aktif'),
(168, 'ayah79', 'ibu79', NULL, NULL, NULL, NULL, 'Aktif'),
(169, 'ayah80', 'ibu80', NULL, NULL, NULL, NULL, 'Aktif'),
(170, 'ayah81', 'ibu81', NULL, NULL, NULL, NULL, 'Aktif'),
(171, 'ayah82', 'ibu82', NULL, NULL, NULL, NULL, 'Aktif'),
(172, 'ayah83', 'ibu83', NULL, NULL, NULL, NULL, 'Aktif'),
(173, 'ayah84', 'ibu84', NULL, NULL, NULL, NULL, 'Aktif'),
(174, 'ayah85', 'ibu85', NULL, NULL, NULL, NULL, 'Aktif'),
(175, 'ayah86', 'ibu86', NULL, NULL, NULL, NULL, 'Aktif'),
(176, 'ayah87', 'ibu87', NULL, NULL, NULL, NULL, 'Aktif'),
(177, 'ayah1', 'ibu1', NULL, NULL, NULL, NULL, 'Aktif'),
(178, 'ayah2', 'ibu2', NULL, NULL, NULL, NULL, 'Aktif'),
(179, 'ayah3', 'ibu3', NULL, NULL, NULL, NULL, 'Aktif'),
(180, 'ayah4', 'ibu4', NULL, NULL, NULL, NULL, 'Aktif'),
(181, 'ayah5', 'ibu5', NULL, NULL, NULL, NULL, 'Aktif'),
(182, 'ayah6', 'ibu6', NULL, NULL, NULL, NULL, 'Aktif'),
(183, 'ayah7', 'ibu7', NULL, NULL, NULL, NULL, 'Aktif'),
(184, 'ayah8', 'ibu8', NULL, NULL, NULL, NULL, 'Aktif'),
(185, 'ayah9', 'ibu9', NULL, NULL, NULL, NULL, 'Aktif'),
(186, 'ayah10', 'ibu10', NULL, NULL, NULL, NULL, 'Aktif'),
(187, 'ayah11', 'ibu11', NULL, NULL, NULL, NULL, 'Aktif'),
(188, 'ayah12', 'ibu12', NULL, NULL, NULL, NULL, 'Aktif'),
(189, 'ayah13', 'ibu13', NULL, NULL, NULL, NULL, 'Aktif'),
(190, 'ayah14', 'ibu14', NULL, NULL, NULL, NULL, 'Aktif'),
(191, 'ayah15', 'ibu15', NULL, NULL, NULL, NULL, 'Aktif'),
(192, 'ayah16', 'ibu16', NULL, NULL, NULL, NULL, 'Aktif'),
(193, 'ayah17', 'ibu17', NULL, NULL, NULL, NULL, 'Aktif'),
(194, 'ayah18', 'ibu18', NULL, NULL, NULL, NULL, 'Aktif'),
(195, 'ayah19', 'ibu19', NULL, NULL, NULL, NULL, 'Aktif'),
(196, 'ayah20', 'ibu20', NULL, NULL, NULL, NULL, 'Aktif'),
(197, 'ayah21', 'ibu21', NULL, NULL, NULL, NULL, 'Aktif'),
(198, 'ayah22', 'ibu22', NULL, NULL, NULL, NULL, 'Aktif'),
(199, 'ayah23', 'ibu23', NULL, NULL, NULL, NULL, 'Aktif'),
(200, 'ayah24', 'ibu24', NULL, NULL, NULL, NULL, 'Aktif'),
(201, 'ayah25', 'ibu25', NULL, NULL, NULL, NULL, 'Aktif'),
(202, 'ayah26', 'ibu26', NULL, NULL, NULL, NULL, 'Aktif'),
(203, 'ayah27', 'ibu27', NULL, NULL, NULL, NULL, 'Aktif'),
(204, 'ayah28', 'ibu28', NULL, NULL, NULL, NULL, 'Aktif'),
(205, 'ayah29', 'ibu29', NULL, NULL, NULL, NULL, 'Aktif'),
(206, 'ayah30', 'ibu30', NULL, NULL, NULL, NULL, 'Aktif'),
(207, 'ayah31', 'ibu31', NULL, NULL, NULL, NULL, 'Aktif'),
(208, 'ayah32', 'ibu32', NULL, NULL, NULL, NULL, 'Aktif'),
(209, 'ayah33', 'ibu33', NULL, NULL, NULL, NULL, 'Aktif'),
(210, 'ayah34', 'ibu34', NULL, NULL, NULL, NULL, 'Aktif'),
(211, 'ayah35', 'ibu35', NULL, NULL, NULL, NULL, 'Aktif'),
(212, 'ayah36', 'ibu36', NULL, NULL, NULL, NULL, 'Aktif'),
(213, 'ayah37', 'ibu37', NULL, NULL, NULL, NULL, 'Aktif'),
(214, 'ayah38', 'ibu38', NULL, NULL, NULL, NULL, 'Aktif'),
(215, 'ayah39', 'ibu39', NULL, NULL, NULL, NULL, 'Aktif'),
(216, 'ayah40', 'ibu40', NULL, NULL, NULL, NULL, 'Aktif'),
(217, 'ayah41', 'ibu41', NULL, NULL, NULL, NULL, 'Aktif'),
(218, 'ayah42', 'ibu42', NULL, NULL, NULL, NULL, 'Aktif'),
(219, 'ayah43', 'ibu43', NULL, NULL, NULL, NULL, 'Aktif'),
(220, 'ayah44', 'ibu44', NULL, NULL, NULL, NULL, 'Aktif'),
(221, 'ayah45', 'ibu45', NULL, NULL, NULL, NULL, 'Aktif'),
(222, 'ayah46', 'ibu46', NULL, NULL, NULL, NULL, 'Aktif'),
(223, 'ayah47', 'ibu47', NULL, NULL, NULL, NULL, 'Aktif'),
(224, 'ayah48', 'ibu48', NULL, NULL, NULL, NULL, 'Aktif'),
(225, 'ayah49', 'ibu49', NULL, NULL, NULL, NULL, 'Aktif'),
(226, 'ayah50', 'ibu50', NULL, NULL, NULL, NULL, 'Aktif'),
(227, 'ayah51', 'ibu51', NULL, NULL, NULL, NULL, 'Aktif'),
(228, 'ayah52', 'ibu52', NULL, NULL, NULL, NULL, 'Aktif'),
(229, 'ayah53', 'ibu53', NULL, NULL, NULL, NULL, 'Aktif'),
(230, 'ayah54', 'ibu54', NULL, NULL, NULL, NULL, 'Aktif'),
(231, 'ayah55', 'ibu55', NULL, NULL, NULL, NULL, 'Aktif'),
(232, 'ayah56', 'ibu56', NULL, NULL, NULL, NULL, 'Aktif'),
(233, 'ayah57', 'ibu57', NULL, NULL, NULL, NULL, 'Aktif'),
(234, 'ayah58', 'ibu58', NULL, NULL, NULL, NULL, 'Aktif'),
(235, 'ayah59', 'ibu59', NULL, NULL, NULL, NULL, 'Aktif'),
(264, 'ayahXI1', 'ibuXI1', '081234567890', 'Alamat Orang Tua', NULL, NULL, 'Aktif'),
(265, 'ayahXI2', 'ibuXI2', NULL, NULL, NULL, NULL, 'Aktif'),
(266, 'ayahXI3', 'ibuXI3', NULL, NULL, NULL, NULL, 'Aktif'),
(267, 'ayahXI4', 'ibuXI4', NULL, NULL, NULL, NULL, 'Aktif'),
(268, 'ayahXI5', 'ibuXI5', NULL, NULL, NULL, NULL, 'Aktif'),
(269, 'ayahXI6', 'ibuXI6', NULL, NULL, NULL, NULL, 'Aktif'),
(270, 'ayahXI7', 'ibuXI7', NULL, NULL, NULL, NULL, 'Aktif'),
(271, 'ayahXI8', 'ibuXI8', NULL, NULL, NULL, NULL, 'Aktif'),
(272, 'ayahXI9', 'ibuXI9', NULL, NULL, NULL, NULL, 'Aktif'),
(273, 'ayahXI10', 'ibuXI10', NULL, NULL, NULL, NULL, 'Aktif'),
(274, 'ayahXI11', 'ibuXI11', NULL, NULL, NULL, NULL, 'Aktif'),
(275, 'ayahXI12', 'ibuXI12', NULL, NULL, NULL, NULL, 'Aktif'),
(276, 'ayahXI13', 'ibuXI13', NULL, NULL, NULL, NULL, 'Aktif'),
(277, 'ayahXI14', 'ibuXI14', NULL, NULL, NULL, NULL, 'Aktif'),
(278, 'ayahXI15', 'ibuXI15', NULL, NULL, NULL, NULL, 'Aktif'),
(279, 'ayahXI16', 'ibuXI16', NULL, NULL, NULL, NULL, 'Aktif'),
(280, 'ayahXI17', 'ibuXI17', NULL, NULL, NULL, NULL, 'Aktif'),
(281, 'ayahXI18', 'ibuXI18', NULL, NULL, NULL, NULL, 'Aktif'),
(282, 'ayahXI19', 'ibuXI19', NULL, NULL, NULL, NULL, 'Aktif'),
(283, 'ayahXI20', 'ibuXI20', NULL, NULL, NULL, NULL, 'Aktif'),
(284, 'ayahXI21', 'ibuXI21', NULL, NULL, NULL, NULL, 'Aktif'),
(285, 'ayahXI22', 'ibuXI22', NULL, NULL, NULL, NULL, 'Aktif'),
(286, 'ayahXI23', 'ibuXI23', NULL, NULL, NULL, NULL, 'Aktif'),
(287, 'ayahXI24', 'ibuXI24', NULL, NULL, NULL, NULL, 'Aktif'),
(288, 'ayahXI25', 'ibuXI25', NULL, NULL, NULL, NULL, 'Aktif'),
(289, 'ayahXI26', 'ibuXI26', NULL, NULL, NULL, NULL, 'Aktif'),
(290, 'ayahXI27', 'ibuXI27', NULL, NULL, NULL, NULL, 'Aktif'),
(291, 'ayahXI28', 'ibuXI28', NULL, NULL, NULL, NULL, 'Aktif'),
(292, 'ayahXI29', 'ibuXI29', NULL, NULL, NULL, NULL, 'Aktif'),
(293, 'ayahXI30', 'ibuXI30', NULL, NULL, NULL, NULL, 'Aktif'),
(294, 'ayahXI31', 'ibuXI31', NULL, NULL, NULL, NULL, 'Aktif'),
(295, 'ayahXI32', 'ibuXI32', NULL, NULL, NULL, NULL, 'Aktif'),
(296, 'ayahXI33', 'ibuXI33', NULL, NULL, NULL, NULL, 'Aktif'),
(297, 'ayahXI34', 'ibuXI34', NULL, NULL, NULL, NULL, 'Aktif'),
(298, 'ayahXI35', 'ibuXI35', NULL, NULL, NULL, NULL, 'Aktif'),
(299, 'ayahXI36', 'ibuXI36', NULL, NULL, NULL, NULL, 'Aktif'),
(300, 'ayahXI37', 'ibuXI37', NULL, NULL, NULL, NULL, 'Aktif'),
(301, 'ayahXI38', 'ibuXI38', NULL, NULL, NULL, NULL, 'Aktif'),
(302, 'ayahXI39', 'ibuXI39', NULL, NULL, NULL, NULL, 'Aktif'),
(303, 'ayahXI40', 'ibuXI40', NULL, NULL, NULL, NULL, 'Aktif'),
(304, 'ayahXI41', 'ibuXI41', NULL, NULL, NULL, NULL, 'Aktif'),
(305, 'ayahXI42', 'ibuXI42', NULL, NULL, NULL, NULL, 'Aktif'),
(306, 'ayahXI43', 'ibuXI43', NULL, NULL, NULL, NULL, 'Aktif'),
(307, 'ayahXI44', 'ibuXI44', NULL, NULL, NULL, NULL, 'Aktif'),
(308, 'ayahXI45', 'ibuXI45', NULL, NULL, NULL, NULL, 'Aktif'),
(309, 'ayahXI46', 'ibuXI46', NULL, NULL, NULL, NULL, 'Aktif'),
(310, 'ayahXI47', 'ibuXI47', NULL, NULL, NULL, NULL, 'Aktif'),
(311, 'ayahXI48', 'ibuXI48', NULL, NULL, NULL, NULL, 'Aktif'),
(312, 'ayahXI49', 'ibuXI49', NULL, NULL, NULL, NULL, 'Aktif'),
(313, 'ayahXI50', 'ibuXI50', NULL, NULL, NULL, NULL, 'Aktif'),
(314, 'ayahXI51', 'ibuXI51', NULL, NULL, NULL, NULL, 'Aktif'),
(315, 'ayahXI52', 'ibuXI52', NULL, NULL, NULL, NULL, 'Aktif'),
(316, 'ayahXI53', 'ibuXI53', NULL, NULL, NULL, NULL, 'Aktif'),
(317, 'ayahXI54', 'ibuXI54', NULL, NULL, NULL, NULL, 'Aktif'),
(318, 'ayahXI55', 'ibuXI55', NULL, NULL, NULL, NULL, 'Aktif'),
(319, 'ayahXI56', 'ibuXI56', NULL, NULL, NULL, NULL, 'Aktif'),
(320, 'ayahXI57', 'ibuXI57', NULL, NULL, NULL, NULL, 'Aktif'),
(321, 'ayahXI58', 'ibuXI58', NULL, NULL, NULL, NULL, 'Aktif'),
(322, 'ayahXI59', 'ibuXI59', NULL, NULL, NULL, NULL, 'Aktif'),
(323, 'ayahXI60', 'ibuXI60', NULL, NULL, NULL, NULL, 'Aktif'),
(324, 'ayahXI61', 'ibuXI61', NULL, NULL, NULL, NULL, 'Aktif'),
(325, 'ayahXI62', 'ibuXI62', NULL, NULL, NULL, NULL, 'Aktif'),
(326, 'ayahXI63', 'ibuXI63', NULL, NULL, NULL, NULL, 'Aktif'),
(327, 'ayahXI64', 'ibuXI64', NULL, NULL, NULL, NULL, 'Aktif'),
(328, 'ayahXI65', 'ibuXI65', NULL, NULL, NULL, NULL, 'Aktif'),
(329, 'ayahXI66', 'ibuXI66', NULL, NULL, NULL, NULL, 'Aktif'),
(330, 'ayahXI67', 'ibuXI67', NULL, NULL, NULL, NULL, 'Aktif'),
(331, 'ayahXI68', 'ibuXI68', NULL, NULL, NULL, NULL, 'Aktif'),
(332, 'ayahXI69', 'ibuXI69', NULL, NULL, NULL, NULL, 'Aktif'),
(333, 'ayahXI70', 'ibuXI70', NULL, NULL, NULL, NULL, 'Aktif'),
(334, 'ayahXI71', 'ibuXI71', NULL, NULL, NULL, NULL, 'Aktif'),
(335, 'ayahXI72', 'ibuXI72', NULL, NULL, NULL, NULL, 'Aktif'),
(336, 'ayahXI73', 'ibuXI73', NULL, NULL, NULL, NULL, 'Aktif'),
(337, 'ayahXI74', 'ibuXI74', NULL, NULL, NULL, NULL, 'Aktif'),
(338, 'ayahXI75', 'ibuXI75', NULL, NULL, NULL, NULL, 'Aktif'),
(339, 'ayahXI76', 'ibuXI76', NULL, NULL, NULL, NULL, 'Aktif'),
(340, 'ayahXI77', 'ibuXI77', NULL, NULL, NULL, NULL, 'Aktif'),
(341, 'ayahXI78', 'ibuXI78', NULL, NULL, NULL, NULL, 'Aktif'),
(342, 'ayahXI79', 'ibuXI79', NULL, NULL, NULL, NULL, 'Aktif'),
(343, 'ayahXI80', 'ibuXI80', NULL, NULL, NULL, NULL, 'Aktif'),
(344, 'ayahXI81', 'ibuXI81', NULL, NULL, NULL, NULL, 'Aktif'),
(345, 'ayahXI82', 'ibuXI82', NULL, NULL, NULL, NULL, 'Aktif'),
(346, 'ayahXI83', 'ibuXI83', NULL, NULL, NULL, NULL, 'Aktif'),
(347, 'ayahXI84', 'ibuXI84', NULL, NULL, NULL, NULL, 'Aktif'),
(348, 'ayahXI85', 'ibuXI85', NULL, NULL, NULL, NULL, 'Aktif'),
(349, 'ayahXI86', 'ibuXI86', NULL, NULL, NULL, NULL, 'Aktif'),
(350, 'ayahXI87', 'ibuXI87', NULL, NULL, NULL, NULL, 'Aktif'),
(351, 'ayahXI88', 'ibuXI88', NULL, NULL, NULL, NULL, 'Aktif'),
(352, 'ayahXI89', 'ibuXI89', NULL, NULL, NULL, NULL, 'Aktif'),
(353, 'ayahXI90', 'ibuXI90', NULL, NULL, NULL, NULL, 'Aktif'),
(354, 'ayahXI91', 'ibuXI91', NULL, NULL, NULL, NULL, 'Aktif'),
(355, 'ayahXI92', 'ibuXI92', NULL, NULL, NULL, NULL, 'Aktif'),
(356, 'ayahXI93', 'ibuXI93', NULL, NULL, NULL, NULL, 'Aktif'),
(357, 'ayahXI94', 'ibuXI94', NULL, NULL, NULL, NULL, 'Aktif'),
(358, 'ayahXI95', 'ibuXI95', NULL, NULL, NULL, NULL, 'Aktif'),
(359, 'ayahXI96', 'ibuXI96', NULL, NULL, NULL, NULL, 'Aktif'),
(360, 'ayahXI97', 'ibuXI97', NULL, NULL, NULL, NULL, 'Aktif'),
(361, 'ayahXI98', 'ibuXI98', NULL, NULL, NULL, NULL, 'Aktif'),
(362, 'ayahXI99', 'ibuXI99', NULL, NULL, NULL, NULL, 'Aktif'),
(363, 'ayahXI100', 'ibuXI100', NULL, NULL, NULL, NULL, 'Aktif'),
(364, 'ayahXI2', 'ibuXI2', NULL, NULL, NULL, NULL, 'Aktif'),
(365, 'ayahXI3', 'ibuXI3', NULL, NULL, NULL, NULL, 'Aktif'),
(366, 'ayahXI4', 'ibuXI4', NULL, NULL, NULL, NULL, 'Aktif'),
(367, 'ayahXI5', 'ibuXI5', NULL, NULL, NULL, NULL, 'Aktif'),
(368, 'ayahXI6', 'ibuXI6', NULL, NULL, NULL, NULL, 'Aktif'),
(369, 'ayahXI7', 'ibuXI7', NULL, NULL, NULL, NULL, 'Aktif'),
(370, 'ayahXI8', 'ibuXI8', NULL, NULL, NULL, NULL, 'Aktif'),
(371, 'ayahXI9', 'ibuXI9', NULL, NULL, NULL, NULL, 'Aktif'),
(372, 'ayahXI10', 'ibuXI10', NULL, NULL, NULL, NULL, 'Aktif'),
(373, 'ayahXI11', 'ibuXI11', NULL, NULL, NULL, NULL, 'Aktif'),
(374, 'ayahXI12', 'ibuXI12', NULL, NULL, NULL, NULL, 'Aktif'),
(375, 'ayahXI13', 'ibuXI13', NULL, NULL, NULL, NULL, 'Aktif'),
(376, 'ayahXI14', 'ibuXI14', NULL, NULL, NULL, NULL, 'Aktif'),
(377, 'ayahXI15', 'ibuXI15', NULL, NULL, NULL, NULL, 'Aktif'),
(378, 'ayahXI16', 'ibuXI16', NULL, NULL, NULL, NULL, 'Aktif'),
(379, 'ayahXI17', 'ibuXI17', NULL, NULL, NULL, NULL, 'Aktif'),
(380, 'ayahXI18', 'ibuXI18', NULL, NULL, NULL, NULL, 'Aktif'),
(381, 'ayahXI19', 'ibuXI19', NULL, NULL, NULL, NULL, 'Aktif'),
(382, 'ayahXI20', 'ibuXI20', NULL, NULL, NULL, NULL, 'Aktif'),
(383, 'ayahXI21', 'ibuXI21', NULL, NULL, NULL, NULL, 'Aktif'),
(384, 'ayahXI22', 'ibuXI22', NULL, NULL, NULL, NULL, 'Aktif'),
(385, 'ayahXI23', 'ibuXI23', NULL, NULL, NULL, NULL, 'Aktif'),
(386, 'ayahXI24', 'ibuXI24', NULL, NULL, NULL, NULL, 'Aktif'),
(387, 'ayahXI25', 'ibuXI25', NULL, NULL, NULL, NULL, 'Aktif'),
(388, 'ayahXI26', 'ibuXI26', NULL, NULL, NULL, NULL, 'Aktif'),
(389, 'ayahXI27', 'ibuXI27', NULL, NULL, NULL, NULL, 'Aktif'),
(390, 'ayahXI28', 'ibuXI28', NULL, NULL, NULL, NULL, 'Aktif'),
(391, 'ayahXI29', 'ibuXI29', NULL, NULL, NULL, NULL, 'Aktif'),
(392, 'ayahXI30', 'ibuXI30', NULL, NULL, NULL, NULL, 'Aktif'),
(393, 'ayahXI31', 'ibuXI31', NULL, NULL, NULL, NULL, 'Aktif'),
(394, 'ayahXI32', 'ibuXI32', NULL, NULL, NULL, NULL, 'Aktif'),
(395, 'ayahXI33', 'ibuXI33', NULL, NULL, NULL, NULL, 'Aktif'),
(396, 'ayahXI34', 'ibuXI34', NULL, NULL, NULL, NULL, 'Aktif'),
(397, 'ayahXI35', 'ibuXI35', NULL, NULL, NULL, NULL, 'Aktif'),
(398, 'ayahXI36', 'ibuXI36', NULL, NULL, NULL, NULL, 'Aktif'),
(399, 'ayahXI37', 'ibuXI37', NULL, NULL, NULL, NULL, 'Aktif'),
(400, 'ayahXI38', 'ibuXI38', NULL, NULL, NULL, NULL, 'Aktif'),
(401, 'ayahXI39', 'ibuXI39', NULL, NULL, NULL, NULL, 'Aktif'),
(402, 'ayahXI40', 'ibuXI40', NULL, NULL, NULL, NULL, 'Aktif'),
(403, 'ayahXI41', 'ibuXI41', NULL, NULL, NULL, NULL, 'Aktif'),
(404, 'ayahXI42', 'ibuXI42', NULL, NULL, NULL, NULL, 'Aktif'),
(405, 'ayahXI43', 'ibuXI43', NULL, NULL, NULL, NULL, 'Aktif'),
(406, 'ayahXI44', 'ibuXI44', NULL, NULL, NULL, NULL, 'Aktif'),
(407, 'ayahXI45', 'ibuXI45', NULL, NULL, NULL, NULL, 'Aktif'),
(408, 'ayahXI46', 'ibuXI46', NULL, NULL, NULL, NULL, 'Aktif'),
(409, 'ayahXI47', 'ibuXI47', NULL, NULL, NULL, NULL, 'Aktif'),
(410, 'ayahXI48', 'ibuXI48', NULL, NULL, NULL, NULL, 'Aktif'),
(411, 'ayahXI49', 'ibuXI49', NULL, NULL, NULL, NULL, 'Aktif'),
(412, 'ayahXI50', 'ibuXI50', NULL, NULL, NULL, NULL, 'Aktif'),
(413, 'ayahXI51', 'ibuXI51', NULL, NULL, NULL, NULL, 'Aktif'),
(414, 'ayahXI52', 'ibuXI52', NULL, NULL, NULL, NULL, 'Aktif'),
(415, 'ayahXI53', 'ibuXI53', NULL, NULL, NULL, NULL, 'Aktif'),
(416, 'ayahXI54', 'ibuXI54', NULL, NULL, NULL, NULL, 'Aktif'),
(417, 'ayahXI55', 'ibuXI55', NULL, NULL, NULL, NULL, 'Aktif'),
(418, 'ayahXI56', 'ibuXI56', NULL, NULL, NULL, NULL, 'Aktif'),
(419, 'ayahXI57', 'ibuXI57', NULL, NULL, NULL, NULL, 'Aktif'),
(420, 'ayahXI58', 'ibuXI58', NULL, NULL, NULL, NULL, 'Aktif'),
(421, 'ayahXI59', 'ibuXI59', NULL, NULL, NULL, NULL, 'Aktif'),
(422, 'ayahXI60', 'ibuXI60', NULL, NULL, NULL, NULL, 'Aktif'),
(423, 'ayahXI61', 'ibuXI61', NULL, NULL, NULL, NULL, 'Aktif'),
(424, 'ayahXI62', 'ibuXI62', NULL, NULL, NULL, NULL, 'Aktif'),
(425, 'ayahXI63', 'ibuXI63', NULL, NULL, NULL, NULL, 'Aktif'),
(426, 'ayahXI64', 'ibuXI64', NULL, NULL, NULL, NULL, 'Aktif'),
(427, 'ayahXI65', 'ibuXI65', NULL, NULL, NULL, NULL, 'Aktif'),
(428, 'ayahXI66', 'ibuXI66', NULL, NULL, NULL, NULL, 'Aktif'),
(429, 'ayahXI67', 'ibuXI67', NULL, NULL, NULL, NULL, 'Aktif'),
(430, 'ayahXI68', 'ibuXI68', NULL, NULL, NULL, NULL, 'Aktif'),
(431, 'ayahXI69', 'ibuXI69', NULL, NULL, NULL, NULL, 'Aktif'),
(432, 'ayahXI70', 'ibuXI70', NULL, NULL, NULL, NULL, 'Aktif'),
(433, 'ayahXI71', 'ibuXI71', NULL, NULL, NULL, NULL, 'Aktif'),
(434, 'ayahXI72', 'ibuXI72', NULL, NULL, NULL, NULL, 'Aktif'),
(435, 'ayahXI73', 'ibuXI73', NULL, NULL, NULL, NULL, 'Aktif'),
(436, 'ayahXI74', 'ibuXI74', NULL, NULL, NULL, NULL, 'Aktif'),
(437, 'ayahXI75', 'ibuXI75', NULL, NULL, NULL, NULL, 'Aktif'),
(438, 'ayahXI76', 'ibuXI76', NULL, NULL, NULL, NULL, 'Aktif'),
(439, 'ayahXI77', 'ibuXI77', NULL, NULL, NULL, NULL, 'Aktif'),
(440, 'ayahXI78', 'ibuXI78', NULL, NULL, NULL, NULL, 'Aktif'),
(441, 'ayahXI79', 'ibuXI79', NULL, NULL, NULL, NULL, 'Aktif'),
(442, 'ayahXI80', 'ibuXI80', NULL, NULL, NULL, NULL, 'Aktif'),
(443, 'ayahXI81', 'ibuXI81', NULL, NULL, NULL, NULL, 'Aktif'),
(444, 'ayahXI82', 'ibuXI82', NULL, NULL, NULL, NULL, 'Aktif'),
(445, 'ayahXI83', 'ibuXI83', NULL, NULL, NULL, NULL, 'Aktif'),
(446, 'ayahXI84', 'ibuXI84', NULL, NULL, NULL, NULL, 'Aktif'),
(447, 'ayahXI85', 'ibuXI85', NULL, NULL, NULL, NULL, 'Aktif'),
(448, 'ayahXI86', 'ibuXI86', NULL, NULL, NULL, NULL, 'Aktif'),
(449, 'ayahXI87', 'ibuXI87', NULL, NULL, NULL, NULL, 'Aktif'),
(450, 'ayahXI88', 'ibuXI88', NULL, NULL, NULL, NULL, 'Aktif'),
(451, 'ayahXI89', 'ibuXI89', NULL, NULL, NULL, NULL, 'Aktif'),
(452, 'ayahXI90', 'ibuXI90', NULL, NULL, NULL, NULL, 'Aktif'),
(453, 'ayahXI91', 'ibuXI91', NULL, NULL, NULL, NULL, 'Aktif'),
(454, 'ayahXI92', 'ibuXI92', NULL, NULL, NULL, NULL, 'Aktif'),
(455, 'ayahXI93', 'ibuXI93', NULL, NULL, NULL, NULL, 'Aktif'),
(456, 'ayahXI94', 'ibuXI94', NULL, NULL, NULL, NULL, 'Aktif'),
(457, 'ayahXI95', 'ibuXI95', NULL, NULL, NULL, NULL, 'Aktif'),
(458, 'ayahXI96', 'ibuXI96', NULL, NULL, NULL, NULL, 'Aktif'),
(459, 'ayahXI97', 'ibuXI97', NULL, NULL, NULL, NULL, 'Aktif'),
(460, 'ayahXI98', 'ibuXI98', NULL, NULL, NULL, NULL, 'Aktif'),
(461, 'ayahXI99', 'ibuXI99', NULL, NULL, NULL, NULL, 'Aktif'),
(462, 'ayahXI100', 'ibuXI100', NULL, NULL, NULL, NULL, 'Aktif'),
(463, 'ayah60', 'ibu60', NULL, NULL, NULL, NULL, 'Aktif'),
(464, 'ayah61', 'ibu61', NULL, NULL, NULL, NULL, 'Aktif'),
(465, 'ayah62', 'ibu62', NULL, NULL, NULL, NULL, 'Aktif'),
(466, 'ayah63', 'ibu63', NULL, NULL, NULL, NULL, 'Aktif'),
(467, 'ayah64', 'ibu64', NULL, NULL, NULL, NULL, 'Aktif'),
(468, 'ayah65', 'ibu65', NULL, NULL, NULL, NULL, 'Aktif'),
(469, 'ayah66', 'ibu66', NULL, NULL, NULL, NULL, 'Aktif'),
(470, 'ayah67', 'ibu67', NULL, NULL, NULL, NULL, 'Aktif'),
(471, 'ayah68', 'ibu68', NULL, NULL, NULL, NULL, 'Aktif'),
(472, 'ayah69', 'ibu69', NULL, NULL, NULL, NULL, 'Aktif'),
(473, 'ayah70', 'ibu70', NULL, NULL, NULL, NULL, 'Aktif'),
(474, 'ayah71', 'ibu71', NULL, NULL, NULL, NULL, 'Aktif'),
(475, 'ayah72', 'ibu72', NULL, NULL, NULL, NULL, 'Aktif'),
(476, 'ayah73', 'ibu73', NULL, NULL, NULL, NULL, 'Aktif'),
(477, 'ayah74', 'ibu74', NULL, NULL, NULL, NULL, 'Aktif'),
(478, 'ayah75', 'ibu75', NULL, NULL, NULL, NULL, 'Aktif'),
(479, 'ayah76', 'ibu76', NULL, NULL, NULL, NULL, 'Aktif'),
(480, 'ayah77', 'ibu77', NULL, NULL, NULL, NULL, 'Aktif'),
(481, 'ayah78', 'ibu78', NULL, NULL, NULL, NULL, 'Aktif'),
(482, 'ayah79', 'ibu79', NULL, NULL, NULL, NULL, 'Aktif'),
(483, 'ayah80', 'ibu80', NULL, NULL, NULL, NULL, 'Aktif'),
(484, 'ayah81', 'ibu81', NULL, NULL, NULL, NULL, 'Aktif'),
(485, 'ayah82', 'ibu82', NULL, NULL, NULL, NULL, 'Aktif'),
(486, 'ayah83', 'ibu83', NULL, NULL, NULL, NULL, 'Aktif'),
(487, 'ayah84', 'ibu84', NULL, NULL, NULL, NULL, 'Aktif'),
(488, 'ayah85', 'ibu85', NULL, NULL, NULL, NULL, 'Aktif'),
(489, 'ayah86', 'ibu86', NULL, NULL, NULL, NULL, 'Aktif'),
(490, 'ayah87', 'ibu87', NULL, NULL, NULL, NULL, 'Aktif'),
(491, 'ayahXI3', 'ibuXI3', NULL, NULL, NULL, NULL, 'Aktif'),
(492, 'ayahXI4', 'ibuXI4', NULL, NULL, NULL, NULL, 'Aktif'),
(493, 'ayahXI5', 'ibuXI5', NULL, NULL, NULL, NULL, 'Aktif'),
(494, 'ayahXI6', 'ibuXI6', NULL, NULL, NULL, NULL, 'Aktif'),
(495, 'ayahXI7', 'ibuXI7', NULL, NULL, NULL, NULL, 'Aktif'),
(496, 'ayahXI8', 'ibuXI8', NULL, NULL, NULL, NULL, 'Aktif'),
(497, 'ayahXI9', 'ibuXI9', NULL, NULL, NULL, NULL, 'Aktif'),
(498, 'ayahXI10', 'ibuXI10', NULL, NULL, NULL, NULL, 'Aktif'),
(499, 'ayahXI11', 'ibuXI11', NULL, NULL, NULL, NULL, 'Aktif'),
(500, 'ayahXI12', 'ibuXI12', NULL, NULL, NULL, NULL, 'Aktif'),
(501, 'ayahXI13', 'ibuXI13', NULL, NULL, NULL, NULL, 'Aktif'),
(502, 'ayahXI14', 'ibuXI14', NULL, NULL, NULL, NULL, 'Aktif'),
(503, 'ayahXI15', 'ibuXI15', NULL, NULL, NULL, NULL, 'Aktif'),
(504, 'ayahXI16', 'ibuXI16', NULL, NULL, NULL, NULL, 'Aktif'),
(505, 'ayahXI17', 'ibuXI17', NULL, NULL, NULL, NULL, 'Aktif'),
(506, 'ayahXI18', 'ibuXI18', NULL, NULL, NULL, NULL, 'Aktif'),
(507, 'ayahXI19', 'ibuXI19', NULL, NULL, NULL, NULL, 'Aktif'),
(508, 'ayahXI20', 'ibuXI20', NULL, NULL, NULL, NULL, 'Aktif'),
(509, 'ayahXI21', 'ibuXI21', NULL, NULL, NULL, NULL, 'Aktif'),
(510, 'ayahXI22', 'ibuXI22', NULL, NULL, NULL, NULL, 'Aktif'),
(511, 'ayahXI23', 'ibuXI23', NULL, NULL, NULL, NULL, 'Aktif'),
(512, 'ayahXI24', 'ibuXI24', NULL, NULL, NULL, NULL, 'Aktif'),
(513, 'ayahXI25', 'ibuXI25', NULL, NULL, NULL, NULL, 'Aktif'),
(514, 'ayahXI26', 'ibuXI26', NULL, NULL, NULL, NULL, 'Aktif'),
(515, 'ayahXI27', 'ibuXI27', NULL, NULL, NULL, NULL, 'Aktif'),
(516, 'ayahXI28', 'ibuXI28', NULL, NULL, NULL, NULL, 'Aktif'),
(517, 'ayahXI29', 'ibuXI29', NULL, NULL, NULL, NULL, 'Aktif'),
(518, 'ayahXI30', 'ibuXI30', NULL, NULL, NULL, NULL, 'Aktif'),
(519, 'ayahXI31', 'ibuXI31', NULL, NULL, NULL, NULL, 'Aktif'),
(520, 'ayahXI32', 'ibuXI32', NULL, NULL, NULL, NULL, 'Aktif'),
(521, 'ayahXI33', 'ibuXI33', NULL, NULL, NULL, NULL, 'Aktif'),
(522, 'ayahXI34', 'ibuXI34', NULL, NULL, NULL, NULL, 'Aktif'),
(523, 'ayahXI35', 'ibuXI35', NULL, NULL, NULL, NULL, 'Aktif'),
(524, 'ayahXI36', 'ibuXI36', NULL, NULL, NULL, NULL, 'Aktif'),
(525, 'ayahXI37', 'ibuXI37', NULL, NULL, NULL, NULL, 'Aktif'),
(526, 'ayahXI38', 'ibuXI38', NULL, NULL, NULL, NULL, 'Aktif'),
(527, 'ayahXI39', 'ibuXI39', NULL, NULL, NULL, NULL, 'Aktif'),
(528, 'ayahXI40', 'ibuXI40', NULL, NULL, NULL, NULL, 'Aktif'),
(529, 'ayahXI41', 'ibuXI41', NULL, NULL, NULL, NULL, 'Aktif'),
(530, 'ayahXI42', 'ibuXI42', NULL, NULL, NULL, NULL, 'Aktif'),
(531, 'ayahXI43', 'ibuXI43', NULL, NULL, NULL, NULL, 'Aktif'),
(532, 'ayahXI44', 'ibuXI44', NULL, NULL, NULL, NULL, 'Aktif'),
(533, 'ayahXI45', 'ibuXI45', NULL, NULL, NULL, NULL, 'Aktif'),
(534, 'ayahXI46', 'ibuXI46', NULL, NULL, NULL, NULL, 'Aktif'),
(535, 'ayahXI47', 'ibuXI47', NULL, NULL, NULL, NULL, 'Aktif'),
(536, 'ayahXI48', 'ibuXI48', NULL, NULL, NULL, NULL, 'Aktif'),
(537, 'ayahXI49', 'ibuXI49', NULL, NULL, NULL, NULL, 'Aktif'),
(538, 'ayahXI50', 'ibuXI50', NULL, NULL, NULL, NULL, 'Aktif'),
(539, 'ayahXI51', 'ibuXI51', NULL, NULL, NULL, NULL, 'Aktif'),
(540, 'ayahXI52', 'ibuXI52', NULL, NULL, NULL, NULL, 'Aktif'),
(541, 'ayahXI53', 'ibuXI53', NULL, NULL, NULL, NULL, 'Aktif'),
(542, 'ayahXI54', 'ibuXI54', NULL, NULL, NULL, NULL, 'Aktif'),
(543, 'ayahXI55', 'ibuXI55', NULL, NULL, NULL, NULL, 'Aktif'),
(544, 'ayahXI56', 'ibuXI56', NULL, NULL, NULL, NULL, 'Aktif'),
(545, 'ayahXI57', 'ibuXI57', NULL, NULL, NULL, NULL, 'Aktif'),
(546, 'ayahXI58', 'ibuXI58', NULL, NULL, NULL, NULL, 'Aktif'),
(547, 'ayahXI59', 'ibuXI59', NULL, NULL, NULL, NULL, 'Aktif'),
(548, 'ayahXI60', 'ibuXI60', NULL, NULL, NULL, NULL, 'Aktif'),
(549, 'ayahXI61', 'ibuXI61', NULL, NULL, NULL, NULL, 'Aktif'),
(550, 'ayahXI62', 'ibuXI62', NULL, NULL, NULL, NULL, 'Aktif'),
(551, 'ayahXI63', 'ibuXI63', NULL, NULL, NULL, NULL, 'Aktif'),
(552, 'ayahXI64', 'ibuXI64', NULL, NULL, NULL, NULL, 'Aktif'),
(553, 'ayahXI65', 'ibuXI65', NULL, NULL, NULL, NULL, 'Aktif'),
(554, 'ayahXI66', 'ibuXI66', NULL, NULL, NULL, NULL, 'Aktif'),
(555, 'ayahXI67', 'ibuXI67', NULL, NULL, NULL, NULL, 'Aktif'),
(556, 'ayahXI68', 'ibuXI68', NULL, NULL, NULL, NULL, 'Aktif'),
(557, 'ayahXI69', 'ibuXI69', NULL, NULL, NULL, NULL, 'Aktif'),
(558, 'ayahXI70', 'ibuXI70', NULL, NULL, NULL, NULL, 'Aktif'),
(559, 'ayahXI71', 'ibuXI71', NULL, NULL, NULL, NULL, 'Aktif'),
(560, 'ayahXI72', 'ibuXI72', NULL, NULL, NULL, NULL, 'Aktif'),
(561, 'ayahXI73', 'ibuXI73', NULL, NULL, NULL, NULL, 'Aktif'),
(562, 'ayahXI74', 'ibuXI74', NULL, NULL, NULL, NULL, 'Aktif'),
(563, 'ayahXI75', 'ibuXI75', NULL, NULL, NULL, NULL, 'Aktif'),
(564, 'ayahXI76', 'ibuXI76', NULL, NULL, NULL, NULL, 'Aktif'),
(565, 'ayahXI77', 'ibuXI77', NULL, NULL, NULL, NULL, 'Aktif'),
(566, 'ayahXI78', 'ibuXI78', NULL, NULL, NULL, NULL, 'Aktif'),
(567, 'ayahXI79', 'ibuXI79', NULL, NULL, NULL, NULL, 'Aktif'),
(568, 'ayahXI80', 'ibuXI80', NULL, NULL, NULL, NULL, 'Aktif'),
(569, 'ayahXI81', 'ibuXI81', NULL, NULL, NULL, NULL, 'Aktif'),
(570, 'ayahXI82', 'ibuXI82', NULL, NULL, NULL, NULL, 'Aktif'),
(571, 'ayahXI83', 'ibuXI83', NULL, NULL, NULL, NULL, 'Aktif'),
(572, 'ayahXI84', 'ibuXI84', NULL, NULL, NULL, NULL, 'Aktif'),
(573, 'ayahXI85', 'ibuXI85', NULL, NULL, NULL, NULL, 'Aktif'),
(574, 'ayahXI86', 'ibuXI86', NULL, NULL, NULL, NULL, 'Aktif'),
(575, 'ayahXI87', 'ibuXI87', NULL, NULL, NULL, NULL, 'Aktif'),
(576, 'ayahXI88', 'ibuXI88', NULL, NULL, NULL, NULL, 'Aktif'),
(577, 'ayahXI89', 'ibuXI89', NULL, NULL, NULL, NULL, 'Aktif'),
(578, 'ayahXI90', 'ibuXI90', NULL, NULL, NULL, NULL, 'Aktif'),
(579, 'ayahXI91', 'ibuXI91', NULL, NULL, NULL, NULL, 'Aktif'),
(580, 'ayahXI92', 'ibuXI92', NULL, NULL, NULL, NULL, 'Aktif'),
(581, 'ayahXI93', 'ibuXI93', NULL, NULL, NULL, NULL, 'Aktif'),
(582, 'ayahXI94', 'ibuXI94', NULL, NULL, NULL, NULL, 'Aktif'),
(583, 'ayahXI95', 'ibuXI95', NULL, NULL, NULL, NULL, 'Aktif'),
(584, 'ayahXI96', 'ibuXI96', NULL, NULL, NULL, NULL, 'Aktif'),
(585, 'ayahXI97', 'ibuXI97', NULL, NULL, NULL, NULL, 'Aktif'),
(586, 'ayahXI98', 'ibuXI98', NULL, NULL, NULL, NULL, 'Aktif'),
(587, 'ayahXI99', 'ibuXI99', NULL, NULL, NULL, NULL, 'Aktif'),
(588, 'ayahXI100', 'ibuXI100', NULL, NULL, NULL, NULL, 'Aktif');

-- --------------------------------------------------------

--
-- Struktur dari tabel `pelanggaran`
--

CREATE TABLE `pelanggaran` (
  `id_pelanggaran` int(11) NOT NULL COMMENT 'ID pelanggaran',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `tanggal_pelanggaran` date NOT NULL COMMENT 'Tanggal pelanggaran',
  `jenis_pelanggaran` enum('Kaos_Kaki_Pendek','Terlambat','Salah_Seragam','Salah_Sepatu','Other') NOT NULL COMMENT 'Jenis pelanggaran',
  `deskripsi_custom` varchar(200) DEFAULT NULL COMMENT 'Deskripsi custom untuk jenis Other',
  `deskripsi_pelanggaran` text NOT NULL COMMENT 'Deskripsi pelanggaran',
  `poin_pelanggaran` int(11) NOT NULL COMMENT 'Poin pelanggaran',
  `status` enum('Active','Resolved') DEFAULT 'Active' COMMENT 'Status pelanggaran',
  `nik_guru_input` varchar(20) NOT NULL COMMENT 'NIK guru penginput'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel pelanggaran siswa';

-- --------------------------------------------------------

--
-- Struktur dari tabel `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id_pembayaran` int(11) NOT NULL COMMENT 'ID pembayaran',
  `id_tagihan` int(11) NOT NULL COMMENT 'ID tagihan',
  `tanggal_bayar` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Tanggal bayar',
  `jumlah_bayar` decimal(10,2) NOT NULL COMMENT 'Jumlah bayar',
  `metode_pembayaran` enum('Tunai','Transfer','Kartu','E-wallet') NOT NULL COMMENT 'Metode pembayaran',
  `status_pembayaran` enum('Pending','Success','Failed') DEFAULT 'Pending' COMMENT 'Status pembayaran',
  `no_referensi` varchar(100) DEFAULT NULL COMMENT 'Nomor referensi',
  `id_user_petugas` varchar(20) NOT NULL COMMENT 'ID user petugas',
  `bukti_pembayaran` varchar(255) DEFAULT NULL COMMENT 'Bukti pembayaran',
  `keterangan_cicilan` text DEFAULT NULL COMMENT 'Keterangan cicilan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel pembayaran';

-- --------------------------------------------------------

--
-- Struktur dari tabel `pengumpulan_tugas`
--

CREATE TABLE `pengumpulan_tugas` (
  `id_pengumpulan` int(11) NOT NULL COMMENT 'ID pengumpulan',
  `id_tugas` int(11) NOT NULL COMMENT 'ID tugas',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `tanggal_submit` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Tanggal submit',
  `file_jawaban` varchar(255) NOT NULL COMMENT 'File jawaban',
  `keterangan_siswa` text DEFAULT NULL,
  `status` enum('Draft','Final') DEFAULT 'Draft' COMMENT 'Status pengumpulan',
  `nilai` int(11) DEFAULT NULL COMMENT 'Nilai tugas',
  `feedback_guru` text DEFAULT NULL COMMENT 'Feedback dari guru'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel pengumpulan tugas siswa';

-- --------------------------------------------------------

--
-- Struktur dari tabel `pengumuman`
--

CREATE TABLE `pengumuman` (
  `id_pengumuman` int(11) NOT NULL COMMENT 'ID pengumuman',
  `judul_pengumuman` varchar(200) NOT NULL COMMENT 'Judul pengumuman',
  `isi_pengumuman` text NOT NULL COMMENT 'Isi pengumuman',
  `tanggal_posting` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Tanggal posting',
  `tanggal_berakhir` timestamp NULL DEFAULT NULL COMMENT 'Tanggal berakhir',
  `target_type` enum('Semua','Siswa_Spesifik','Guru_Spesifik','Kelas_Spesifik','Jurusan_Spesifik') NOT NULL COMMENT 'Tipe target',
  `id_user_pembuat` varchar(20) NOT NULL COMMENT 'ID user pembuat',
  `status` enum('Draft','Published','Archived') DEFAULT 'Draft' COMMENT 'Status pengumuman',
  `file_lampiran` varchar(255) DEFAULT NULL COMMENT 'File lampiran',
  `priority` enum('Normal','Penting','Urgent') DEFAULT 'Normal' COMMENT 'Prioritas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel pengumuman';

-- --------------------------------------------------------

--
-- Struktur dari tabel `pengumuman_target`
--

CREATE TABLE `pengumuman_target` (
  `id_target` int(11) NOT NULL COMMENT 'ID target',
  `id_pengumuman` int(11) NOT NULL COMMENT 'ID pengumuman',
  `target_type` enum('Siswa','Guru','Kelas','Jurusan') NOT NULL COMMENT 'Tipe target',
  `target_id` varchar(20) NOT NULL COMMENT 'ID target'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel target pengumuman';

-- --------------------------------------------------------

--
-- Struktur dari tabel `permission_overrides`
--

CREATE TABLE `permission_overrides` (
  `id_override` bigint(20) UNSIGNED NOT NULL,
  `target_type` varchar(255) NOT NULL,
  `target_id` varchar(255) NOT NULL,
  `resource_key` varchar(255) NOT NULL,
  `view` tinyint(1) NOT NULL DEFAULT 0,
  `create` tinyint(1) NOT NULL DEFAULT 0,
  `edit` tinyint(1) NOT NULL DEFAULT 0,
  `delete` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data untuk tabel `permission_overrides`
--

INSERT INTO `permission_overrides` (`id_override`, `target_type`, `target_id`, `resource_key`, `view`, `create`, `edit`, `delete`) VALUES
(1, 'role', 'Kepala_Sekolah', 'data_master', 0, 0, 0, 0),
(2, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(3, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(4, 'role', 'Kepala_Sekolah', 'data_master.kelas', 0, 0, 0, 0),
(5, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(6, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(7, 'role', 'Kepala_Sekolah', 'data_master', 0, 0, 0, 0),
(8, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(9, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(10, 'role', 'Kepala_Sekolah', 'data_master.kelas', 0, 0, 0, 0),
(11, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(12, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(13, 'role', 'Kepala_Sekolah', 'data_master', 0, 0, 0, 0),
(14, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(15, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(16, 'role', 'Kepala_Sekolah', 'data_master.kelas', 0, 0, 0, 0),
(17, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(18, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(19, 'role', 'Kepala_Sekolah', 'data_master', 0, 0, 0, 0),
(20, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(21, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(22, 'role', 'Kepala_Sekolah', 'data_master.kelas', 0, 0, 0, 0),
(23, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(24, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(25, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(26, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(27, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(28, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(29, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(30, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(31, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(32, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(33, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(34, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(35, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(36, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(37, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(38, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(39, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(40, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(41, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(42, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(43, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(44, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(45, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(46, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(47, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(48, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(49, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(50, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(51, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(52, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(53, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(54, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(55, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(56, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(57, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(58, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(59, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(60, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(62, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(63, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(64, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(65, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(66, 'role', 'Kepala_Sekolah', 'data_master', 1, 1, 0, 0),
(67, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(68, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(69, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(70, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(72, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(73, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(74, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(75, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(78, 'role', 'Kepala_Sekolah', 'data_master.tahun_ajaran', 0, 0, 0, 0),
(79, 'role', 'Kepala_Sekolah', 'data_master.jurusan', 0, 0, 0, 0),
(80, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(81, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(86, 'role', 'Kepala_Sekolah', 'data_master.mata_pelajaran', 0, 0, 0, 0),
(87, 'role', 'Kepala_Sekolah', 'data_master.kurikulum', 0, 0, 0, 0),
(89, 'role', 'Admin', 'settings.permissions', 0, 0, 0, 0),
(90, 'role', 'Siswa', 'manajemen_data.data_siswa', 1, 0, 0, 0);

-- --------------------------------------------------------

--
-- Struktur dari tabel `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `petugas_keuangan`
--

CREATE TABLE `petugas_keuangan` (
  `id_petugas_keuangan` int(11) NOT NULL COMMENT 'ID petugas keuangan',
  `nama` varchar(100) NOT NULL COMMENT 'Nama petugas keuangan',
  `nip` varchar(20) DEFAULT NULL COMMENT 'NIP petugas keuangan',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data petugas keuangan';

--
-- Dumping data untuk tabel `petugas_keuangan`
--

INSERT INTO `petugas_keuangan` (`id_petugas_keuangan`, `nama`, `nip`, `status`) VALUES
(1, 'Siti Nurhalimah, S.E', '197505152005012001', 'Aktif'),
(2, 'Ahmad Budiman, S.Pd', '198203102010011002', 'Aktif');

-- --------------------------------------------------------

--
-- Struktur dari tabel `presensi_harian`
--

CREATE TABLE `presensi_harian` (
  `id_presensi_harian` int(11) NOT NULL COMMENT 'ID presensi harian',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `tanggal` date NOT NULL COMMENT 'Tanggal presensi',
  `jam_masuk` time DEFAULT NULL COMMENT 'Jam masuk',
  `status` enum('Hadir','Tidak_Hadir') NOT NULL COMMENT 'Status kehadiran',
  `metode_presensi` enum('RFID','Barcode','Fingerprint') NOT NULL COMMENT 'Metode presensi'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel presensi harian siswa';

-- --------------------------------------------------------

--
-- Struktur dari tabel `presensi_mapel`
--

CREATE TABLE `presensi_mapel` (
  `id_presensi_mapel` int(11) NOT NULL COMMENT 'ID presensi mapel',
  `id_jurnal` int(11) NOT NULL COMMENT 'ID jurnal mengajar',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa (hanya yang tidak hadir)',
  `status_ketidakhadiran` enum('Sakit','Izin','Alpa') NOT NULL COMMENT 'Status ketidakhadiran',
  `keterangan` text DEFAULT NULL COMMENT 'Keterangan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel presensi mata pelajaran';

-- --------------------------------------------------------

--
-- Struktur dari tabel `rapot`
--

CREATE TABLE `rapot` (
  `id_rapot` int(11) NOT NULL COMMENT 'ID rapot',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `semester` enum('1','2') NOT NULL COMMENT 'Semester',
  `fase` enum('E','F') NOT NULL COMMENT 'Fase',
  `status_rapot` enum('Draft','Final','Published') DEFAULT 'Draft' COMMENT 'Status rapot'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel rapot siswa';

-- --------------------------------------------------------

--
-- Struktur dari tabel `rapot_adab_detail`
--

CREATE TABLE `rapot_adab_detail` (
  `id_rapot_adab` int(11) NOT NULL COMMENT 'ID rapot adab',
  `id_rapot_att` int(11) NOT NULL COMMENT 'ID rapot ATT',
  `komponen_adab` enum('Adab_Kepada_Allah','Adab_Kepada_Rosul','Adab_Belajar') NOT NULL COMMENT 'Komponen adab',
  `nilai` varchar(10) NOT NULL COMMENT 'Nilai adab',
  `deskripsi` text DEFAULT NULL COMMENT 'Deskripsi'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel detail adab rapot ATT';

-- --------------------------------------------------------

--
-- Struktur dari tabel `rapot_att`
--

CREATE TABLE `rapot_att` (
  `id_rapot_att` int(11) NOT NULL COMMENT 'ID rapot ATT',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `semester` enum('1','2','3','4') NOT NULL COMMENT 'Semester',
  `term` enum('Satu','Dua','Tiga','Empat') NOT NULL COMMENT 'Term',
  `status` enum('Draft','Final','Published') DEFAULT 'Draft' COMMENT 'Status rapot ATT'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel rapot ATT';

-- --------------------------------------------------------

--
-- Struktur dari tabel `rapot_catatan`
--

CREATE TABLE `rapot_catatan` (
  `id_rapot_catatan` int(11) NOT NULL COMMENT 'ID rapot catatan',
  `id_rapot` int(11) NOT NULL COMMENT 'ID rapot',
  `catatan_wali_kelas` text NOT NULL COMMENT 'Catatan wali kelas',
  `keterangan_kenaikan_kelas` varchar(100) NOT NULL COMMENT 'Keterangan kenaikan kelas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel catatan rapot';

-- --------------------------------------------------------

--
-- Struktur dari tabel `rapot_ekstrakurikuler`
--

CREATE TABLE `rapot_ekstrakurikuler` (
  `id_rapot_ekskul` int(11) NOT NULL COMMENT 'ID rapot ekstrakurikuler',
  `id_rapot` int(11) NOT NULL COMMENT 'ID rapot',
  `nama_ekstrakurikuler` varchar(100) NOT NULL COMMENT 'Nama ekstrakurikuler',
  `predikat` enum('Sangat_Baik','Baik','Cukup') NOT NULL COMMENT 'Predikat',
  `keterangan` text DEFAULT NULL COMMENT 'Keterangan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel ekstrakurikuler rapot';

-- --------------------------------------------------------

--
-- Struktur dari tabel `rapot_kehadiran`
--

CREATE TABLE `rapot_kehadiran` (
  `id_rapot_kehadiran` int(11) NOT NULL COMMENT 'ID rapot kehadiran',
  `id_rapot` int(11) NOT NULL COMMENT 'ID rapot',
  `sakit` int(11) DEFAULT 0 COMMENT 'Jumlah sakit',
  `izin` int(11) DEFAULT 0 COMMENT 'Jumlah izin',
  `tanpa_keterangan` int(11) DEFAULT 0 COMMENT 'Jumlah tanpa keterangan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel kehadiran rapot';

-- --------------------------------------------------------

--
-- Struktur dari tabel `rapot_nilai`
--

CREATE TABLE `rapot_nilai` (
  `id_rapot_nilai` int(11) NOT NULL COMMENT 'ID rapot nilai',
  `id_rapot` int(11) NOT NULL COMMENT 'ID rapot',
  `id_mata_pelajaran` int(11) NOT NULL COMMENT 'ID mata pelajaran',
  `nilai_akhir` int(11) NOT NULL COMMENT 'Nilai akhir (0-100)',
  `capaian_kompetensi_baik` text NOT NULL COMMENT 'Capaian kompetensi baik',
  `capaian_kompetensi_perlu` text NOT NULL COMMENT 'Capaian kompetensi perlu diperbaiki'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel nilai rapot';

-- --------------------------------------------------------

--
-- Struktur dari tabel `rapot_tahfidz_detail`
--

CREATE TABLE `rapot_tahfidz_detail` (
  `id_rapot_tahfidz` int(11) NOT NULL COMMENT 'ID rapot tahfidz',
  `id_rapot_att` int(11) NOT NULL COMMENT 'ID rapot ATT',
  `target` varchar(200) NOT NULL COMMENT 'Target tahfidz',
  `capaian` varchar(200) NOT NULL COMMENT 'Capaian tahfidz',
  `keterangan` text DEFAULT NULL COMMENT 'Keterangan',
  `deskripsi` text DEFAULT NULL COMMENT 'Deskripsi'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel detail tahfidz rapot ATT';

-- --------------------------------------------------------

--
-- Struktur dari tabel `rapot_tanse_detail`
--

CREATE TABLE `rapot_tanse_detail` (
  `id_rapot_tanse` int(11) NOT NULL COMMENT 'ID rapot tanse',
  `id_rapot_att` int(11) NOT NULL COMMENT 'ID rapot ATT',
  `jenis_perilaku` enum('Penghargaan','Pelanggaran') NOT NULL COMMENT 'Jenis perilaku',
  `poin` int(11) NOT NULL COMMENT 'Poin',
  `deskripsi` text DEFAULT NULL COMMENT 'Deskripsi'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel detail tanse rapot ATT';

-- --------------------------------------------------------

--
-- Struktur dari tabel `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `siswa`
--

CREATE TABLE `siswa` (
  `nis` varchar(20) NOT NULL COMMENT 'Nomor Induk Siswa',
  `nama_lengkap` varchar(100) NOT NULL COMMENT 'Nama lengkap siswa',
  `tanggal_lahir` date NOT NULL COMMENT 'Tanggal lahir siswa',
  `jenis_kelamin` enum('L','P') NOT NULL COMMENT 'Jenis kelamin (L=Laki-laki, P=Perempuan)',
  `alamat` text DEFAULT NULL COMMENT 'Alamat siswa',
  `id_kelas` int(11) DEFAULT NULL COMMENT 'ID kelas siswa',
  `id_jurusan` int(11) DEFAULT NULL COMMENT 'ID jurusan siswa',
  `rombel` enum('1','2','3','4') DEFAULT NULL COMMENT 'Rombongan belajar (nullable untuk kelas 10)',
  `status` enum('Aktif','Non-aktif','Lulus') DEFAULT 'Aktif' COMMENT 'Status siswa',
  `asal_sekolah` varchar(100) DEFAULT NULL COMMENT 'Asal sekolah sebelumnya',
  `nama_ayah` varchar(100) DEFAULT NULL COMMENT 'Nama ayah',
  `nama_ibu` varchar(100) DEFAULT NULL COMMENT 'Nama ibu',
  `no_hp_orang_tua` varchar(15) DEFAULT NULL COMMENT 'Nomor HP orang tua',
  `alamat_orang_tua` text DEFAULT NULL COMMENT 'Alamat orang tua',
  `golongan_darah` enum('A','B','AB','O') DEFAULT NULL COMMENT 'Golongan darah',
  `id_orang_tua` int(11) DEFAULT NULL COMMENT 'ID orang tua',
  `barcode` varchar(50) DEFAULT NULL COMMENT 'Barcode unik untuk siswa',
  `rfid_code` varchar(50) DEFAULT NULL COMMENT 'RFID code unik untuk siswa',
  `barcode_generated_at` timestamp NULL DEFAULT NULL COMMENT 'Waktu barcode di-generate',
  `rfid_assigned_at` timestamp NULL DEFAULT NULL COMMENT 'Waktu RFID di-assign'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel data siswa';

--
-- Dumping data untuk tabel `siswa`
--

INSERT INTO `siswa` (`nis`, `nama_lengkap`, `tanggal_lahir`, `jenis_kelamin`, `alamat`, `id_kelas`, `id_jurusan`, `rombel`, `status`, `asal_sekolah`, `nama_ayah`, `nama_ibu`, `no_hp_orang_tua`, `alamat_orang_tua`, `golongan_darah`, `id_orang_tua`, `barcode`, `rfid_code`, `barcode_generated_at`, `rfid_assigned_at`) VALUES
('4407-2425001', 'Ahmad Muzaki', '2010-05-01', 'L', 'Jl. Contoh No. 123, Sukoharjo', 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 264, 'BC4407-2425001_1759197191', NULL, '2025-09-29 18:53:11', NULL),
('4407-2425002', 'Alif Bumi Prasetyo', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 491, 'BC4407-2425002_1759196805', NULL, '2025-09-29 18:46:45', NULL),
('4407-2425003', 'Alvio Radinka Zuhra', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 492, 'BC4407-2425003_1759204643_0', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425004', 'Audrey Hana Zafira Wibowo', '2011-01-01', 'P', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 493, 'BC4407-2425004_1759204643_1', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425005', 'Banyu Sinaran Abdillah Rasikh', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 494, 'BC4407-2425005_1759204643_2', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425006', 'Bima Ksatria Maheswara', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 495, 'BC4407-2425006_1759204643_3', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425007', 'Deavika Khanza Az Zahra', '2011-01-01', 'P', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 496, 'BC4407-2425007_1759204643_4', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425008', 'Dinar Salma Rumaisya', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 497, 'BC4407-2425008_1759204643_5', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425009', 'Faiq Hilmi Raditya', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 498, 'BC4407-2425009_1759204643_6', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425010', 'Fayzha Alwa Kutari', '2011-01-01', 'P', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 499, 'BC4407-2425010_1759204643_7', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425011', 'Kayla Firyal Abdullah', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 500, 'BC4407-2425011_1759204643_8', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425012', 'Lathisa Nadine Azzahra', '2011-01-01', 'P', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 502, 'BC4407-2425012_1759204643_9', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425013', 'Mandala Jibrillah Erga Wahana', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 503, 'BC4407-2425013_1759204643_10', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425014', 'Muhammad Dzaky Djauhari', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 504, 'BC4407-2425014_1759204643_11', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425015', 'Muh. Oktar Khilabi Maudunah', '2011-01-01', 'P', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 505, 'BC4407-2425015_1759204643_12', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425016', 'Mush\'ab Rizqi Ramadhani', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 506, 'BC4407-2425016_1759204643_13', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425017', 'Nahl Husnaa Wicky Adindrasetya', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 507, 'BC4407-2425017_1759204643_14', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425018', 'Narendra Akram Sanjaya', '2011-01-01', 'P', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 508, 'BC4407-2425018_1759204643_15', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425019', 'Naura Aqeela Falisha', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 509, 'BC4407-2425019_1759204643_16', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425020', 'Oktavia Aurel Mifdaf Abdilla', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 510, 'BC4407-2425020_1759204643_17', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425021', 'Zerin Fitria', '2011-01-01', 'P', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 511, 'BC4407-2425021_1759204643_18', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425022', 'Adnan Bima Adibrata', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 512, 'BC4407-2425022_1759204643_19', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425023', 'Aglin Wisnu Putra', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 513, 'BC4407-2425023_1759204643_20', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425024', 'Aisya Calya Kinara Hasan', '2011-01-01', 'P', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 514, 'BC4407-2425024_1759204643_21', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425025', 'Aisyah Azizah Muthmainah', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 515, 'BC4407-2425025_1759204643_22', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425026', 'Almira Rayasha Nurmulyanto', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 516, 'BC4407-2425026_1759204643_23', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425027', 'Alzena Nailah Maajid', '2011-01-01', 'P', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 517, 'BC4407-2425027_1759204643_24', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425028', 'Arayhan Khairu Razan', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 518, 'BC4407-2425028_1759204643_25', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425029', 'Ashakayla Floreandra Sasmita', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 519, 'BC4407-2425029_1759204643_26', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425030', 'Audrey Isyam Ethania Fatima', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 520, 'BC4407-2425030_1759204643_27', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425031', 'Brandea Loris', '2011-01-01', 'P', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 521, 'BC4407-2425031_1759204643_28', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425032', 'Callysta Qiamulail Romi', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 522, 'BC4407-2425032_1759204643_29', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425033', 'Emilly Miracelia Nuraini', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 523, 'BC4407-2425033_1759204643_30', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425034', 'Evan Abiyoga Almas', '2011-01-01', 'P', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 524, 'BC4407-2425034_1759204643_31', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425035', 'Ezahra Giska Paramitha', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 525, 'BC4407-2425035_1759204643_32', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425036', 'Faisal Adli Darmawan', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 526, 'BC4407-2425036_1759204643_33', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425037', 'Fulvian Dhawiy Affandi', '2011-01-01', 'P', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 527, 'BC4407-2425037_1759204643_34', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425038', 'Ghazi Nihal Aidan', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 528, 'BC4407-2425038_1759204643_35', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425039', 'Herjuna Zhafier Naraya', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 529, 'BC4407-2425039_1759204643_36', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425040', 'Inang Noer Said', '2011-01-01', 'P', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 530, 'BC4407-2425040_1759204643_37', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425041', 'Khansa Brilliana Baren', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 531, 'BC4407-2425041_1759204643_38', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425042', 'Mona Hanna Nur Velove', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 532, 'BC4407-2425042_1759204643_39', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425043', 'Najwa Maychelo Pramaula', '2011-01-01', 'P', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 533, 'BC4407-2425043_1759204643_40', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425044', 'Naufal Altaffarreli Hazim', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 534, 'BC4407-2425044_1759204643_41', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425045', 'Novidta Sheila Andini', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 535, 'BC4407-2425045_1759204643_42', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425046', 'Radithya Farras Ariditra Atmaja', '2011-01-01', 'P', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 536, 'BC4407-2425046_1759204643_43', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425047', 'Raditya Akhmad', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 537, 'BC4407-2425047_1759204643_44', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425048', 'Rahmad Wahyu Saputra', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 538, 'BC4407-2425048_1759204643_45', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425049', 'Rastri Arsytha Maghfirani', '2011-01-01', 'P', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 539, 'BC4407-2425049_1759204643_46', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425050', 'Trixie Della Ailsa Zuhri', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 540, 'BC4407-2425050_1759204643_47', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425051', 'Tsurayya Hadhrah Firmansyah', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 541, 'BC4407-2425051_1759204643_48', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425052', 'Viorenza Morely', '2011-01-01', 'P', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 542, 'BC4407-2425052_1759204643_49', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425053', 'Zhafif Agian Bima Pradana', '2011-01-01', 'L', NULL, 8, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 543, 'BC4407-2425053_1759204643_50', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425054', 'Adrian Rizky Ramadhan', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 568, 'BC4407-2425054_1759204643_51', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425055', 'Ahmad Hafid Pulunggono', '2011-01-01', 'P', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 545, 'BC4407-2425055_1759204643_52', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425056', 'Ananda Sa\'id Dimas Saputra', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 570, 'BC4407-2425056_1759204643_53', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425057', 'Andi Leitizia Nafisha', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 571, 'BC4407-2425057_1759204643_54', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425058', 'Aurellia Dina Susanto', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 546, 'BC4407-2425058_1759204643_55', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425059', 'Baraq Najam Abimanyu', '2011-01-01', 'P', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 548, 'BC4407-2425059_1759204643_56', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425060', 'Devin Chandra Ariyanto', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 573, 'BC4407-2425060_1759204643_57', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425061', 'Fayyaz Ridho Alamsyah', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 576, 'BC4407-2425061_1759204643_58', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425062', 'Jenar Luthfia Arini', '2011-01-01', 'P', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 579, 'BC4407-2425062_1759204643_59', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425063', 'Kynan Putri Diarly', '2011-01-01', 'P', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 582, 'BC4407-2425063_1759204643_60', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425064', 'Nadya Fayza Putri', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 556, 'BC4407-2425064_1759204643_61', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425065', 'Naila Aurelia Syahfitri', '2011-01-01', 'P', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 557, 'BC4407-2425065_1759204643_62', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425066', 'Noer Alvyn Ario Wibowo A', '2011-01-01', 'P', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 560, 'BC4407-2425066_1759204643_63', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425067', 'Queenadya Annaeira Sanjaya', '2011-01-01', 'P', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 585, 'BC4407-2425067_1759204643_64', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425068', 'Rachel Almaira Salsabilla', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 562, 'BC4407-2425068_1759204643_65', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425069', 'Raffi Rajendratama', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 586, 'BC4407-2425069_1759204643_66', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425070', 'Syarif Izzudin Badianto', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 587, 'BC4407-2425070_1759204643_67', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425071', 'Thalita Hasna Rosida', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 565, 'BC4407-2425071_1759204643_68', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425072', 'Viscount Hani\'am Traphatonie', '2011-01-01', 'P', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 566, 'BC4407-2425072_1759204643_69', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425073', 'Zahra Puteri Nazhifah', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 567, 'BC4407-2425073_1759204643_70', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425074', 'Afham Ghani Faith Ghafar', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 544, 'BC4407-2425074_1759204643_71', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425075', 'Alya Diana Putri', '2011-01-01', 'P', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 569, 'BC4407-2425075_1759204643_72', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425076', 'Azka Putri Azalia', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 547, 'BC4407-2425076_1759204643_73', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425077', 'Berwyn Akbar Prakoso', '2011-01-01', 'P', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 572, 'BC4407-2425077_1759204643_74', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425078', 'Callysta Fedora Efendi', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 549, 'BC4407-2425078_1759204643_75', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425079', 'Fadila Khairunisa Al Azhar', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 574, 'BC4407-2425079_1759204643_76', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425080', 'Fauzan Hafiedz Aliem Saputro', '2011-01-01', 'P', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 575, 'BC4407-2425080_1759204643_77', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425081', 'Gladys Afiyah Nugroho', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 550, 'BC4407-2425081_1759204643_78', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425082', 'Ikhsan Aji Ananda', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 578, 'BC4407-2425082_1759204643_79', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425083', 'Inggried Sekar Ayu Wira Hapsari', '2011-01-01', 'P', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 551, 'BC4407-2425083_1759204643_80', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425084', 'Keanobama Juan Komala', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 580, 'BC4407-2425084_1759204643_81', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425085', 'Kirana Avisha Ayudya Purba', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 581, 'BC4407-2425085_1759204643_82', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425086', 'Mayang Setyo Putri', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 552, 'BC4407-2425086_1759204643_83', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425087', 'Miko Al Bukhori Hidayatullah', '2011-01-01', 'P', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 554, 'BC4407-2425087_1759204643_84', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425088', 'Moch Zaky Abdilah Sujudi', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 584, 'BC4407-2425088_1759204643_85', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425089', 'Muh Zada Maher Rivai', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 555, 'BC4407-2425089_1759204643_86', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425090', 'Naura Sahlaluna Auni', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 558, 'BC4407-2425090_1759204643_87', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425091', 'Quinzha Veda Dewi Ijoyo', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 561, 'BC4407-2425091_1759204643_88', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425092', 'Remona Maysie Evanthe', '2011-01-01', 'P', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 563, 'BC4407-2425092_1759204643_89', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425093', 'Syarifah Nayla Shahab', '2011-01-01', 'P', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 588, 'BC4407-2425093_1759204643_90', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425096', 'Hanindito Suryo Purwanto', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 577, 'BC4407-2425096_1759204643_91', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425097', 'Mada Rajni Pinggala', '2011-01-01', 'L', NULL, 10, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 583, 'BC4407-2425097_1759204643_92', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425098', 'Meilvi Azahra Karunia', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 553, 'BC4407-2425098_1759204643_93', NULL, '2025-09-29 20:57:23', NULL),
('4407-2425100', 'Syakiraa Aufa Pagi Fadhiilah', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 564, 'BC4407-2425100_1759204643_94', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526001', 'Aisyah Zafirah Adi Putri', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 470, 'BC4407-2526001_1759204643_95', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526002', 'Alyssa Nadya Hariputri', '2010-05-01', 'L', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 471, 'BC4407-2526002_1759204643_96', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526003', 'Amabel Nararya Ramadhani', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 472, 'BC4407-2526003_1759204643_97', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526004', 'Argenta Ahmad When Alfahri', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 473, 'BC4407-2526004_1759204643_98', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526005', 'Faatih Mu\'aafa', '2010-05-01', 'L', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 474, 'BC4407-2526005_1759204643_99', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526006', 'Fahri Abbas Ibrahim', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 475, 'BC4407-2526006_1759204643_100', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526007', 'Faizun Nafis Al Hilmy', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 476, 'BC4407-2526007_1759204643_101', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526008', 'Ferdinand Alcender Saputra', '2010-05-01', 'L', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 477, 'BC4407-2526008_1759204643_102', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526009', 'Kanina Shanum Almahyra', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 479, 'BC4407-2526009_1759204643_103', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526011', 'Khalisha Athaya Putri', '2010-05-01', 'L', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 480, 'BC4407-2526011_1759204643_104', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526012', 'Lunetta Vala Anevay Dhia', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 481, 'BC4407-2526012_1759204643_105', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526013', 'Nafilah Barrah Qurratul\'ain', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 482, 'BC4407-2526013_1759204643_106', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526014', 'Naya Zahra Aorta Kholis', '2010-05-01', 'L', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 483, 'BC4407-2526014_1759204643_107', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526015', 'Raina Zakiya Azka', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 484, 'BC4407-2526015_1759204643_108', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526016', 'Raissa Hanasyah Sulam', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 485, 'BC4407-2526016_1759204643_109', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526017', 'Safira Danis Quratuaini', '2010-05-01', 'L', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 486, 'BC4407-2526017_1759204643_110', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526018', 'Salsabilla Agusti Zahra', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 488, 'BC4407-2526018_1759204643_111', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526019', 'Salsabilla Raisya Putri', '2010-05-01', 'L', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 489, 'BC4407-2526019_1759204643_112', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526020', 'Trigana Manunggal Pujut Nusantara', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 490, 'BC4407-2526020_1759204643_113', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526021', 'Zena Zada Azaria', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BC4407-2526021_1759204643_114', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526022', 'Afiyah Thufailah', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 177, 'BC4407-2526022_1759204643_115', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526023', 'Aqil Muktazam Nadav Ariefman', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 178, 'BC4407-2526023_1759204643_116', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526024', 'Arsyad Farizi', '2010-05-01', 'L', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 179, 'BC4407-2526024_1759204643_117', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526025', 'Carlo Atha Wiratama', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 180, 'BC4407-2526025_1759204643_118', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526026', 'Davin Danianson Wahid', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 181, 'BC4407-2526026_1759204643_119', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526027', 'Hafizah Musfirah', '2010-05-01', 'L', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 182, 'BC4407-2526027_1759204643_120', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526028', 'Jonash Kenzo Putra Ersgavino', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 183, 'BC4407-2526028_1759204643_121', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526029', 'M Nurkholish Haidar Rifqy', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 184, 'BC4407-2526029_1759204643_122', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526030', 'Nabil Adabi Putra Andrian', '2010-05-01', 'L', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 185, 'BC4407-2526030_1759204643_123', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526031', 'Nabila Alia Zahrah Rudhiyana', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 186, 'BC4407-2526031_1759204643_124', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526032', 'Nadira Clarissa Wibowo', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 187, 'BC4407-2526032_1759204643_125', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526033', 'Nalendra Zavier Akhtar Sanjaya', '2010-05-01', 'L', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 188, 'BC4407-2526033_1759204643_126', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526034', 'Rafa Rafiansyah', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 189, 'BC4407-2526034_1759204643_127', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526035', 'Rafka Hedjaz Muhammad Sihaf', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 190, 'BC4407-2526035_1759204643_128', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526036', 'Raissa Callysta Putri Setyawan', '2010-05-01', 'L', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 191, 'BC4407-2526036_1759204643_129', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526037', 'Ratu Nayaka Setyanegara', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 192, 'BC4407-2526037_1759204643_130', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526038', 'Rizky Aditya', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 193, 'BC4407-2526038_1759204643_131', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526039', 'Sa\'id Wijaya Esa Sugiarto', '2010-05-01', 'L', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 194, 'BC4407-2526039_1759204643_132', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526040', 'Sanggarwati Puspa Dewi', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 195, 'BC4407-2526040_1759204643_133', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526041', 'Vano Zacky Gautama', '2010-05-01', 'P', NULL, 4, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 196, 'BC4407-2526041_1759204643_134', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526042', 'Adelio Nafis Favian', '2010-05-01', 'L', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 197, 'BC4407-2526042_1759204643_135', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526043', 'Ahnaf Irsyad Yakes Aldiansyah', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 198, 'BC4407-2526043_1759204643_136', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526044', 'Ardzidane Cipta Geripasha', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 199, 'BC4407-2526044_1759204643_137', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526045', 'Ayra Kirani Wibowo', '2010-05-01', 'L', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 200, 'BC4407-2526045_1759204643_138', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526046', 'Balindra Gabriel Rivera Wibowo', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 201, 'BC4407-2526046_1759204643_139', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526047', 'Calista Alya Safitri', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 202, 'BC4407-2526047_1759204643_140', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526048', 'Dyah Khaira Lubna', '2010-05-01', 'L', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 203, 'BC4407-2526048_1759204643_141', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526049', 'Fiko Al Aisy Hidayatullah', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 204, 'BC4407-2526049_1759204643_142', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526050', 'Kalima Rizsurya Pamenang Brewira Kamajaya', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 205, 'BC4407-2526050_1759204643_143', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526051', 'Kyosa Elvia Putri Deska', '2010-05-01', 'L', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 206, 'BC4407-2526051_1759204643_144', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526052', 'Muhammad Daniz Rizqi Arfauzi', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 207, 'BC4407-2526052_1759204643_145', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526053', 'Muhammad Zia Ulhaq', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 208, 'BC4407-2526053_1759204643_146', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526054', 'Nasywaa Mumtazah Ar Rozzaq', '2010-05-01', 'L', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 209, 'BC4407-2526054_1759204643_147', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526055', 'Nazela Melanovia Riyanto', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 210, 'BC4407-2526055_1759204643_148', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526056', 'Prabu Khalithy Ardimas Subagyo', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 211, 'BC4407-2526056_1759204643_149', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526057', 'Rafa Mifzal Ilka Pangestu', '2010-05-01', 'L', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 212, 'BC4407-2526057_1759204643_150', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526058', 'Rasya Beryl Hamizan', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 213, 'BC4407-2526058_1759204643_151', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526059', 'Satria Hanif Alwi Yahya', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 214, 'BC4407-2526059_1759204643_152', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526060', 'Thoriqul Fikri Ibnu Warsito', '2010-05-01', 'P', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 215, 'BC4407-2526060_1759204643_153', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526061', 'Tsamara Alvareta Azarine', '2010-05-01', 'L', NULL, 5, 2, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 216, 'BC4407-2526061_1759204643_154', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526062', 'Ahza Syahmifzal Arsyad', '2010-05-01', 'P', NULL, 6, 3, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 217, 'BC4407-2526062_1759204643_155', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526063', 'Aisya Muslimah Arifin', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 218, 'BC4407-2526063_1759204643_156', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526064', 'Aliesha Valerie Indratno', '2010-05-01', 'L', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 219, 'BC4407-2526064_1759204643_157', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526065', 'Alisha Dzakira Husna', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 220, 'BC4407-2526065_1759204643_158', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526066', 'Alya Ilmina Rusdi', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 221, 'BC4407-2526066_1759204643_159', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526067', 'Athaya Dahayu Ali', '2010-05-01', 'L', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 222, 'BC4407-2526067_1759204643_160', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526068', 'Azra Azizy Shafaqa Widiatmoko', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 223, 'BC4407-2526068_1759204643_161', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526069', 'Caesar Javas Athaya Syamsul', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 224, 'BC4407-2526069_1759204643_162', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526070', 'Fadhil Zikri Ataya Pudjiono', '2010-05-01', 'L', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 225, 'BC4407-2526070_1759204643_163', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526071', 'Fulvya Nasywa Mauliatuzzahra', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 226, 'BC4407-2526071_1759204643_164', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526072', 'Khansa Reiska Kinanthi', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 227, 'BC4407-2526072_1759204643_165', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526073', 'M Luqman Rasyid', '2010-05-01', 'L', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 228, 'BC4407-2526073_1759204643_166', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526074', 'Mahdiya Shafa Alzenadinata', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 229, 'BC4407-2526074_1759204643_167', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526075', 'Muazam Pandega Wiryawan', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 230, 'BC4407-2526075_1759204643_168', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526076', 'Muhammad Kilat Samudra', '2010-05-01', 'L', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 231, 'BC4407-2526076_1759204643_169', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526077', 'Muhammad Rifki Tarigan', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 232, 'BC4407-2526077_1759204643_170', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526078', 'Naufal Marshal Arianto', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 233, 'BC4407-2526078_1759204643_171', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526079', 'Naufal Rakha Aldika', '2010-05-01', 'L', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 234, 'BC4407-2526079_1759204643_172', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526080', 'Nismara Dewi Azarine', '2010-05-01', 'P', NULL, 6, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 235, 'BC4407-2526080_1759204643_173', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526081', 'Putri Elina Pertiwi', '2010-05-01', 'P', NULL, 6, 3, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 463, 'BC4407-2526081_1759204643_174', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526082', 'Raden Ajeng Almeera Koes Rantashaningtyas', '2010-05-01', 'L', NULL, 6, 3, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 464, 'BC4407-2526082_1759204643_175', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526083', 'Radithya Ari Widyasmoro', '2010-05-01', 'P', NULL, 6, 3, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 465, 'BC4407-2526083_1759204643_176', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526084', 'Raditya Anggara Hardiyansa Putra', '2010-05-01', 'P', NULL, 6, 3, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 466, 'BC4407-2526084_1759204643_177', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526085', 'Rafkha Safaraz Akma Indrawan', '2010-05-01', 'P', NULL, 6, 3, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 467, 'BC4407-2526085_1759204643_178', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526086', 'Respati Kusuma Nagoro', '2010-05-01', 'L', NULL, 6, 3, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 468, 'BC4407-2526086_1759204643_179', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526087', 'Teuku Ibni Julian Farrell', '2010-05-01', 'P', NULL, 6, 3, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 469, 'BC4407-2526087_1759204643_180', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526088', 'Aisyah Hanna Rahmadiennandita', '2011-01-01', 'P', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 364, 'BC4407-2526088_1759204643_181', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526089', 'Kirana Raisha Putri Dewanto', '2011-01-01', 'L', NULL, 7, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 501, 'BC4407-2526089_1759204643_182', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526090', 'Ganesha Majesty Diandra Saputra', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 478, 'BC4407-2526090_1759204643_183', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526091', 'Saleha Al Mecca', '2010-05-01', 'P', NULL, 1, 1, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 487, 'BC4407-2526091_1759204643_184', NULL, '2025-09-29 20:57:23', NULL),
('4407-2526092', 'Nizar Muhammad Faiz', '2011-01-01', 'L', NULL, 9, 4, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, 559, 'BC4407-2526092_1759204643_185', NULL, '2025-09-29 20:57:23', NULL),
('SIS001', 'Siti Demo', '2008-05-01', 'P', 'Jl. Contoh No.1', NULL, NULL, NULL, 'Aktif', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `tagihan`
--

CREATE TABLE `tagihan` (
  `id_tagihan` int(11) NOT NULL COMMENT 'ID tagihan',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `id_jenis_pembayaran` int(11) NOT NULL COMMENT 'ID jenis pembayaran',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `bulan_tagihan` varchar(20) DEFAULT NULL COMMENT 'Bulan tagihan (untuk pembayaran bulanan)',
  `jumlah_tagihan` decimal(10,2) NOT NULL COMMENT 'Jumlah tagihan',
  `tanggal_jatuh_tempo` date NOT NULL COMMENT 'Tanggal jatuh tempo',
  `status_tagihan` enum('Belum_Bayar','Sudah_Bayar','Overdue') DEFAULT 'Belum_Bayar' COMMENT 'Status tagihan',
  `keterangan` text DEFAULT NULL COMMENT 'Keterangan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel tagihan siswa';

-- --------------------------------------------------------

--
-- Struktur dari tabel `tahun_ajaran`
--

CREATE TABLE `tahun_ajaran` (
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `tahun_ajaran` varchar(10) NOT NULL COMMENT 'Tahun ajaran (contoh: 2024/2025)',
  `semester` enum('Ganjil','Genap') NOT NULL COMMENT 'Semester',
  `tanggal_mulai` date NOT NULL COMMENT 'Tanggal mulai',
  `tanggal_selesai` date NOT NULL COMMENT 'Tanggal selesai',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel tahun ajaran';

--
-- Dumping data untuk tabel `tahun_ajaran`
--

INSERT INTO `tahun_ajaran` (`id_tahun_ajaran`, `tahun_ajaran`, `semester`, `tanggal_mulai`, `tanggal_selesai`, `status`) VALUES
(1, '2023/2024', 'Ganjil', '2024-07-15', '2024-12-20', 'Non-aktif'),
(2, '2024/2025', 'Genap', '2025-01-06', '2025-06-15', 'Non-aktif'),
(3, '2025/2026', 'Ganjil', '2025-07-15', '2025-12-30', 'Aktif'),
(4, '2025/2026', 'Genap', '2026-01-01', '2026-06-30', 'Non-aktif');

-- --------------------------------------------------------

--
-- Struktur dari tabel `target_hafalan_siswa`
--

CREATE TABLE `target_hafalan_siswa` (
  `id_target_hafalan` int(11) NOT NULL COMMENT 'ID target hafalan',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `target_baris_perpertemuan` enum('3','5','7') NOT NULL COMMENT 'Target baris per pertemuan',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status target'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel target hafalan siswa';

-- --------------------------------------------------------

--
-- Struktur dari tabel `tugas`
--

CREATE TABLE `tugas` (
  `id_tugas` int(11) NOT NULL COMMENT 'ID tugas',
  `id_mata_pelajaran` int(11) NOT NULL COMMENT 'ID mata pelajaran',
  `nik_guru` varchar(20) NOT NULL COMMENT 'NIK guru pemberi tugas',
  `id_kelas` int(11) NOT NULL COMMENT 'ID kelas',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `judul_tugas` varchar(200) NOT NULL COMMENT 'Judul tugas',
  `deskripsi_tugas` text NOT NULL COMMENT 'Deskripsi tugas',
  `tanggal_pemberian` date NOT NULL COMMENT 'Tanggal pemberian tugas',
  `tanggal_deadline` datetime NOT NULL COMMENT 'Tanggal deadline',
  `tipe_tugas` enum('Semua_Siswa','Siswa_Terpilih') NOT NULL COMMENT 'Tipe tugas',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status tugas',
  `file_tugas` varchar(255) DEFAULT NULL COMMENT 'File tugas',
  `bobot_nilai` decimal(5,2) DEFAULT NULL,
  `keterangan` text DEFAULT NULL COMMENT 'Keterangan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel tugas';

-- --------------------------------------------------------

--
-- Struktur dari tabel `tugas_adab`
--

CREATE TABLE `tugas_adab` (
  `id_tugas_adab` int(11) NOT NULL COMMENT 'ID tugas adab',
  `nama_tugas` varchar(200) NOT NULL COMMENT 'Nama tugas adab',
  `deskripsi_tugas` text NOT NULL COMMENT 'Deskripsi tugas',
  `id_tahun_ajaran` int(11) NOT NULL COMMENT 'ID tahun ajaran',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status tugas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel tugas adab';

--
-- Dumping data untuk tabel `tugas_adab`
--

INSERT INTO `tugas_adab` (`id_tugas_adab`, `nama_tugas`, `deskripsi_tugas`, `id_tahun_ajaran`, `status`) VALUES
(1, 'Sholat Dhuha', 'Melaksanakan sholat dhuha sebelum jam pelajaran dimulai', 1, 'Aktif'),
(2, 'Sholat Dhuhur Berjamaah', 'Melaksanakan sholat dhuhur berjamaah di masjid sekolah', 1, 'Aktif'),
(3, 'Sholat Asar Berjamaah', 'Melaksanakan sholat asar berjamaah di masjid sekolah', 1, 'Aktif'),
(4, 'Membaca Al-Quran Pagi', 'Membaca Al-Quran selama 15 menit sebelum pelajaran dimulai', 1, 'Aktif'),
(5, 'Dzikir Pagi', 'Melaksanakan dzikir pagi bersama-sama', 1, 'Aktif'),
(6, 'Infaq Jumat', 'Memberikan infaq setiap hari Jumat', 1, 'Aktif'),
(7, 'Kebersihan Kelas', 'Menjaga kebersihan kelas dan lingkungan sekolah', 1, 'Aktif'),
(8, 'Hormat kepada Guru', 'Menunjukkan sikap hormat dan sopan kepada guru', 1, 'Aktif'),
(9, 'Iman Kepada Allah', 'Sholat 5 Waktu', 3, 'Aktif');

-- --------------------------------------------------------

--
-- Struktur dari tabel `tugas_siswa`
--

CREATE TABLE `tugas_siswa` (
  `id_tugas_siswa` int(11) NOT NULL COMMENT 'ID tugas siswa',
  `id_tugas` int(11) NOT NULL COMMENT 'ID tugas',
  `nis` varchar(20) NOT NULL COMMENT 'NIS siswa',
  `status_pengumpulan` enum('Belum','Sudah','Terlambat') DEFAULT 'Belum' COMMENT 'Status pengumpulan'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel relasi tugas dan siswa';

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `user_id` varchar(20) NOT NULL COMMENT 'ID unik pengguna',
  `username` varchar(50) NOT NULL COMMENT 'Username untuk login',
  `password` varchar(255) NOT NULL COMMENT 'Password terenkripsi',
  `user_type` enum('Siswa','Guru','Admin','Kepala_Sekolah','Petugas_Keuangan','Orang_Tua') NOT NULL COMMENT 'Tipe pengguna',
  `status` enum('Aktif','Non-aktif') DEFAULT 'Aktif' COMMENT 'Status aktif pengguna',
  `reference_id` varchar(20) DEFAULT NULL COMMENT 'ID referensi ke tabel terkait',
  `last_login` timestamp NULL DEFAULT NULL COMMENT 'Waktu login terakhir',
  `remember_token` varchar(100) DEFAULT NULL COMMENT 'Token untuk remember me functionality',
  `created_date` timestamp NOT NULL DEFAULT current_timestamp() COMMENT 'Tanggal dibuat',
  `updated_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT 'Tanggal diupdate'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel pengguna sistem';

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `user_type`, `status`, `reference_id`, `last_login`, `remember_token`, `created_date`, `updated_date`) VALUES
('6Ai', 'ortu', '$2y$12$RchhpBVolsAByLkzKIK8dunVssrNNWWdBgjJSJRN8GuWThA3VNVZ6', 'Orang_Tua', 'Aktif', '1', '2025-09-28 17:38:20', 'ouhUh7iFfaIachtMunLPtzVMYv2MjTCRIRiw2umkOlffUE9eLoTWHk7erhFX', '2025-09-26 20:59:36', '2025-09-28 17:38:20'),
('ADM001', 'admin', '$2y$12$TlklTcxIwkI3SpsEGyJ6G.iXwMZbpUlCHYoh/2dc7mHEWNnV.S1M6', 'Admin', 'Aktif', 'ADM001', '2025-10-12 03:30:50', 'YuAZhGnYIS1HrCKRj7Jq0xRx9bGIdQSN0C4HuvStIRe6skBdVfEqwkqi7Y2C', '2025-10-10 19:14:43', '2025-10-12 03:30:50'),
('ADM415562', 'admin1', '$2y$12$0fEZqY5xRFI.li.sDrbmeOZNabUe1ffpiFCB/G4nVDw7uAct1iXw.', 'Admin', 'Aktif', 'ADM415562', '2025-10-06 05:40:06', 'aHfrx7v7dXljMtJ7aKOCeB2zMFK5lI0ZgTiVnl0qygLe1sw1Dl9Z6quFAdMH', '2025-10-06 05:24:12', '2025-10-06 05:40:06'),
('GR001', 'guru', '$2y$12$eT6PZ3WwcoMXVyl9HKFrZehHFKGe2tEjtoaF3mHCjPIG/JodlbLBO', 'Guru', 'Aktif', '06.0412', '2025-10-12 03:31:36', 'lK5Lc3bJ2we5uX0Ig5jjSpH7VDRHpBQnLasXhwxgWepAMmaVBDCccZI8JSvA', '2025-10-10 19:14:43', '2025-10-12 03:31:36'),
('GR2', 'guru2', '$2y$12$p3k84RVfzXbrzQ8D467AHOa.5sGrJ9ZfPWTz.L4tYIRWmlA9tmF9K', 'Guru', 'Aktif', '07279', '2025-10-12 03:29:07', 'k6rNUZtjOlCSJobMr4niA147626GMTGRrYmracm5MGBFXn8BoTAVc7nGkZig', '2025-09-28 10:01:02', '2025-10-12 03:29:07'),
('SW1', 'siswa', '$2y$12$TMCgHVFhgg1s9JbVD51ys./7lpqesxLUxYFiohzikh/RdzJn3tNJm', 'Siswa', 'Aktif', '4407-2425001', '2025-10-10 03:20:55', 'gQBfgwPU2XDpbwcUf6rWQd3nTMblyPw5Hi2O1I0QenakoCU0VlF3IGlfMyss', '2025-09-27 07:16:14', '2025-10-10 03:20:55'),
('SW320873', 'siswa3', '$2y$12$Zmw8CSgt9eWBGXnIw0KWfeE6KUJFo2O/e3L9RGHTYNkhBTwnutFJK', 'Siswa', 'Aktif', '4407-2526091', '2025-10-02 10:32:55', 'eh2aqsL4UQAOJ9GrJzGR7wS5KxFq8NSFCUedAJ8Ow1QLQg0wCGLQtwzc6lH0', '2025-10-02 10:32:35', '2025-10-02 10:32:55'),
('SW406061', 'siswa4', '$2y$12$yf/de5njnG4oYNs15xBk7OAXQ7vi8rhNh8iIC2L/Xlqc7M9HyXcFW', 'Siswa', 'Aktif', '4407-2526028', '2025-10-02 10:34:29', '6CJ4qzrFiTx2huB7xdGqQwta84oZkzDpXIlbsz1eRnxBuZiA2dQ5xadE5lfS', '2025-10-02 10:34:05', '2025-10-02 10:34:29'),
('SW639473', 'siswa5', '$2y$12$8UbsQCfS/x7nVe1V3mRX0OOHhi8hoQxvffHZb6GVle9CXXvXtYa/O', 'Siswa', 'Aktif', '4407-2526026', '2025-10-02 10:54:37', 'Nql1epUYfQsLdUuRMizoJ70SbgpUfK31Yoi4Ryyl3yENV55AXGvljP17jEDc', '2025-10-02 10:54:25', '2025-10-02 10:54:37'),
('USR001', 'AAA', '$2y$12$3kF5cGyJXJ48w8fmrME0/eU68i3tE9GbfizOC2Sl8cyjxk5T6zOxS', 'Guru', 'Aktif', '111', NULL, NULL, '2025-10-06 08:16:22', '2025-10-06 08:18:36'),
('USR002', 'kepsek', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kepala_Sekolah', 'Aktif', '1', '2025-10-05 04:37:23', 'cFd75pIrBcoKqeBq4680XjFtzDrWRvD7xNpgItKoNgxIfhKkdOFR2lhHsRdr', '2025-09-26 14:47:36', '2025-10-05 04:37:23'),
('USR003', 'keuangan', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Petugas_Keuangan', 'Aktif', '1', '2025-09-28 17:38:31', '46pURgn2jU2YVAp4OehkFd7kXrZ9ZUrS6juni3AqCiWcKYvmnL9mTkvQ2O7T', '2025-09-26 14:47:36', '2025-09-28 17:38:31'),
('USR005', 'ayah ahmad', '$2y$12$wKIw2PPR8Aj30JMqvQevve4E/JIEgISeYuUHCsP72nzxZ7rKlcfcy', 'Orang_Tua', 'Aktif', '264', NULL, NULL, '2025-10-06 20:13:56', '2025-10-06 20:13:56'),
('USR010', 'siswa_demo', '$2y$12$aBxpubY4MOtqvOBL5tnp0OM59I4ZXw2.qetEZ7eG9.6RXEZCQXBxG', 'Siswa', 'Aktif', 'SIS001', '2025-10-02 09:50:22', 'cwpEzAkjReYPsUoI6XQiMkW0T1i25aUf8rgcjL9GzCaXXuX3UO4s4if8yzbB', '2025-10-02 09:46:33', '2025-10-02 09:50:22'),
('XT', 'ortu_aisyah', '$2y$12$vLzkKDrfSmoV1a4cSSV9mOUQruBavrLrv6XyR9nKCA38APuU1c6b6', 'Orang_Tua', 'Aktif', '3', '2025-09-29 06:39:58', 'mpxnOCPzYhCmEj30JsfBYluYrIbpW5HYjoxZsFjUZGKODrBsZd0B0N1XERMw', '2025-09-29 06:38:55', '2025-09-29 06:39:58');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id_admin`);

--
-- Indeks untuk tabel `evaluasi_hafalan`
--
ALTER TABLE `evaluasi_hafalan`
  ADD PRIMARY KEY (`id_evaluasi`),
  ADD KEY `fk_evaluasi_hafalan_siswa` (`nis`),
  ADD KEY `fk_evaluasi_hafalan_tahun_ajaran` (`id_tahun_ajaran`);

--
-- Indeks untuk tabel `guru`
--
ALTER TABLE `guru`
  ADD PRIMARY KEY (`nik_guru`),
  ADD KEY `idx_guru_nama` (`nama_lengkap`),
  ADD KEY `idx_guru_status` (`status`);

--
-- Indeks untuk tabel `guru_mata_pelajaran`
--
ALTER TABLE `guru_mata_pelajaran`
  ADD PRIMARY KEY (`id_guru_mapel`),
  ADD KEY `fk_guru_mapel_guru` (`nik_guru`),
  ADD KEY `fk_guru_mapel_mata_pelajaran` (`id_mata_pelajaran`);

--
-- Indeks untuk tabel `hafalan`
--
ALTER TABLE `hafalan`
  ADD PRIMARY KEY (`id_hafalan`),
  ADD KEY `fk_hafalan_guru` (`nik_guru_penguji`),
  ADD KEY `idx_hafalan_tanggal` (`tanggal_setoran`),
  ADD KEY `idx_hafalan_nis` (`nis`),
  ADD KEY `idx_hafalan_status` (`status_hafalan`);

--
-- Indeks untuk tabel `jadwal_pelajaran`
--
ALTER TABLE `jadwal_pelajaran`
  ADD PRIMARY KEY (`id_jadwal`),
  ADD KEY `fk_jadwal_tahun_ajaran` (`id_tahun_ajaran`),
  ADD KEY `fk_jadwal_mata_pelajaran` (`id_mata_pelajaran`),
  ADD KEY `idx_jadwal_hari_jam` (`hari`,`jam_ke`),
  ADD KEY `idx_jadwal_guru` (`nik_guru`),
  ADD KEY `idx_jadwal_kelas` (`id_kelas`);

--
-- Indeks untuk tabel `jenis_pembayaran`
--
ALTER TABLE `jenis_pembayaran`
  ADD PRIMARY KEY (`id_jenis_pembayaran`);

--
-- Indeks untuk tabel `jurnal_mengajar`
--
ALTER TABLE `jurnal_mengajar`
  ADD PRIMARY KEY (`id_jurnal`),
  ADD KEY `fk_jurnal_jadwal` (`id_jadwal`),
  ADD KEY `idx_jurnal_tanggal` (`tanggal`),
  ADD KEY `idx_jurnal_guru` (`nik_guru`);

--
-- Indeks untuk tabel `jurusan`
--
ALTER TABLE `jurusan`
  ADD PRIMARY KEY (`id_jurusan`);

--
-- Indeks untuk tabel `kelas`
--
ALTER TABLE `kelas`
  ADD PRIMARY KEY (`id_kelas`),
  ADD KEY `fk_kelas_jurusan` (`id_jurusan`),
  ADD KEY `fk_kelas_wali_kelas` (`wali_kelas`),
  ADD KEY `idx_kelas_tingkat` (`tingkat`),
  ADD KEY `idx_kelas_tahun_ajaran` (`id_tahun_ajaran`);

--
-- Indeks untuk tabel `kelas_siswa`
--
ALTER TABLE `kelas_siswa`
  ADD PRIMARY KEY (`id_kelas_siswa`),
  ADD KEY `kelas_siswa_nis_id_kelas_id_tahun_ajaran_index` (`nis`,`id_kelas`,`id_tahun_ajaran`),
  ADD KEY `kelas_siswa_id_kelas_index` (`id_kelas`),
  ADD KEY `kelas_siswa_id_tahun_ajaran_index` (`id_tahun_ajaran`);

--
-- Indeks untuk tabel `kepala_sekolah`
--
ALTER TABLE `kepala_sekolah`
  ADD PRIMARY KEY (`id_kepala_sekolah`);

--
-- Indeks untuk tabel `kurikulum`
--
ALTER TABLE `kurikulum`
  ADD PRIMARY KEY (`id_kurikulum`),
  ADD KEY `fk_kurikulum_tahun_ajaran` (`id_tahun_ajaran`),
  ADD KEY `fk_kurikulum_mata_pelajaran` (`id_mata_pelajaran`);

--
-- Indeks untuk tabel `laporan`
--
ALTER TABLE `laporan`
  ADD PRIMARY KEY (`id_laporan`),
  ADD KEY `fk_laporan_tahun_ajaran` (`id_tahun_ajaran`),
  ADD KEY `fk_laporan_user` (`id_user_generate`),
  ADD KEY `idx_laporan_jenis` (`jenis_laporan`),
  ADD KEY `idx_laporan_periode` (`periode_laporan`),
  ADD KEY `idx_laporan_tanggal` (`tanggal_generate`),
  ADD KEY `idx_laporan_bulan` (`bulan_laporan`);

--
-- Indeks untuk tabel `laporan_presensi_detail`
--
ALTER TABLE `laporan_presensi_detail`
  ADD PRIMARY KEY (`id_laporan_presensi`),
  ADD KEY `fk_laporan_presensi_laporan` (`id_laporan`),
  ADD KEY `fk_laporan_presensi_siswa` (`nis`);

--
-- Indeks untuk tabel `laporan_statistik`
--
ALTER TABLE `laporan_statistik`
  ADD PRIMARY KEY (`id_statistik`),
  ADD KEY `fk_laporan_statistik_laporan` (`id_laporan`);

--
-- Indeks untuk tabel `laporan_tahfidz_detail`
--
ALTER TABLE `laporan_tahfidz_detail`
  ADD PRIMARY KEY (`id_laporan_tahfidz`),
  ADD KEY `fk_laporan_tahfidz_laporan` (`id_laporan`),
  ADD KEY `fk_laporan_tahfidz_siswa` (`nis`);

--
-- Indeks untuk tabel `mata_pelajaran`
--
ALTER TABLE `mata_pelajaran`
  ADD PRIMARY KEY (`id_mata_pelajaran`);

--
-- Indeks untuk tabel `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `monitoring_adab`
--
ALTER TABLE `monitoring_adab`
  ADD PRIMARY KEY (`id_monitoring_adab`),
  ADD KEY `fk_monitoring_adab_tahun_ajaran` (`id_tahun_ajaran`),
  ADD KEY `fk_monitoring_adab_tugas` (`id_tugas_adab`),
  ADD KEY `idx_monitoring_adab_tanggal` (`tanggal`),
  ADD KEY `idx_monitoring_adab_nis` (`nis`);

--
-- Indeks untuk tabel `monitoring_sholat`
--
ALTER TABLE `monitoring_sholat`
  ADD PRIMARY KEY (`id_monitoring_sholat`),
  ADD KEY `fk_monitoring_sholat_guru` (`nik_guru_input`),
  ADD KEY `idx_monitoring_sholat_tanggal` (`tanggal`),
  ADD KEY `idx_monitoring_sholat_nis` (`nis`),
  ADD KEY `idx_monitoring_sholat_jenis` (`jenis_sholat`);

--
-- Indeks untuk tabel `nilai`
--
ALTER TABLE `nilai`
  ADD PRIMARY KEY (`id_nilai`),
  ADD KEY `fk_nilai_mata_pelajaran` (`id_mata_pelajaran`),
  ADD KEY `fk_nilai_guru` (`nik_guru_penginput`),
  ADD KEY `idx_nilai_nis_mapel` (`nis`,`id_mata_pelajaran`),
  ADD KEY `idx_nilai_tahun_ajaran` (`id_tahun_ajaran`),
  ADD KEY `idx_nilai_jenis` (`jenis_penilaian`),
  ADD KEY `idx_nilai_tanggal` (`tanggal_input`);

--
-- Indeks untuk tabel `orang_tua`
--
ALTER TABLE `orang_tua`
  ADD PRIMARY KEY (`id_orang_tua`);

--
-- Indeks untuk tabel `pelanggaran`
--
ALTER TABLE `pelanggaran`
  ADD PRIMARY KEY (`id_pelanggaran`),
  ADD KEY `fk_pelanggaran_guru` (`nik_guru_input`),
  ADD KEY `idx_pelanggaran_tanggal` (`tanggal_pelanggaran`),
  ADD KEY `idx_pelanggaran_nis` (`nis`),
  ADD KEY `idx_pelanggaran_jenis` (`jenis_pelanggaran`),
  ADD KEY `idx_pelanggaran_status` (`status`);

--
-- Indeks untuk tabel `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id_pembayaran`),
  ADD KEY `fk_pembayaran_tagihan` (`id_tagihan`),
  ADD KEY `fk_pembayaran_user` (`id_user_petugas`),
  ADD KEY `idx_pembayaran_tanggal` (`tanggal_bayar`),
  ADD KEY `idx_pembayaran_status` (`status_pembayaran`),
  ADD KEY `idx_pembayaran_metode` (`metode_pembayaran`);

--
-- Indeks untuk tabel `pengumpulan_tugas`
--
ALTER TABLE `pengumpulan_tugas`
  ADD PRIMARY KEY (`id_pengumpulan`),
  ADD KEY `fk_pengumpulan_tugas` (`id_tugas`),
  ADD KEY `fk_pengumpulan_siswa` (`nis`);

--
-- Indeks untuk tabel `pengumuman`
--
ALTER TABLE `pengumuman`
  ADD PRIMARY KEY (`id_pengumuman`),
  ADD KEY `fk_pengumuman_user` (`id_user_pembuat`),
  ADD KEY `idx_pengumuman_tanggal` (`tanggal_posting`),
  ADD KEY `idx_pengumuman_status` (`status`),
  ADD KEY `idx_pengumuman_target_type` (`target_type`);

--
-- Indeks untuk tabel `pengumuman_target`
--
ALTER TABLE `pengumuman_target`
  ADD PRIMARY KEY (`id_target`),
  ADD KEY `fk_pengumuman_target_pengumuman` (`id_pengumuman`);

--
-- Indeks untuk tabel `permission_overrides`
--
ALTER TABLE `permission_overrides`
  ADD PRIMARY KEY (`id_override`);

--
-- Indeks untuk tabel `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indeks untuk tabel `petugas_keuangan`
--
ALTER TABLE `petugas_keuangan`
  ADD PRIMARY KEY (`id_petugas_keuangan`);

--
-- Indeks untuk tabel `presensi_harian`
--
ALTER TABLE `presensi_harian`
  ADD PRIMARY KEY (`id_presensi_harian`),
  ADD KEY `idx_presensi_harian_tanggal` (`tanggal`),
  ADD KEY `idx_presensi_harian_nis` (`nis`),
  ADD KEY `idx_presensi_harian_status` (`status`);

--
-- Indeks untuk tabel `presensi_mapel`
--
ALTER TABLE `presensi_mapel`
  ADD PRIMARY KEY (`id_presensi_mapel`),
  ADD KEY `fk_presensi_mapel_jurnal` (`id_jurnal`),
  ADD KEY `fk_presensi_mapel_siswa` (`nis`);

--
-- Indeks untuk tabel `rapot`
--
ALTER TABLE `rapot`
  ADD PRIMARY KEY (`id_rapot`),
  ADD KEY `fk_rapot_tahun_ajaran` (`id_tahun_ajaran`),
  ADD KEY `idx_rapot_nis_tahun` (`nis`,`id_tahun_ajaran`),
  ADD KEY `idx_rapot_semester` (`semester`),
  ADD KEY `idx_rapot_status` (`status_rapot`);

--
-- Indeks untuk tabel `rapot_adab_detail`
--
ALTER TABLE `rapot_adab_detail`
  ADD PRIMARY KEY (`id_rapot_adab`),
  ADD KEY `fk_rapot_adab_att` (`id_rapot_att`);

--
-- Indeks untuk tabel `rapot_att`
--
ALTER TABLE `rapot_att`
  ADD PRIMARY KEY (`id_rapot_att`),
  ADD KEY `fk_rapot_att_tahun_ajaran` (`id_tahun_ajaran`),
  ADD KEY `idx_rapot_att_nis_tahun` (`nis`,`id_tahun_ajaran`),
  ADD KEY `idx_rapot_att_semester` (`semester`);

--
-- Indeks untuk tabel `rapot_catatan`
--
ALTER TABLE `rapot_catatan`
  ADD PRIMARY KEY (`id_rapot_catatan`),
  ADD KEY `fk_rapot_catatan_rapot` (`id_rapot`);

--
-- Indeks untuk tabel `rapot_ekstrakurikuler`
--
ALTER TABLE `rapot_ekstrakurikuler`
  ADD PRIMARY KEY (`id_rapot_ekskul`),
  ADD KEY `fk_rapot_ekskul_rapot` (`id_rapot`);

--
-- Indeks untuk tabel `rapot_kehadiran`
--
ALTER TABLE `rapot_kehadiran`
  ADD PRIMARY KEY (`id_rapot_kehadiran`),
  ADD KEY `fk_rapot_kehadiran_rapot` (`id_rapot`);

--
-- Indeks untuk tabel `rapot_nilai`
--
ALTER TABLE `rapot_nilai`
  ADD PRIMARY KEY (`id_rapot_nilai`),
  ADD KEY `fk_rapot_nilai_rapot` (`id_rapot`),
  ADD KEY `fk_rapot_nilai_mata_pelajaran` (`id_mata_pelajaran`);

--
-- Indeks untuk tabel `rapot_tahfidz_detail`
--
ALTER TABLE `rapot_tahfidz_detail`
  ADD PRIMARY KEY (`id_rapot_tahfidz`),
  ADD KEY `fk_rapot_tahfidz_att` (`id_rapot_att`);

--
-- Indeks untuk tabel `rapot_tanse_detail`
--
ALTER TABLE `rapot_tanse_detail`
  ADD PRIMARY KEY (`id_rapot_tanse`),
  ADD KEY `fk_rapot_tanse_att` (`id_rapot_att`);

--
-- Indeks untuk tabel `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indeks untuk tabel `siswa`
--
ALTER TABLE `siswa`
  ADD PRIMARY KEY (`nis`),
  ADD UNIQUE KEY `siswa_barcode_unique` (`barcode`),
  ADD UNIQUE KEY `siswa_rfid_code_unique` (`rfid_code`),
  ADD KEY `fk_siswa_orang_tua` (`id_orang_tua`),
  ADD KEY `idx_siswa_nama` (`nama_lengkap`),
  ADD KEY `idx_siswa_kelas` (`id_kelas`),
  ADD KEY `idx_siswa_jurusan` (`id_jurusan`),
  ADD KEY `idx_siswa_status` (`status`);

--
-- Indeks untuk tabel `tagihan`
--
ALTER TABLE `tagihan`
  ADD PRIMARY KEY (`id_tagihan`),
  ADD KEY `fk_tagihan_jenis_pembayaran` (`id_jenis_pembayaran`),
  ADD KEY `fk_tagihan_tahun_ajaran` (`id_tahun_ajaran`),
  ADD KEY `idx_tagihan_nis` (`nis`),
  ADD KEY `idx_tagihan_status` (`status_tagihan`),
  ADD KEY `idx_tagihan_jatuh_tempo` (`tanggal_jatuh_tempo`),
  ADD KEY `idx_tagihan_bulan` (`bulan_tagihan`);

--
-- Indeks untuk tabel `tahun_ajaran`
--
ALTER TABLE `tahun_ajaran`
  ADD PRIMARY KEY (`id_tahun_ajaran`),
  ADD KEY `idx_tahun_ajaran_status` (`status`),
  ADD KEY `idx_tahun_ajaran_periode` (`tahun_ajaran`,`semester`);

--
-- Indeks untuk tabel `target_hafalan_siswa`
--
ALTER TABLE `target_hafalan_siswa`
  ADD PRIMARY KEY (`id_target_hafalan`),
  ADD KEY `fk_target_hafalan_siswa` (`nis`),
  ADD KEY `fk_target_hafalan_tahun_ajaran` (`id_tahun_ajaran`);

--
-- Indeks untuk tabel `tugas`
--
ALTER TABLE `tugas`
  ADD PRIMARY KEY (`id_tugas`),
  ADD KEY `fk_tugas_mata_pelajaran` (`id_mata_pelajaran`),
  ADD KEY `fk_tugas_tahun_ajaran` (`id_tahun_ajaran`),
  ADD KEY `idx_tugas_deadline` (`tanggal_deadline`),
  ADD KEY `idx_tugas_kelas` (`id_kelas`),
  ADD KEY `idx_tugas_guru` (`nik_guru`);

--
-- Indeks untuk tabel `tugas_adab`
--
ALTER TABLE `tugas_adab`
  ADD PRIMARY KEY (`id_tugas_adab`),
  ADD KEY `fk_tugas_adab_tahun_ajaran` (`id_tahun_ajaran`);

--
-- Indeks untuk tabel `tugas_siswa`
--
ALTER TABLE `tugas_siswa`
  ADD PRIMARY KEY (`id_tugas_siswa`),
  ADD KEY `fk_tugas_siswa_tugas` (`id_tugas`),
  ADD KEY `fk_tugas_siswa_siswa` (`nis`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_user_type` (`user_type`),
  ADD KEY `idx_users_status` (`status`),
  ADD KEY `idx_users_reference_id` (`reference_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `admin`
--
ALTER TABLE `admin`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID admin', AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `evaluasi_hafalan`
--
ALTER TABLE `evaluasi_hafalan`
  MODIFY `id_evaluasi` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID evaluasi', AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `guru_mata_pelajaran`
--
ALTER TABLE `guru_mata_pelajaran`
  MODIFY `id_guru_mapel` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID guru mata pelajaran', AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `hafalan`
--
ALTER TABLE `hafalan`
  MODIFY `id_hafalan` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID hafalan', AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `jadwal_pelajaran`
--
ALTER TABLE `jadwal_pelajaran`
  MODIFY `id_jadwal` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID jadwal', AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT untuk tabel `jenis_pembayaran`
--
ALTER TABLE `jenis_pembayaran`
  MODIFY `id_jenis_pembayaran` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID jenis pembayaran', AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT untuk tabel `jurnal_mengajar`
--
ALTER TABLE `jurnal_mengajar`
  MODIFY `id_jurnal` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID jurnal', AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT untuk tabel `jurusan`
--
ALTER TABLE `jurusan`
  MODIFY `id_jurusan` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID jurusan', AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `kelas`
--
ALTER TABLE `kelas`
  MODIFY `id_kelas` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID kelas', AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `kelas_siswa`
--
ALTER TABLE `kelas_siswa`
  MODIFY `id_kelas_siswa` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID kelas siswa', AUTO_INCREMENT=189;

--
-- AUTO_INCREMENT untuk tabel `kepala_sekolah`
--
ALTER TABLE `kepala_sekolah`
  MODIFY `id_kepala_sekolah` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID kepala sekolah', AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `kurikulum`
--
ALTER TABLE `kurikulum`
  MODIFY `id_kurikulum` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID kurikulum', AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `laporan`
--
ALTER TABLE `laporan`
  MODIFY `id_laporan` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID laporan';

--
-- AUTO_INCREMENT untuk tabel `laporan_presensi_detail`
--
ALTER TABLE `laporan_presensi_detail`
  MODIFY `id_laporan_presensi` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID laporan presensi';

--
-- AUTO_INCREMENT untuk tabel `laporan_statistik`
--
ALTER TABLE `laporan_statistik`
  MODIFY `id_statistik` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID statistik';

--
-- AUTO_INCREMENT untuk tabel `laporan_tahfidz_detail`
--
ALTER TABLE `laporan_tahfidz_detail`
  MODIFY `id_laporan_tahfidz` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID laporan tahfidz';

--
-- AUTO_INCREMENT untuk tabel `mata_pelajaran`
--
ALTER TABLE `mata_pelajaran`
  MODIFY `id_mata_pelajaran` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID mata pelajaran', AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT untuk tabel `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT untuk tabel `monitoring_adab`
--
ALTER TABLE `monitoring_adab`
  MODIFY `id_monitoring_adab` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID monitoring adab', AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `monitoring_sholat`
--
ALTER TABLE `monitoring_sholat`
  MODIFY `id_monitoring_sholat` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID monitoring sholat', AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `nilai`
--
ALTER TABLE `nilai`
  MODIFY `id_nilai` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID nilai';

--
-- AUTO_INCREMENT untuk tabel `orang_tua`
--
ALTER TABLE `orang_tua`
  MODIFY `id_orang_tua` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID orang tua', AUTO_INCREMENT=589;

--
-- AUTO_INCREMENT untuk tabel `pelanggaran`
--
ALTER TABLE `pelanggaran`
  MODIFY `id_pelanggaran` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID pelanggaran';

--
-- AUTO_INCREMENT untuk tabel `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id_pembayaran` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID pembayaran';

--
-- AUTO_INCREMENT untuk tabel `pengumpulan_tugas`
--
ALTER TABLE `pengumpulan_tugas`
  MODIFY `id_pengumpulan` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID pengumpulan', AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `pengumuman`
--
ALTER TABLE `pengumuman`
  MODIFY `id_pengumuman` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID pengumuman';

--
-- AUTO_INCREMENT untuk tabel `pengumuman_target`
--
ALTER TABLE `pengumuman_target`
  MODIFY `id_target` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID target';

--
-- AUTO_INCREMENT untuk tabel `permission_overrides`
--
ALTER TABLE `permission_overrides`
  MODIFY `id_override` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT untuk tabel `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `petugas_keuangan`
--
ALTER TABLE `petugas_keuangan`
  MODIFY `id_petugas_keuangan` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID petugas keuangan', AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT untuk tabel `presensi_harian`
--
ALTER TABLE `presensi_harian`
  MODIFY `id_presensi_harian` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID presensi harian', AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `presensi_mapel`
--
ALTER TABLE `presensi_mapel`
  MODIFY `id_presensi_mapel` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID presensi mapel';

--
-- AUTO_INCREMENT untuk tabel `rapot`
--
ALTER TABLE `rapot`
  MODIFY `id_rapot` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID rapot';

--
-- AUTO_INCREMENT untuk tabel `rapot_adab_detail`
--
ALTER TABLE `rapot_adab_detail`
  MODIFY `id_rapot_adab` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID rapot adab';

--
-- AUTO_INCREMENT untuk tabel `rapot_att`
--
ALTER TABLE `rapot_att`
  MODIFY `id_rapot_att` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID rapot ATT';

--
-- AUTO_INCREMENT untuk tabel `rapot_catatan`
--
ALTER TABLE `rapot_catatan`
  MODIFY `id_rapot_catatan` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID rapot catatan';

--
-- AUTO_INCREMENT untuk tabel `rapot_ekstrakurikuler`
--
ALTER TABLE `rapot_ekstrakurikuler`
  MODIFY `id_rapot_ekskul` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID rapot ekstrakurikuler';

--
-- AUTO_INCREMENT untuk tabel `rapot_kehadiran`
--
ALTER TABLE `rapot_kehadiran`
  MODIFY `id_rapot_kehadiran` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID rapot kehadiran';

--
-- AUTO_INCREMENT untuk tabel `rapot_nilai`
--
ALTER TABLE `rapot_nilai`
  MODIFY `id_rapot_nilai` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID rapot nilai';

--
-- AUTO_INCREMENT untuk tabel `rapot_tahfidz_detail`
--
ALTER TABLE `rapot_tahfidz_detail`
  MODIFY `id_rapot_tahfidz` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID rapot tahfidz';

--
-- AUTO_INCREMENT untuk tabel `rapot_tanse_detail`
--
ALTER TABLE `rapot_tanse_detail`
  MODIFY `id_rapot_tanse` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID rapot tanse';

--
-- AUTO_INCREMENT untuk tabel `tagihan`
--
ALTER TABLE `tagihan`
  MODIFY `id_tagihan` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID tagihan';

--
-- AUTO_INCREMENT untuk tabel `tahun_ajaran`
--
ALTER TABLE `tahun_ajaran`
  MODIFY `id_tahun_ajaran` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID tahun ajaran', AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT untuk tabel `target_hafalan_siswa`
--
ALTER TABLE `target_hafalan_siswa`
  MODIFY `id_target_hafalan` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID target hafalan', AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `tugas`
--
ALTER TABLE `tugas`
  MODIFY `id_tugas` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID tugas', AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT untuk tabel `tugas_adab`
--
ALTER TABLE `tugas_adab`
  MODIFY `id_tugas_adab` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID tugas adab', AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT untuk tabel `tugas_siswa`
--
ALTER TABLE `tugas_siswa`
  MODIFY `id_tugas_siswa` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID tugas siswa', AUTO_INCREMENT=223;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `evaluasi_hafalan`
--
ALTER TABLE `evaluasi_hafalan`
  ADD CONSTRAINT `fk_evaluasi_hafalan_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_evaluasi_hafalan_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `guru_mata_pelajaran`
--
ALTER TABLE `guru_mata_pelajaran`
  ADD CONSTRAINT `fk_guru_mapel_guru` FOREIGN KEY (`nik_guru`) REFERENCES `guru` (`nik_guru`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_guru_mapel_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `hafalan`
--
ALTER TABLE `hafalan`
  ADD CONSTRAINT `fk_hafalan_guru` FOREIGN KEY (`nik_guru_penguji`) REFERENCES `guru` (`nik_guru`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_hafalan_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `jadwal_pelajaran`
--
ALTER TABLE `jadwal_pelajaran`
  ADD CONSTRAINT `fk_jadwal_guru` FOREIGN KEY (`nik_guru`) REFERENCES `guru` (`nik_guru`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jadwal_kelas` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jadwal_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jadwal_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `jurnal_mengajar`
--
ALTER TABLE `jurnal_mengajar`
  ADD CONSTRAINT `fk_jurnal_guru` FOREIGN KEY (`nik_guru`) REFERENCES `guru` (`nik_guru`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_jurnal_jadwal` FOREIGN KEY (`id_jadwal`) REFERENCES `jadwal_pelajaran` (`id_jadwal`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `kelas`
--
ALTER TABLE `kelas`
  ADD CONSTRAINT `fk_kelas_jurusan` FOREIGN KEY (`id_jurusan`) REFERENCES `jurusan` (`id_jurusan`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kelas_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kelas_wali_kelas` FOREIGN KEY (`wali_kelas`) REFERENCES `guru` (`nik_guru`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `kurikulum`
--
ALTER TABLE `kurikulum`
  ADD CONSTRAINT `fk_kurikulum_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kurikulum_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `laporan`
--
ALTER TABLE `laporan`
  ADD CONSTRAINT `fk_laporan_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_laporan_user` FOREIGN KEY (`id_user_generate`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `laporan_presensi_detail`
--
ALTER TABLE `laporan_presensi_detail`
  ADD CONSTRAINT `fk_laporan_presensi_laporan` FOREIGN KEY (`id_laporan`) REFERENCES `laporan` (`id_laporan`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_laporan_presensi_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `laporan_statistik`
--
ALTER TABLE `laporan_statistik`
  ADD CONSTRAINT `fk_laporan_statistik_laporan` FOREIGN KEY (`id_laporan`) REFERENCES `laporan` (`id_laporan`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `laporan_tahfidz_detail`
--
ALTER TABLE `laporan_tahfidz_detail`
  ADD CONSTRAINT `fk_laporan_tahfidz_laporan` FOREIGN KEY (`id_laporan`) REFERENCES `laporan` (`id_laporan`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_laporan_tahfidz_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `monitoring_adab`
--
ALTER TABLE `monitoring_adab`
  ADD CONSTRAINT `fk_monitoring_adab_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_monitoring_adab_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_monitoring_adab_tugas` FOREIGN KEY (`id_tugas_adab`) REFERENCES `tugas_adab` (`id_tugas_adab`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `monitoring_sholat`
--
ALTER TABLE `monitoring_sholat`
  ADD CONSTRAINT `fk_monitoring_sholat_guru` FOREIGN KEY (`nik_guru_input`) REFERENCES `guru` (`nik_guru`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_monitoring_sholat_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `nilai`
--
ALTER TABLE `nilai`
  ADD CONSTRAINT `fk_nilai_guru` FOREIGN KEY (`nik_guru_penginput`) REFERENCES `guru` (`nik_guru`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nilai_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `pelanggaran`
--
ALTER TABLE `pelanggaran`
  ADD CONSTRAINT `fk_pelanggaran_guru` FOREIGN KEY (`nik_guru_input`) REFERENCES `guru` (`nik_guru`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pelanggaran_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `fk_pembayaran_tagihan` FOREIGN KEY (`id_tagihan`) REFERENCES `tagihan` (`id_tagihan`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pembayaran_user` FOREIGN KEY (`id_user_petugas`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `pengumpulan_tugas`
--
ALTER TABLE `pengumpulan_tugas`
  ADD CONSTRAINT `fk_pengumpulan_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pengumpulan_tugas` FOREIGN KEY (`id_tugas`) REFERENCES `tugas` (`id_tugas`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `pengumuman`
--
ALTER TABLE `pengumuman`
  ADD CONSTRAINT `fk_pengumuman_user` FOREIGN KEY (`id_user_pembuat`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `pengumuman_target`
--
ALTER TABLE `pengumuman_target`
  ADD CONSTRAINT `fk_pengumuman_target_pengumuman` FOREIGN KEY (`id_pengumuman`) REFERENCES `pengumuman` (`id_pengumuman`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `presensi_harian`
--
ALTER TABLE `presensi_harian`
  ADD CONSTRAINT `fk_presensi_harian_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `presensi_mapel`
--
ALTER TABLE `presensi_mapel`
  ADD CONSTRAINT `fk_presensi_mapel_jurnal` FOREIGN KEY (`id_jurnal`) REFERENCES `jurnal_mengajar` (`id_jurnal`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_presensi_mapel_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rapot`
--
ALTER TABLE `rapot`
  ADD CONSTRAINT `fk_rapot_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rapot_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rapot_adab_detail`
--
ALTER TABLE `rapot_adab_detail`
  ADD CONSTRAINT `fk_rapot_adab_att` FOREIGN KEY (`id_rapot_att`) REFERENCES `rapot_att` (`id_rapot_att`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rapot_att`
--
ALTER TABLE `rapot_att`
  ADD CONSTRAINT `fk_rapot_att_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rapot_att_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rapot_catatan`
--
ALTER TABLE `rapot_catatan`
  ADD CONSTRAINT `fk_rapot_catatan_rapot` FOREIGN KEY (`id_rapot`) REFERENCES `rapot` (`id_rapot`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rapot_ekstrakurikuler`
--
ALTER TABLE `rapot_ekstrakurikuler`
  ADD CONSTRAINT `fk_rapot_ekskul_rapot` FOREIGN KEY (`id_rapot`) REFERENCES `rapot` (`id_rapot`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rapot_kehadiran`
--
ALTER TABLE `rapot_kehadiran`
  ADD CONSTRAINT `fk_rapot_kehadiran_rapot` FOREIGN KEY (`id_rapot`) REFERENCES `rapot` (`id_rapot`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rapot_nilai`
--
ALTER TABLE `rapot_nilai`
  ADD CONSTRAINT `fk_rapot_nilai_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rapot_nilai_rapot` FOREIGN KEY (`id_rapot`) REFERENCES `rapot` (`id_rapot`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rapot_tahfidz_detail`
--
ALTER TABLE `rapot_tahfidz_detail`
  ADD CONSTRAINT `fk_rapot_tahfidz_att` FOREIGN KEY (`id_rapot_att`) REFERENCES `rapot_att` (`id_rapot_att`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `rapot_tanse_detail`
--
ALTER TABLE `rapot_tanse_detail`
  ADD CONSTRAINT `fk_rapot_tanse_att` FOREIGN KEY (`id_rapot_att`) REFERENCES `rapot_att` (`id_rapot_att`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `siswa`
--
ALTER TABLE `siswa`
  ADD CONSTRAINT `fk_siswa_jurusan` FOREIGN KEY (`id_jurusan`) REFERENCES `jurusan` (`id_jurusan`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_siswa_kelas` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_siswa_orang_tua` FOREIGN KEY (`id_orang_tua`) REFERENCES `orang_tua` (`id_orang_tua`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `tagihan`
--
ALTER TABLE `tagihan`
  ADD CONSTRAINT `fk_tagihan_jenis_pembayaran` FOREIGN KEY (`id_jenis_pembayaran`) REFERENCES `jenis_pembayaran` (`id_jenis_pembayaran`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tagihan_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tagihan_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `target_hafalan_siswa`
--
ALTER TABLE `target_hafalan_siswa`
  ADD CONSTRAINT `fk_target_hafalan_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_target_hafalan_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `tugas`
--
ALTER TABLE `tugas`
  ADD CONSTRAINT `fk_tugas_guru` FOREIGN KEY (`nik_guru`) REFERENCES `guru` (`nik_guru`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tugas_kelas` FOREIGN KEY (`id_kelas`) REFERENCES `kelas` (`id_kelas`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tugas_mata_pelajaran` FOREIGN KEY (`id_mata_pelajaran`) REFERENCES `mata_pelajaran` (`id_mata_pelajaran`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tugas_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `tugas_adab`
--
ALTER TABLE `tugas_adab`
  ADD CONSTRAINT `fk_tugas_adab_tahun_ajaran` FOREIGN KEY (`id_tahun_ajaran`) REFERENCES `tahun_ajaran` (`id_tahun_ajaran`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Ketidakleluasaan untuk tabel `tugas_siswa`
--
ALTER TABLE `tugas_siswa`
  ADD CONSTRAINT `fk_tugas_siswa_siswa` FOREIGN KEY (`nis`) REFERENCES `siswa` (`nis`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tugas_siswa_tugas` FOREIGN KEY (`id_tugas`) REFERENCES `tugas` (`id_tugas`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
