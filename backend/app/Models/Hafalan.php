<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Hafalan extends Model
{
    protected $table = 'hafalan';
    protected $primaryKey = 'id_hafalan';
    public $timestamps = false;

    protected $fillable = [
        'nis',
        'nama_surah',
        'ayat_mulai',
        'ayat_selesai',
        'jumlah_baris',
        'tanggal_setoran',
        'status_hafalan',
        'nik_guru_penguji'
    ];

    protected $casts = [
        'id_hafalan' => 'integer',
        'ayat_mulai' => 'integer',
        'ayat_selesai' => 'integer',
        'jumlah_baris' => 'integer',
        'tanggal_setoran' => 'date',
        'status_hafalan' => 'string',
        'nis' => 'string',
        'nik_guru_penguji' => 'string'
    ];

    /**
     * Get siswa data (using direct query since no Siswa model exists)
     */
    public function getSiswaData()
    {
        return DB::table('siswa')->where('nis', $this->nis)->first();
    }

    /**
     * Relationship with Guru (through nik_guru_penguji)
     */
    public function guruPenguji()
    {
        return $this->belongsTo(Guru::class, 'nik_guru_penguji', 'nik');
    }

    /**
     * Scope a query to only include hafalan with specific status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status_hafalan', $status);
    }

    /**
     * Scope a query to filter by siswa.
     */
    public function scopeBySiswa($query, $nis)
    {
        return $query->where('nis', $nis);
    }

    /**
     * Scope a query to filter by guru penguji.
     */
    public function scopeByGuruPenguji($query, $nik)
    {
        return $query->where('nik_guru_penguji', $nik);
    }

    /**
     * Scope a query to filter by surah.
     */
    public function scopeBySurah($query, $surah)
    {
        return $query->where('nama_surah', $surah);
    }

    /**
     * Scope a query to filter by date range.
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('tanggal_setoran', [$startDate, $endDate]);
    }

    /**
     * Get hafalan status options
     */
    public static function getStatusOptions()
    {
        return [
            'Lancar' => 'Lancar',
            'Kurang_Lancar' => 'Kurang Lancar',
            'Belum_Lancar' => 'Belum Lancar'
        ];
    }

    /**
     * Get formatted status hafalan
     */
    public function getFormattedStatusAttribute()
    {
        return str_replace('_', ' ', $this->status_hafalan);
    }
}