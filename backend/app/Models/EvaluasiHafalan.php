<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class EvaluasiHafalan extends Model
{
    protected $table = 'evaluasi_hafalan';
    protected $primaryKey = 'id_evaluasi';
    public $timestamps = false;

    protected $fillable = [
        'nis',
        'periode_evaluasi',
        'bulan_periode',
        'total_baris_target',
        'target_surah_mulai',
        'target_ayat_mulai',
        'target_surah_selesai',
        'target_ayat_selesai',
        'total_baris_tercapai',
        'tercapai_surah_mulai',
        'tercapai_ayat_mulai',
        'tercapai_surah_selesai',
        'tercapai_ayat_selesai',
        'status_ketuntasan',
        'id_tahun_ajaran'
    ];

    protected $casts = [
        'id_evaluasi' => 'integer',
        'id_tahun_ajaran' => 'integer',
        'total_baris_target' => 'integer',
        'target_ayat_mulai' => 'integer',
        'target_ayat_selesai' => 'integer',
        'total_baris_tercapai' => 'integer',
        'tercapai_ayat_mulai' => 'integer',
        'tercapai_ayat_selesai' => 'integer',
        'periode_evaluasi' => 'string',
        'status_ketuntasan' => 'string',
        'nis' => 'string'
    ];

    /**
     * Relationship with TahunAjaran
     */
    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun_ajaran', 'id_tahun_ajaran');
    }

    /**
     * Get siswa data (using direct query since no Siswa model exists)
     */
    public function getSiswaData()
    {
        return DB::table('siswa')->where('nis', $this->nis)->first();
    }

    /**
     * Scope a query to filter by siswa.
     */
    public function scopeBySiswa($query, $nis)
    {
        return $query->where('nis', $nis);
    }

    /**
     * Scope a query to filter by tahun ajaran.
     */
    public function scopeByTahunAjaran($query, $idTahunAjaran)
    {
        return $query->where('id_tahun_ajaran', $idTahunAjaran);
    }

    /**
     * Scope a query to filter by periode evaluasi.
     */
    public function scopeByPeriode($query, $periode)
    {
        return $query->where('periode_evaluasi', $periode);
    }

    /**
     * Scope a query to filter by status ketuntasan.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status_ketuntasan', $status);
    }

    /**
     * Get periode evaluasi options
     */
    public static function getPeriodeOptions()
    {
        return [
            'Bulanan' => 'Bulanan',
            '3_Bulanan' => '3 Bulanan',
            'Semesteran' => 'Semesteran'
        ];
    }

    /**
     * Get status ketuntasan options
     */
    public static function getStatusKetuntasanOptions()
    {
        return [
            'Tuntas' => 'Tuntas',
            'Belum_Tuntas' => 'Belum Tuntas'
        ];
    }

    /**
     * Get formatted periode evaluasi
     */
    public function getFormattedPeriodeAttribute()
    {
        return str_replace('_', ' ', $this->periode_evaluasi);
    }

    /**
     * Get formatted status ketuntasan
     */
    public function getFormattedStatusAttribute()
    {
        return str_replace('_', ' ', $this->status_ketuntasan);
    }

    /**
     * Calculate percentage of achievement
     */
    public function getPersentaseKetercapaianAttribute()
    {
        if ($this->total_baris_target == 0) {
            return 0;
        }
        
        return round(($this->total_baris_tercapai / $this->total_baris_target) * 100, 2);
    }
}