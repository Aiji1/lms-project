<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class TargetHafalanSiswa extends Model
{
    protected $table = 'target_hafalan_siswa';
    protected $primaryKey = 'id_target_hafalan';
    public $timestamps = false;

    protected $fillable = [
        'nis',
        'id_tahun_ajaran',
        'target_baris_perpertemuan',
        'status'
    ];

    protected $casts = [
        'id_target_hafalan' => 'integer',
        'id_tahun_ajaran' => 'integer',
        'target_baris_perpertemuan' => 'integer',
        'status' => 'string',
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
     * Scope a query to only include active targets.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Aktif');
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
     * Get target baris options
     */
    public static function getTargetBarisOptions()
    {
        return [
            '3' => '3 Baris',
            '5' => '5 Baris',
            '7' => '7 Baris'
        ];
    }

    /**
     * Get status options
     */
    public static function getStatusOptions()
    {
        return [
            'Aktif' => 'Aktif',
            'Non-aktif' => 'Non-aktif'
        ];
    }
}