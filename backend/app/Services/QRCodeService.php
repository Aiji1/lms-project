<?php

namespace App\Services;

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class QRCodeService
{
    /**
     * Generate QR Code untuk satu siswa
     */
    public function generateStudentQRCode(string $nis, bool $regenerate = false): array
    {
        try {
            // Get student data
            $student = DB::table('siswa')
                ->join('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->join('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->where('siswa.nis', $nis)
                ->select(
                    'siswa.nis',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->first();

            if (!$student) {
                return [
                    'success' => false,
                    'message' => 'Siswa tidak ditemukan'
                ];
            }

            // Check if QR already exists
            $qrPath = "qrcodes/students/{$nis}.svg"; // ✅ Changed to SVG
            $fullPath = storage_path("app/public/{$qrPath}");

            if (file_exists($fullPath) && !$regenerate) {
                return [
                    'success' => true,
                    'message' => 'QR Code sudah ada',
                    'data' => [
                        'nis' => $nis,
                        'nama_lengkap' => $student->nama_lengkap,
                        'kelas' => $student->nama_kelas,
                        'jurusan' => $student->nama_jurusan,
                        'qr_code_path' => $qrPath,
                        'qr_code_url' => Storage::url($qrPath),
                        'regenerated' => false
                    ]
                ];
            }

            // Ensure directory exists
            $directory = dirname($fullPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // QR Code content (simple NIS format untuk scan)
            $qrContent = $nis;

            // Generate QR Code (SVG format - no extension needed)
            QrCode::format('svg')
                ->size(300)
                ->margin(2)
                ->errorCorrection('H')
                ->generate($qrContent, $fullPath);

            return [
                'success' => true,
                'message' => 'QR Code berhasil di-generate',
                'data' => [
                    'nis' => $nis,
                    'nama_lengkap' => $student->nama_lengkap,
                    'kelas' => $student->nama_kelas,
                    'jurusan' => $student->nama_jurusan,
                    'qr_code_path' => $qrPath,
                    'qr_code_url' => Storage::url($qrPath),
                    'regenerated' => $regenerate
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate QR Code untuk semua siswa
     */
    public function generateAllStudentQRCodes(bool $regenerate = false): array
    {
        try {
            $students = DB::table('siswa')
                ->select('nis', 'nama_lengkap')
                ->get();

            $results = [
                'total' => $students->count(),
                'success' => 0,
                'failed' => 0,
                'skipped' => 0,
                'details' => []
            ];

            foreach ($students as $student) {
                $result = $this->generateStudentQRCode($student->nis, $regenerate);
                
                if ($result['success']) {
                    if (isset($result['data']['regenerated']) && !$result['data']['regenerated']) {
                        $results['skipped']++;
                    } else {
                        $results['success']++;
                    }
                } else {
                    $results['failed']++;
                }

                $results['details'][] = [
                    'nis' => $student->nis,
                    'nama' => $student->nama_lengkap,
                    'status' => $result['success'] ? 'success' : 'failed',
                    'message' => $result['message']
                ];
            }

            return [
                'success' => true,
                'message' => "Proses selesai: {$results['success']} berhasil, {$results['failed']} gagal, {$results['skipped']} sudah ada",
                'data' => $results
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get QR Code info untuk satu siswa
     */
    public function getStudentQRCodeInfo(string $nis): array
    {
        try {
            $student = DB::table('siswa')
                ->join('kelas', 'siswa.id_kelas', '=', 'kelas.id_kelas')
                ->join('jurusan', 'kelas.id_jurusan', '=', 'jurusan.id_jurusan')
                ->where('siswa.nis', $nis)
                ->select(
                    'siswa.nis',
                    'siswa.nama_lengkap',
                    'kelas.nama_kelas',
                    'jurusan.nama_jurusan'
                )
                ->first();

            if (!$student) {
                return [
                    'success' => false,
                    'message' => 'Siswa tidak ditemukan'
                ];
            }

            $qrPath = "qrcodes/students/{$nis}.svg";
            $fullPath = storage_path("app/public/{$qrPath}");
            $exists = file_exists($fullPath);

            return [
                'success' => true,
                'data' => [
                    'nis' => $nis,
                    'nama_lengkap' => $student->nama_lengkap,
                    'kelas' => $student->nama_kelas,
                    'jurusan' => $student->nama_jurusan,
                    'qr_code_exists' => $exists,
                    'qr_code_path' => $exists ? $qrPath : null,
                    'qr_code_url' => $exists ? Storage::url($qrPath) : null,
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete QR Code untuk satu siswa
     */
    public function deleteStudentQRCode(string $nis): array
    {
        try {
            $qrPath = "qrcodes/students/{$nis}.svg";
            $fullPath = storage_path("app/public/{$qrPath}");

            if (!file_exists($fullPath)) {
                return [
                    'success' => false,
                    'message' => 'QR Code tidak ditemukan'
                ];
            }

            unlink($fullPath);

            return [
                'success' => true,
                'message' => 'QR Code berhasil dihapus'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate QR Code dengan custom data (untuk testing)
     */
    public function generateCustomQRCode(string $content, string $filename): array
    {
        try {
            $qrPath = "qrcodes/custom/{$filename}.svg";
            $fullPath = storage_path("app/public/{$qrPath}");

            // Ensure directory exists
            $directory = dirname($fullPath);
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // Generate QR Code (SVG format)
            QrCode::format('svg')
                ->size(300)
                ->margin(2)
                ->errorCorrection('H')
                ->generate($content, $fullPath);

            return [
                'success' => true,
                'message' => 'QR Code berhasil di-generate',
                'data' => [
                    'filename' => $filename,
                    'content' => $content,
                    'qr_code_path' => $qrPath,
                    'qr_code_url' => Storage::url($qrPath)
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
    }
}