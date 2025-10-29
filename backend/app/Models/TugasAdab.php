<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TugasAdab extends Model
{
    protected $table = 'tugas_adab';
    protected $primaryKey = 'id_tugas_adab';
    public $timestamps = false;

    protected $fillable = [
        'nama_tugas',
        'deskripsi_tugas',
        'id_tahun_ajaran',
        'status'
    ];

    protected $casts = [
        'id_tugas_adab' => 'integer',
        'id_tahun_ajaran' => 'integer',
        'status' => 'string'
    ];

    /**
     * Relationship with TahunAjaran
     */
    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun_ajaran', 'id_tahun_ajaran');
    }

    /**
     * Relationship with MonitoringAdab (will be implemented later)
     */
    // public function monitoringAdab()
    // {
    //     return $this->hasMany(MonitoringAdab::class, 'id_tugas_adab', 'id_tugas_adab');
    // }

    /**
     * Scope a query to only include active tugas adab.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Aktif');
    }

    /**
     * Scope a query to filter by tahun ajaran.
     */
    public function scopeByTahunAjaran($query, $tahunAjaranId)
    {
        return $query->where('id_tahun_ajaran', $tahunAjaranId);
    }

    /**
     * Scope a query to search by nama tugas.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where('nama_tugas', 'LIKE', "%{$search}%")
                    ->orWhere('deskripsi_tugas', 'LIKE', "%{$search}%");
    }
}