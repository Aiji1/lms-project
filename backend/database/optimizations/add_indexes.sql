-- ============================================
-- LMS Database Performance Optimization
-- Add Missing Indexes
-- ============================================

-- 1. Permission Overrides Table
ALTER TABLE permission_overrides 
ADD INDEX idx_target_type (target_type);

ALTER TABLE permission_overrides 
ADD INDEX idx_target_id (target_id);

ALTER TABLE permission_overrides 
ADD INDEX idx_resource_key (resource_key);

-- Composite index untuk query yang sering digunakan
ALTER TABLE permission_overrides 
ADD INDEX idx_target_type_id (target_type, target_id);

-- 2. Tagihan Table
ALTER TABLE tagihan 
ADD INDEX idx_nis (nis);

ALTER TABLE tagihan 
ADD INDEX idx_jenis_pembayaran (id_jenis_pembayaran);

ALTER TABLE tagihan 
ADD INDEX idx_status (status_tagihan);

ALTER TABLE tagihan 
ADD INDEX idx_tanggal (tanggal_jatuh_tempo);

-- Composite index untuk query JOIN dengan siswa
ALTER TABLE tagihan 
ADD INDEX idx_nis_status (nis, status_tagihan);

-- 3. Pembayaran Table
ALTER TABLE pembayaran 
ADD INDEX idx_tagihan (id_tagihan);

ALTER TABLE pembayaran 
ADD INDEX idx_tanggal (tanggal_bayar);

-- 4. Users Table - Optimize token lookup
ALTER TABLE users 
ADD INDEX idx_remember_token (remember_token);

-- 5. Presensi Harian - untuk query tanggal
ALTER TABLE presensi_harian 
ADD INDEX idx_tanggal (tanggal);

ALTER TABLE presensi_harian 
ADD INDEX idx_nis_tanggal (nis, tanggal);

-- 6. Jenis Pembayaran Tables
ALTER TABLE jenis_pembayaran 
ADD INDEX idx_active (is_active);

ALTER TABLE jenis_pembayaran 
ADD INDEX idx_tahun_ajaran (id_tahun_ajaran);

ALTER TABLE jenis_pembayaran_kelas 
ADD INDEX idx_jp_kelas_jenis (id_jenis_pembayaran);

ALTER TABLE jenis_pembayaran_kelas 
ADD INDEX idx_jp_kelas_kelas (id_kelas);

ALTER TABLE jenis_pembayaran_siswa 
ADD INDEX idx_jp_siswa_jenis (id_jenis_pembayaran);

ALTER TABLE jenis_pembayaran_siswa 
ADD INDEX idx_jp_siswa_nis (nis);
