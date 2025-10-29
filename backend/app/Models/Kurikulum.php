<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Kurikulum extends Model
{
    protected $table = 'kurikulum';
    protected $primaryKey = 'id_kurikulum';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_tahun_ajaran',
        'id_mata_pelajaran',
        'tingkat_kelas',
        'rombel',
        'status',
        'sks_jam_perminggu'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tingkat_kelas' => 'string',
        'rombel' => 'string',
        'status' => 'string',
        'sks_jam_perminggu' => 'integer'
    ];

    /**
     * Get the tahun ajaran that owns the kurikulum.
     */
    public function tahunAjaran(): BelongsTo
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun_ajaran', 'id_tahun_ajaran');
    }

    /**
     * Get the mata pelajaran that owns the kurikulum.
     */
    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mata_pelajaran', 'id_mata_pelajaran');
    }

    /**
     * Scope a query to only include active kurikulum.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Aktif');
    }

    /**
     * Scope a query to filter by tingkat kelas.
     */
    public function scopeByTingkat($query, $tingkat)
    {
        return $query->where('tingkat_kelas', $tingkat);
    }

    /**
     * Scope a query to filter by rombel.
     */
    public function scopeByRombel($query, $rombel)
    {
        return $query->where('rombel', $rombel);
    }

    /**
     * Scope a query to filter by tahun ajaran.
     */
    public function scopeByTahunAjaran($query, $tahunAjaranId)
    {
        return $query->where('id_tahun_ajaran', $tahunAjaranId);
    }
}